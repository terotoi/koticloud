package fs

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/boil"
)

// Move a node src under the dest directory node.
func Move(ctx context.Context, node *models.Node, dest *models.Node,
	user *models.User, homeRoot string, tx *sql.Tx) error {
	if !AccessAllowed(user, node, false) {
		return core.NewSystemError(http.StatusUnauthorized, "", "not allowed")
	}

	if !AccessAllowed(user, dest, false) {
		return core.NewSystemError(http.StatusUnauthorized, "", "not allowed")
	}

	if !IsDir(dest) {
		return core.NewSystemError(http.StatusUnauthorized, "", "destination is not a directory")
	}

	srcPath, err := PhysPath(ctx, node, homeRoot, tx)
	if err != nil {
		return err
	}
	node.ParentID = null.Int{Int: dest.ID, Valid: true}
	if err != nil {
		return err
	}

	dstPath, err := PhysPath(ctx, node, homeRoot, tx)

	if err := os.Rename(srcPath, dstPath); err != nil {
		if err = CopyFile(srcPath, dstPath); err != nil {
			os.Remove(dstPath)
			return err
		}

		if err = os.Remove(srcPath); err != nil {
			log.Printf("Move: Failed to remove original file: %s", srcPath)
		}
	}

	if _, err := node.Update(ctx, tx, boil.Infer()); err != nil {
		return err
	}

	return nil
}
