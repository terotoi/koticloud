package fs

import (
	"context"
	"database/sql"
	"log"
	"net/http"

	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/models"
)

func Copy(ctx context.Context, src *models.Node, parent *models.Node, filename string,
	symlinkData bool, fileRoot, thumbRoot string, user *models.User,
	tx *sql.Tx) ([]*models.Node, error) {
	if !AccessAllowed(user, src, false) {
		return nil, core.NewSystemError(http.StatusUnauthorized, "", "not authorized")
	}

	if !AccessAllowed(user, parent, false) {
		return nil, core.NewSystemError(http.StatusUnauthorized, "", "not authorized")
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

		if err = CopyData(copy, NodeLocalPath(fileRoot, src.ID, true), symlinkData, fileRoot); err != nil {
			return nil, err
		}

		copied = append(copied, copy)

		if src.HasCustomThumb {
			srcThumbPath := NodeLocalPath(thumbRoot, src.ID, true)
			dstThumbPath := NodeLocalPath(thumbRoot, copy.ID, true)
			log.Printf("Copying thumb %d (%s) to %d (%s)", src.ID, srcThumbPath, copy.ID,
				dstThumbPath)
			if err := CopyFile(srcThumbPath, dstThumbPath); err != nil {
				log.Println(err)
				return nil, core.NewInternalError(err)
			}
		}
	} else {
		newDir, err := MakeDir(ctx, parent, filename, user, tx)
		if err != nil {
			return nil, err
		}

		copied = append(copied, newDir)

		children, err := NodesByParentID(ctx, src.ID, tx)
		if err != nil {
			return nil, err
		}

		for _, ch := range children {
			chops, err := Copy(ctx, ch, newDir, ch.Name, symlinkData, fileRoot, thumbRoot, user, tx)
			if err != nil {
				return nil, err
			}

			copied = append(copied, chops...)
		}
	}

	return copied, nil
}
