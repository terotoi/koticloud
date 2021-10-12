package fs

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/models"
)

func Copy(ctx context.Context, src *models.Node, parent *models.Node, filename string,
	homeRoot, thumbRoot string, user *models.User,
	tx *sql.Tx) ([]*models.Node, error) {
	if !AccessAllowed(user, src, false) {
		return nil, core.NewSystemError(http.StatusUnauthorized, "", "not allowed")
	}

	if !AccessAllowed(user, parent, false) {
		return nil, core.NewSystemError(http.StatusUnauthorized, "", "not allowed")
	}

	if !IsDir(parent) {
		return nil, core.NewSystemError(http.StatusUnauthorized, "", "destination is not a directory")
	}

	if !parent.OwnerID.Valid || parent.OwnerID.Int != src.OwnerID.Int {
		return nil, core.NewSystemError(http.StatusUnauthorized, "", "destination directory has an invalid owner")
	}

	var copied []*models.Node

	log.Printf("Copying %s (%s, %d) to %s/%s (%d)", src.Name, src.Type, src.ID, parent.Name,
		filename, parent.ID)

	if src.Type == "file" {
		var err error

		var length *float64
		if src.Length.Valid {
			length = &src.Length.Float64
		}

		copy, err := NewFile(ctx, parent, filename, src.MimeType,
			src.Size.Int64, user, length, src.HasCustomThumb, tx)
		if err != nil {
			return nil, err
		}

		srcPath, err := PhysPath(ctx, src, homeRoot, tx)
		if err = CopyData(ctx, copy, srcPath, homeRoot, tx); err != nil {
			return nil, err
		}

		copied = append(copied, copy)

		if src.HasCustomThumb {
			srcThumbPath := ThumbPath(thumbRoot, src.ID, true)
			dstThumbPath := ThumbPath(thumbRoot, copy.ID, true)
			log.Printf("Copying thumb %d (%s) to %d (%s)", src.ID, srcThumbPath, copy.ID,
				dstThumbPath)
			if err := CopyFile(srcThumbPath, dstThumbPath); err != nil {
				log.Println(err)
				return nil, core.NewInternalError(err)
			}
		}
	} else {
		newDir, err := MakeDir(ctx, parent, filename, user, homeRoot, false, tx)
		if err != nil {
			return nil, err
		}

		copied = append(copied, newDir)

		children, err := NodesByParentID(ctx, src.ID, tx)
		if err != nil {
			return nil, err
		}

		for _, ch := range children {
			chops, err := Copy(ctx, ch, newDir, ch.Name, homeRoot, thumbRoot, user, tx)
			if err != nil {
				return nil, err
			}

			copied = append(copied, chops...)
		}
	}

	return copied, nil
}

// Copy data to a node from source file.
func CopyData(ctx context.Context, node *models.Node, sourceFile string, homeRoot string, tx *sql.Tx) error {
	st, err := os.Stat(sourceFile)
	if err != nil {
		return err
	}

	if !st.Mode().IsRegular() {
		return fmt.Errorf("upload file %s not a regular file", sourceFile)
	}

	path, err := PhysPath(ctx, node, homeRoot, tx)
	if err != nil {
		return core.NewInternalError(err)
	}

	if err := CopyFile(sourceFile, path); err != nil {
		return core.NewInternalError(err)
	}

	return nil
}
