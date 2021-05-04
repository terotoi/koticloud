package fs

import (
	"context"
	"log"
	"net/http"
	"os"

	. "github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/sqlboiler/v4/boil"
)

// Delete a filesystem node.
func Delete(ctx context.Context, node *models.Node, recursive, followDataSymLink bool,
	user *models.User, fileRoot, thumbRoot string, tx boil.ContextExecutor) ([]*models.Node, error) {
	if !AccessAllowed(user, node, true) {
		return nil, NewSystemError(http.StatusUnauthorized, "", "not authorized")
	}

	var deleted []*models.Node

	children, err := NodesByParentID(ctx, node.ID, tx)
	if err != nil {
		return nil, err
	}

	if children != nil {
		if recursive {
			for _, n := range children {
				dels, err := Delete(ctx, n, true, followDataSymLink, user, fileRoot, thumbRoot, tx)
				if err != nil {
					return nil, err
				}
				for _, d := range dels {
					deleted = append(deleted, d)
				}
			}
		} else {
			return nil, NewSystemError(http.StatusBadRequest, "",
				"directory not empty and recursive deletion not requested")
		}
	}

	if node.Type == "file" {
		path := NodeLocalPath(fileRoot, node.ID, true)

		if followDataSymLink {
			if target, err := os.Readlink(path); err == nil {
				if err := os.Remove(target); err != nil {
					log.Println(err)
				}
			}
		}

		if err := os.Remove(path); err != nil {
			log.Println(err)
		}
	}

	os.Remove(NodeLocalPath(thumbRoot, node.ID, true))
	if _, err = node.Delete(ctx, tx); err != nil {
		return nil, err
	}

	deleted = append(deleted, node)
	return deleted, nil
}
