package fs

import (
	"context"
	"fmt"
	"strings"

	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/sqlboiler/v4/boil"
)

// PathFor returns a full path for a node.
func PathFor(ctx context.Context, node *models.Node, tx boil.ContextExecutor) (string, error) {
	path := []string{}

	var err error
	for node.ParentID.Valid {
		path = append(path, node.Name)

		node, err = models.FindNode(ctx, tx, node.ParentID.Int)
		if err != nil {
			return "", err
		}
	}

	if len(path) == 0 {
		return "/", nil
	} else {
		path = append(path, "")

		// Reverse the list
		for i, j := 0, len(path)-1; i < j; i, j = i+1, j-1 {
			path[i], path[j] = path[j], path[i]
		}
	}

	return strings.Join(path, "/"), nil
}

// PhysPath returns full path for a node. It queries nodes recursive upwards until
// it finds a stored path or ends up at the root.
func PhysPath(ctx context.Context, node *models.Node, homeRoot string, tx boil.ContextExecutor) (string, error) {
	path := homeRoot

	var names []string
	for n := node; n != nil; {
		// Found a stored path, use it as root and stop recursing upwards.
		/*
			if n.Path.Valid && n.Path.String != "" {
				path = n.Path.String
				break
			}*/

		names = append(names, n.Name)
		if n.ParentID.Valid {
			if parent, err := NodeByID(ctx, n.ParentID.Int, tx); err != nil {
				return "", err
			} else {
				n = parent
			}
		} else {
			n = nil
		}
	}

	if !strings.HasSuffix(path, "/") {
		path = path + "/"
	}

	// Reverse the list
	for i, j := 0, len(names)-1; i < j; i, j = i+1, j-1 {
		names[i], names[j] = names[j], names[i]
	}

	path = path + strings.Join(names, "/")
	return path, nil
}

// ThumbPath returns path for a thumbnail file.
// If includeFile is true, the filename is included in the path,
// otherwise the directory is returned, without trailing slash.
func ThumbPath(root string, id int, includeFile bool) string {
	if includeFile {
		return fmt.Sprintf("%s/%08d/%d", root, id/1000*1000, id)
	}
	return fmt.Sprintf("%s/%08d", root, id/1000*1000)
}
