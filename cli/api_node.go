package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/terotoi/koticloud/server/api"
	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
)

// apiNodeIDForPath returns an ID for a path relative to the user's root directory.
func apiNodeIDForPath(path, authToken, baseURL string) (int, error) {
	client := http.Client{}

	body, err := PostJSON(&client, fmt.Sprintf("%s/node/id_for", baseURL),
		authToken, path)
	if err != nil {
		return -1, err
	}

	var id int
	if err := json.Unmarshal(body, &id); err != nil {
		return -1, err
	}

	return id, nil
}

// apiInfo requests information about one node from the server.
func apiInfo(id int, authToken, baseURL string) (*fs.NodeWithProgress, error) {
	client := http.Client{}

	body, err := RequestURL(&client, fmt.Sprintf("%s/node/info/%d", baseURL, id),
		"application/json", authToken, nil, nil)
	if err != nil {
		return nil, err
	}

	var rs fs.NodeWithProgress
	if err := json.Unmarshal(body, &rs); err != nil {
		return nil, err
	}
	return &rs, nil
}

// apiList requests a directory listing.
func apiList(path, authToken, baseURL string) (*models.Node, []*fs.NodeWithProgress, error) {
	id, err := apiNodeIDForPath(path, authToken, baseURL)
	if err != nil {
		return nil, nil, err
	}

	client := http.Client{}
	res, err := RequestURL(&client, fmt.Sprintf("%s/node/ls/%d", baseURL, id),
		"application/json", authToken, nil, nil)
	if err != nil {
		return nil, nil, err
	}

	var resp api.ListDirResponse
	if err := json.Unmarshal(res, &resp); err != nil {
		return nil, nil, err
	}
	return &resp.Dir, resp.Children, nil
}

// apiGet downloads a node.
func apiGet(id int, authToken, baseURL string) (string, error) {
	// Query filename
	node, err := apiInfo(id, authToken, baseURL)
	if err != nil {
		return "", err
	}

	client := http.Client{}
	fh, err := os.Create(fmt.Sprintf("%s", node.Name))
	if err != nil {
		return "", err
	}

	_, err = RequestURL(&client, fmt.Sprintf("%s/node/get/%d", baseURL, id),
		"application/json", authToken, nil, fh)
	if err != nil {
		return "", err
	}

	return node.Name, nil
}

// apiMakeDir requests a directory to be created on the server.
func apiMakeDir(path string, authToken, baseURL string) (*models.Node, error) {
	client := http.Client{}

	dir := filepath.Dir(path)
	name := filepath.Base(path)

	parentID, err := apiNodeIDForPath(dir, authToken, baseURL)
	if err != nil {
		return nil, err
	}

	res, err := PostJSON(&client, fmt.Sprintf("%s/node/mkdir", baseURL),
		authToken, api.MakeDirRequest{
			ParentID: parentID,
			Name:     name,
		})

	if err != nil {
		return nil, err
	}

	var node models.Node
	if err := json.Unmarshal(res, &node); err != nil {
		return nil, err
	}

	return &node, nil
}

// apiCopy copies a node. Both srcPath and dstPath must be full paths including
// the filenames.
func apiCopy(srcPath, dstPath, newName string, move bool, authToken, baseURL string) ([]*models.Node, error) {
	srcID, err := apiNodeIDForPath(srcPath, authToken, baseURL)
	if err != nil {
		return nil, err
	}

	destID, err := apiNodeIDForPath(dstPath, authToken, baseURL)
	if err != nil {
		return nil, err
	}

	var req interface{}
	if move {
		req = api.MoveRequest{
			SourceID: srcID,
			DestID:   destID,
		}
	} else {
		req = api.CopyRequest{
			SourceID: srcID,
			DestID:   destID,
			NewName:  newName,
		}
	}

	cmd := "copy"
	if move {
		cmd = "move"
	}

	client := http.Client{}
	res, err := PostJSON(&client, fmt.Sprintf("%s/node/%s", baseURL, cmd), authToken, req)
	if err != nil {
		return nil, err
	}

	var nodes []*models.Node
	if err := json.Unmarshal(res, &nodes); err != nil {
		return nil, err
	}

	return nodes, nil
}

// apiMove a node. Both srcPath and dstPath must be full paths including
// the filenames.
func apiMove(srcPath, dstPath, newName string, authToken, baseURL string) ([]models.Node, error) {
	srcID, err := apiNodeIDForPath(srcPath, authToken, baseURL)
	if err != nil {
		return nil, err
	}

	destID, err := apiNodeIDForPath(dstPath, authToken, baseURL)
	if err != nil {
		return nil, err
	}

	req := api.MoveRequest{
		SourceID: srcID,
		DestID:   destID,
	}

	client := http.Client{}
	res, err := PostJSON(&client, fmt.Sprintf("%s/node/move", baseURL), authToken, req)
	if err != nil {
		return nil, err
	}

	var nodes []models.Node
	if err := json.Unmarshal(res, &nodes); err != nil {
		return nil, err
	}

	return nodes, nil
}

// apiRename sends a node rename request
func apiRename(path, newName string, authToken, baseURL string) ([]models.Node, error) {
	id, err := apiNodeIDForPath(path, authToken, baseURL)
	if err != nil {
		return nil, err
	}

	req := api.RenameRequest{
		ID:      id,
		NewName: newName,
	}

	client := http.Client{}
	res, err := PostJSON(&client, fmt.Sprintf("%s/node/rename", baseURL), authToken, req)
	if err != nil {
		return nil, err
	}

	var nodes []models.Node
	if err := json.Unmarshal(res, &nodes); err != nil {
		return nil, err
	}

	return nodes, nil
}

// apiDelete requests deletion of a node.
func apiDelete(path string, recursive bool, authToken, baseURL string) ([]models.Node, error) {
	id, err := apiNodeIDForPath(path, authToken, baseURL)
	if err != nil {
		return nil, err
	}

	req := api.DeleteRequest{
		ID:        id,
		Recursive: recursive,
	}

	client := http.Client{}
	res, err := PostJSON(&client, fmt.Sprintf("%s/node/delete", baseURL), authToken, req)
	if err != nil {
		return nil, err
	}

	var nodes []models.Node
	if err := json.Unmarshal(res, &nodes); err != nil {
		return nil, err
	}

	return nodes, nil
}
