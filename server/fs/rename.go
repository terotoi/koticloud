package fs

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/sqlboiler/v4/boil"
)

// Rename a filesystem node.
func Rename(ctx context.Context, node *models.Node, filename string, user *models.User, tx *sql.Tx) error {
	if !IsValidName(filename) {
		return core.NewSystemError(http.StatusBadRequest, "",
			fmt.Sprintf("invalid node name: %s", filename))
	}

	if !AccessAllowed(user, node, false) {
		return core.NewSystemError(http.StatusUnauthorized, "", "not authorized")
	}

	if node.ParentID.Valid {
		dup, err := NodeChildByName(ctx, filename, node.ParentID.Int, tx)
		if err != nil {
			return err
		}

		if dup != nil {
			return core.NewSystemError(http.StatusConflict, "",
				fmt.Sprintf("file exists: %s", filename))
		}
	}

	oldName := node.Name
	node.Name = filename
	if _, err := node.Update(ctx, tx, boil.Infer()); err != nil {
		return err
	}

	log.Printf("Node %d renamed as: %s to %s", node.ID, oldName, node.Name)
	return nil
}
