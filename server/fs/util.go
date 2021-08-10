package fs

import (
	"io"
	"log"
	"os"
	"strings"

	"github.com/gabriel-vasile/mimetype"
	"github.com/terotoi/koticloud/server/models"
)

const emptyFileType = "text/plain"

// IsDir returns true if the given node is a directory.
func IsDir(node *models.Node) bool {
	return node.Type == "directory"
}

// IsValidName returns true if the given filename is valid.
func IsValidName(filename string) bool {
	return !(filename == "" || filename == "." || filename == ".." ||
		strings.ContainsAny(filename, "\r\n/"))
}

// CopyFile copies while from srcPath to dstPath.
func CopyFile(srcPath, dstPath string) error {
	log.Printf("Copying file %s to %s", srcPath, dstPath)

	// Copy the file
	sfh, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer sfh.Close()

	dfh, err := os.Create(dstPath)
	if err != nil {
		return err
	}
	defer dfh.Close()

	_, err = io.Copy(dfh, sfh)
	return err
}

// Returns the mime type of a file or a default type.
func DetectMimeType(filename string) (string, error) {
	st, err := os.Stat(filename)
	if err != nil {
		return "", err
	}

	// Detect the mime tpye
	var mimeType string
	mt, err := mimetype.DetectFile(filename)
	if err != nil {
		log.Printf("unknown file type: %s", filename)
		if st.Size() == 0 {
			mimeType = emptyFileType
		} else {
			mimeType = "application/octet-stream"
		}
	} else {
		mimeType = mt.String()

		// Strip trailing ;charset=xxx
		if sc := strings.Index(mimeType, ";"); sc != -1 {
			mimeType = mimeType[:sc]
		}
	}

	return mimeType, nil
}
