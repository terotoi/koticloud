package fs

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/sqlboiler/v4/boil"
)

// Delete a filesystem node.
func Delete(ctx context.Context, node *models.Node, recursive bool,
	user *models.User, homeRoot, thumbRoot string, tx boil.ContextExecutor) ([]*models.Node, error) {
	if !AccessAllowed(user, node, true) {
		return nil, core.NewSystemError(http.StatusUnauthorized, "", "not allowed")
	}

	var deleted []*models.Node

	children, err := NodesByParentID(ctx, node.ID, tx)
	if err != nil {
		return nil, err
	}

	if children != nil {
		if recursive {
			for _, n := range children {
				dels, err := Delete(ctx, n, true, user, homeRoot, thumbRoot, tx)
				if err != nil {
					return nil, err
				}

				deleted = append(deleted, dels...)
			}
		} else {
			return nil, core.NewSystemError(http.StatusBadRequest, "",
				"directory not empty and recursive deletion not requested")
		}
	}

	path, err := PhysPath(ctx, node, homeRoot, tx)
	if err != nil {
		return nil, err
	}

	if err := os.Remove(path); err != nil {
		log.Println(err)
	}

	// Technically should only try for files.
	// if node.Type == "file" {
	if err := os.Remove(ThumbPath(thumbRoot, node.ID, true)); err != nil {
		log.Println(err)
	}

	if _, err = node.Delete(ctx, tx); err != nil {
		return nil, err
	}

	deleted = append(deleted, node)
	return deleted, nil
}
