package util

var imageFormats = []string{"image/jpeg", "image/png", "image/webp"}
var videoFormats = []string{"video/mp4", "video/webm", "image/gif"}
var audioFormats = []string{"audio/aac", "audio/flac", "audio/mpeg", "audio/ogg", "audio/x-m4a"}

// IsImage returns true if the given mime type is a supported image type.
func IsImage(mimeType string) bool {
	for _, f := range imageFormats {
		if mimeType == f {
			return true
		}
	}
	return false
}

// IsVideo returns true if the given mime type is a supported video type.
func IsVideo(mimeType string) bool {
	for _, f := range videoFormats {
		if mimeType == f {
			return true
		}
	}
	return false
}

// IsVideo returns true if the given mime type is a supported audio type.
func IsAudio(mimeType string) bool {
	for _, f := range audioFormats {
		if mimeType == f {
			return true
		}
	}
	return false
}

// IsMedia returns true if the given mime type is a supported image or video type.
func IsMedia(mimeType string) bool {
	return IsImage(mimeType) || IsVideo(mimeType)
}

// TypesWithCustomThumbnails retrurns mime types for which thumbnails can be generated.
func TypesWithCustomThumbnails() []string {
	return append(imageFormats, videoFormats...)
}
