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
	var command string
	switch method {
	default:
		fallthrough
	case "scale_width":
		command = fmt.Sprintf("convert \"%s\" -scale %dx \"%s\"", src, thumbWidth, dst)

	case "crop_11":
		// NOTE: does not work well with posters, because the thumbs are also used for them.
		command = fmt.Sprintf("convert \"%s\" -geometry %dx%d^ -gravity center -crop %dx%d+0+0 \"%s\"",
			src, thumbWidth, thumbWidth, thumbWidth, thumbWidth, dst)

	case "crop_43":
		// NOTE: does not work well with posters, because the thumbs are also used for them.
		command = fmt.Sprintf("convert \"%s\" -geometry %dx%d^ -gravity center -crop %dx%d+0+0 \"%s\"",
			src, thumbWidth, thumbWidth, int(thumbWidth*(3.0/4.0)), thumbWidth, dst)
	}
	_, err := util.Exec(command)
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

	// Create a poster
	/*
		toPoster := fmt.Sprintf("convert \"%s\" \"%s\"", fname, posterOut)
		if _, err := Exec(toPoster); err != nil {
			return err
		}*/

	return nil
}

// generateThumbnail generates a thumbnail image for a node
func generateThumbnail(node *models.Node, removeUpload bool, uploadFile, thumbRoot, tempDir, method string) error {
	if util.IsMedia(node.MimeType) {
		destFile := fs.NodeLocalPath(thumbRoot, node.ID, true)
		err := util.EnsureDirExists(fs.NodeLocalPath(thumbRoot, node.ID, false))
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
