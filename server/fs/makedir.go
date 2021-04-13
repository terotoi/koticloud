package fs

import (
	"context"
	"net/http"

	. "github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/boil"
)

// MakeDir a filesystem directory.
func MakeDir(ctx context.Context, parent *models.Node, filename string,
	user *models.User, tx boil.ContextExecutor) (*models.Node, error) {

	if parent != nil {
		if !AccessAllowed(user, parent, false) {
			return nil, NewSystemError(http.StatusUnauthorized, "", "not authorized")
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

	err := node.Insert(ctx, tx, boil.Infer())
	if err != nil {
		return nil, err
	}

	return &node, nil
}
