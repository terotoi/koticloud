package proc

import (
	"fmt"
	"io/ioutil"
	"os"

	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/terotoi/koticloud/server/util"
)

const thumbWidth = 600

func generateImageThumbnail(src, dst, method string) error {
	var format string
	switch method {
	default:
		fallthrough
	case "crop_169":
		format = "convert \"%s\" -gravity center -crop 16:9 -geometry %dx \"%s\""

	case "crop_11":
		format = "convert \"%s\" -gravity center -crop 1:1 -geometry %dx \"%s\""

	case "crop_43":
		format = "convert \"%s\" -gravity center -crop 1:1 -geometry %dx \"%s\""

	case "scale_width":
		format = "convert \"%s\" -scale %dx \"%s\""
	}
	_, err := util.Exec(fmt.Sprintf(format, src, thumbWidth, dst))
	return err
}

func generateVideoThumbnail(src, dst, tempDir, method string) error {
	prevfh, err := ioutil.TempFile(tempDir, "preview-*.jpg")
	if err != nil {
		return err
	}
	previewFile := prevfh.Name()

	defer func() {
		prevfh.Close()
		os.Remove(previewFile)
	}()

	// Take an image from the video
	previewCmd := fmt.Sprintf("ffmpeg -y -ss `ffprobe -v 0 -show_entries format=duration "+
		"-of default=noprint_wrappers=1:nokey=1 \"%s\" | awk '{printf(\"%%.0f\\n\", $1/5)}'` "+
		"-i \"%s\" -vframes 1 -an \"%s\"", src, src, previewFile)

	if _, err := util.Exec(previewCmd); err != nil {
		return err
	}

	// Create a thumbnail
	if err := generateImageThumbnail(previewFile, dst, method); err != nil {
		return err
	}

	return nil
}

// generateThumbnail generates a thumbnail image for a node
func generateThumbnail(node *models.Node, removeUpload bool, uploadFile, thumbRoot, tempDir, method string) error {
	if util.IsMedia(node.MimeType) {
		destFile := fs.ThumbPath(thumbRoot, node.ID, true)
		err := util.EnsureDirExists(fs.ThumbPath(thumbRoot, node.ID, false))
		if err != nil {
			return err
		}

		if util.IsImage(node.MimeType) {
			err = generateImageThumbnail(uploadFile, destFile, method)
		} else if util.IsVideo(node.MimeType) {
			err = generateVideoThumbnail(uploadFile, destFile, tempDir, method)
		}

		if err != nil {
			return err
		}

		node.HasCustomThumb = true
	}

	return nil
}
