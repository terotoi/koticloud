package jobs

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"

	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/terotoi/koticloud/server/util"
)

const thumbWidth = 600

// generateThumbnailImage generates a thumbnail image for a an image file
func generateThumbnailImage(src, dst, method string) error {
	var format string
	switch method {
	default:
		fallthrough
	case "crop_169":
		format = "convert %s -gravity center -crop 16:9 -geometry %dx \"%s\""

	case "crop_11":
		format = "convert %s -gravity center -crop 1:1 -geometry %dx \"%s\""

	case "crop_43":
		format = "convert %s -gravity center -crop 1:1 -geometry %dx \"%s\""

	case "scale_width":
		format = "convert %s -scale %dx \"%s\""
	}

	cmd := fmt.Sprintf(format, src, thumbWidth, dst)
	_, err := util.Exec(cmd)
	if err != nil {
		log.Printf("Failed command: %s", cmd)
	}
	return err
}

// generateThumbnailVideo generates a thumbnail image for a video file
func generateThumbnailVideo(src, dst, tempDir, method string, duration float64) error {
	fh, err := ioutil.TempFile(tempDir, "preview-*.jpg")
	if err != nil {
		return err
	}
	tempFile := fh.Name()

	defer func() {
		fh.Close()
		os.Remove(tempFile)
	}()

	// Take an image from the video
	cmd := fmt.Sprintf(`ffmpeg -y -ss %f -i %s -vframes 1 -an "%s"`, duration/5, src, tempFile)
	if _, err := util.Exec(cmd); err != nil {
		if err != nil {
			log.Printf("Failed command: %s", cmd)
		}
		return err
	}

	// Create a thumbnail
	if err := generateThumbnailImage(tempFile, dst, method); err != nil {
		return err
	}

	return nil
}

// generateThumbnailPDF generates a thumbnail image for a PDF file
func generateThumbnailPDF(src, dst, tempDir, method string) error {
	fh, err := ioutil.TempFile(tempDir, "preview-*.jpg")
	if err != nil {
		return err
	}
	tempFile := fh.Name()

	defer func() {
		fh.Close()
		os.Remove(tempFile)
	}()

	cmd := fmt.Sprintf("gs -dSAFER -dBATCH -dNOPAUSE -dJPEGQ=95 -r72x72 -sDEVICE=jpeg "+
		"-dFirstPage=1 -dLastPage=1 -o \"%s\" %s", tempFile, src)

	if _, err := util.Exec(cmd); err != nil {
		if err != nil {
			log.Printf("Failed command: %s", cmd)
		}

		return err
	}

	// Create a thumbnail
	if err := generateThumbnailImage(tempFile, dst, method); err != nil {
		return err
	}

	return nil
}

// generateThumbnail generates a thumbnail image for a file
func generateThumbnail(node *models.Node, removeUpload bool, uploadFile, thumbRoot, tempDir, method string) error {
	if util.HasCustomThumb(node.MimeType) {
		path := util.ShellEscape(uploadFile)

		destFile := fs.ThumbPath(thumbRoot, node.ID, true)
		err := util.EnsureDirExists(fs.ThumbPath(thumbRoot, node.ID, false))
		if err != nil {
			return err
		}

		if util.IsImage(node.MimeType) {
			err = generateThumbnailImage(path, destFile, method)
		} else if util.IsVideo(node.MimeType) {
			err = generateThumbnailVideo(path, destFile, tempDir, method, node.Length.Float64)
		} else if util.IsPDF(node.MimeType) {
			err = generateThumbnailPDF(path, destFile, tempDir, method)
		}

		if err != nil {
			return err
		}

		node.HasCustomThumb = true
	}

	return nil
}
