
const typesWithLocalIcons = [
	"application/x-bzip2",
	"application/gzip",
	"application/octet-stream",
	"application/pdf",
	"application/zip",
	"audio/aac",
	"audio/flac",
	"audio/ogg",
	"audio/mpeg",
	"font/ttf",
	"font/woff",
	"image/gif",
	"image/jpeg",
	"image/png",
	"image/webp",
	"inode/directory",
	"text/html",
	"text/plain",
	"video/mp4",
	"video/x-ms-asf",
	"video/webm"]

/**
 * Returns the URL of the thumbnail of a node.
 * 
 * @param {Node} node
 * @param {bool} preview if true, download thumbnail from the server /node/thumb/id
 *  if false, use own logic to determinate a generic thumbnail from /icons/
 * @returns {string} URL
 */
export function nodeThumb(node, preview) {
	if (!preview) {
		const mime = (typesWithLocalIcons.indexOf(node.mime_type) != -1) ?
			node.mime_type : "application/octet-stream"
		const filename = mime.replaceAll("-", "_").replaceAll("/", "-") + ".svg"
		return "/icons/types/" + filename
	} else {
		return "/node/thumb/" + node.id
	}
}
