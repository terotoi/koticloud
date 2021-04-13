package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/terotoi/koticloud/server/api"
	"github.com/terotoi/koticloud/server/models"
)

// apiLocalUpload uploads a file locally. The file must
// reside in a location accessible by the server.
// Only really meant for development and testing purposes.
func apiLocalUpload(path, targetPath string, symlinkData bool, authToken string,
	baseURL string) ([]*models.Node, error) {
	targetDir := filepath.Dir(targetPath + "/")

	parentID, err := apiNodeIDForPath(targetDir, authToken, baseURL)
	if err != nil {
		return nil, err
	}

	client := http.Client{}
	req := api.LocalUploadRequest{
		ParentID:    parentID,
		Filename:    filepath.Base(path),
		LocalPath:   path,
		SymlinkData: symlinkData,
	}

	res, err := PostJSON(&client, fmt.Sprintf("%s/node/new", baseURL),
		authToken, req)
	if err != nil {
		return nil, err
	}

	var nodes []*models.Node
	if err := json.Unmarshal(res, &nodes); err != nil {
		return nil, err
	}

	return nodes, nil
}

func newFileUploadRequest(url string, params map[string]string, paramName,
	path, authToken string) (*http.Response, error) {
	fh, err := os.Open(path)
	if err != nil {
		return nil, err
	}

	filename := filepath.Base(path)

	pr, pw := io.Pipe()
	m := multipart.NewWriter(pw)

	go func() {
		defer pw.Close()
		defer m.Close()

		part, err := m.CreateFormFile(paramName, filename)
		if err != nil {
			fmt.Println(err.Error())
			return
		}

		_, err = io.Copy(part, fh)
		if err != nil {
			fmt.Printf("Upload: %s\n", err.Error())
			return
		}

		for k, v := range params {
			if err = m.WriteField(k, v); err != nil {
				fmt.Printf("Upload: %s\n", err.Error())
				return
			}
		}
	}()

	req, err := http.NewRequest("POST", url, pr)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", m.FormDataContentType())
	if authToken != "" {
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", authToken))
	}

	client := http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// apiUpload does a HTTP multipart upload of a file.
func apiUpload(path, targetPath, authToken, baseURL string) ([]*models.Node, error) {
	targetDir := filepath.Dir(targetPath + "/")

	parentID, err := apiNodeIDForPath(targetDir, authToken, baseURL)
	if err != nil {
		return nil, err
	}

	params := map[string]string{
		"parentID": strconv.Itoa(parentID),
		"filename": filepath.Base(path),
	}

	res, err := newFileUploadRequest(fmt.Sprintf("%s/node/new", baseURL),
		params, "file", path, authToken)
	if err != nil {
		return nil, err
	}

	bb := bytes.Buffer{}
	_, err = bb.ReadFrom(res.Body)
	if err != nil {
		return nil, err
	}
	res.Body.Close()

	if res.StatusCode != 200 {
		return nil, fmt.Errorf("server error: %d %s", res.StatusCode, bb.String())
	}

	var nodes []*models.Node
	if err := json.Unmarshal(bb.Bytes(), &nodes); err != nil {
		return nil, err
	}

	return nodes, nil
}
