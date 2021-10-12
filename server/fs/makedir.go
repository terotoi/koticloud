package fs

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/boil"
)

// MakeDir creates a filesystem directory.
func MakeDir(ctx context.Context, parent *models.Node, filename string,
	user *models.User, homeRoot string, dontCreatePhys bool,
	tx boil.ContextExecutor) (*models.Node, error) {

	if parent != nil {
		if !AccessAllowed(user, parent, false) {
			return nil, core.NewSystemError(http.StatusUnauthorized, "", "not allowed")
		}
	}

	node := models.Node{Name: filename,
		Type:     "directory",
		MimeType: "inode/directory",
		OwnerID:  null.Int{Int: user.ID, Valid: true},
	}

	if parent != nil {
		node.ParentID = null.Int{Int: parent.ID, Valid: true}
	}

	path, err := PhysPath(ctx, &node, homeRoot, tx)
	if err != nil {
		return nil, err
	}

	if !dontCreatePhys {
		log.Printf("Creating physical directory %s", path)

		if err := os.MkdirAll(path, 0700); err != nil && !os.IsNotExist(err) {
			return nil, err
		}
	}

	// Only store paths for roots.
	/*
		if parent == nil {
			node.Path = null.String{String: path, Valid: true}
		}*/

	if err = node.Insert(ctx, tx, boil.Infer()); err != nil {
		os.Remove(path)
		return nil, err
	}

	return &node, nil
}
