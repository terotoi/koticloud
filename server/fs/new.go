package fs

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/models"
	"github.com/terotoi/koticloud/server/util"
	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/boil"
)

func NewFile(ctx context.Context, parent *models.Node, filename,
	mimeType string, size int64, owner *models.User,
	length *float64, hasCustomThumb bool, tx *sql.Tx) (*models.Node, error) {

	if !IsValidName(filename) {
		msg := fmt.Sprintf("illegal filename: %s", filename)
		return nil, core.NewSystemError(http.StatusBadRequest, msg, msg)
	}

	existing, err := NodeChildByName(ctx, filename, parent.ID, tx)
	if err != nil {
		return nil, core.NewInternalError(err)
	}

	if existing != nil {
		msg := fmt.Sprintf("node already exists: %s", filename)
		return nil, core.NewSystemError(http.StatusConflict, msg, msg)
	}

	node := models.Node{}
	node.Name = filename
	node.Type = "file"
	node.MimeType = mimeType
	node.Size = null.Int64{Int64: size, Valid: true}
	node.ParentID = null.Int{Int: parent.ID, Valid: true}
	node.OwnerID = null.Int{Int: owner.ID, Valid: true}
	node.HasCustomThumb = hasCustomThumb
	node.ModifiedOn = time.Now()

	if length != nil {
		node.Length = null.Float64{Float64: *length, Valid: true}
	}

	if err := node.Insert(ctx, tx, boil.Infer()); err != nil {
		return nil, err
	}

	return &node, nil
}

// Update data on an existing node. Does not update the filename or parent ID.
func UpdateFile(ctx context.Context, node *models.Node,
	mimeType string, size int64, owner *models.User,
	length *float64, hasCustomThumb bool, tx *sql.Tx) error {

	node.MimeType = mimeType
	node.Size = null.Int64{Int64: size, Valid: true}
	node.OwnerID = null.Int{Int: owner.ID, Valid: true}
	node.HasCustomThumb = hasCustomThumb
	node.ModifiedOn = time.Now()
	if length != nil {
		node.Length = null.Float64{Float64: *length, Valid: true}
	}

	if _, err := node.Update(ctx, tx, boil.Infer()); err != nil {
		return err
	}

	return nil
}

// Copy data to a node from source file.
func CopyData(node *models.Node, sourceFile string, symlink bool, fileRoot string) error {
	st, err := os.Stat(sourceFile)
	if err != nil {
		return err
	}

	if !st.Mode().IsRegular() {
		return fmt.Errorf("upload file %s not a regular file", sourceFile)
	}

	err = util.EnsureDirExists(NodeLocalPath(fileRoot, node.ID, false))
	if err != nil {
		return core.NewInternalError(err)
	}

	localPath := NodeLocalPath(fileRoot, node.ID, true)

	if symlink {
		err := os.Symlink(sourceFile, localPath)
		if err != nil {
			return core.NewInternalError(err)
		}
	} else {
		if err := CopyFile(sourceFile, localPath); err != nil {
			return core.NewInternalError(err)
		}
	}

	return nil
}
