package fs

import (
	"context"
	"database/sql"
	"net/http"

	. "github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/boil"
)

// Move a node src under the dest directory node.
func Move(ctx context.Context, node *models.Node, dest *models.Node,
	user *models.User, tx *sql.Tx) error {
	if !AccessAllowed(user, node, false) {
		return NewSystemError(http.StatusUnauthorized, "", "not authorized")
	}

	if !AccessAllowed(user, dest, false) {
		return NewSystemError(http.StatusUnauthorized, "", "not authorized")
	}

	if !IsDir(dest) {
		return NewSystemError(http.StatusUnauthorized, "", "destination is not a directory")
	}

	node.ParentID = null.Int{Int: dest.ID, Valid: true}
	if _, err := node.Update(ctx, tx, boil.Infer()); err != nil {
		return err
	}

	return nil
}
