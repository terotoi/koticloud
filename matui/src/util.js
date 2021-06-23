
/* Check if the given content type is a video type.
 * Currently video/mp4 and video/webm are considered videos.
 *
 * @param {string} contentType - content type to check
 * @returns true or false
 */
export function isVideo(contentType) {
  return ['video/mp4', 'video/webm'].indexOf(contentType) !== -1
}

/* Check if the given content type is an audio type.
 * Currently audio/aac and audio/mp3 are considered audio types.
 *
 * @param {string} contentType - content type to check
 * @returns true or false
 */
export function isAudio(contentType) {
  return  ['audio/aac', 'audio/mpeg', 'audio/mp3', 'audio/ogg'].indexOf(contentType) !== -1
}


/* Check if the given content type is a video or an audio type.
 * Currently audio/aac and audio/mp3 are considered audio types.
 *
 * @param {string} contenit
 */
export function isPlayable(contentType) {
  return isVideo(contentType) || isAudio(contentType)
}

/* Check if the given content type is an image type.
 * Currently image/jpeg and image/png are supported.
 *
 * @param {string} contentType - content type to check
 * @returns true or false
 */
export function isImage(contentType) {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].indexOf(contentType) !== -1
}

/* Check if the given content type is a media type.
 * Media content types are video, audio and images.
 * Image types are: image/jpeg and image/png
 *
 * @param {string} contentType - content type to check
 * @returns true or false
 */
export function isMedia(contentType) {
  return isPlayable(contentType) || isImage(contentType)
}

/* Check if the given content type is a directory.
 *
 * @param {string} contentType - content type to check
 * @returns true or false
 */
export function isDir(contentType) {
  return contentType == 'inode/directory'
}

/* Check if the given content type is text.
 *
 * @param {string} contentType - content type to check
 * @returns true or false
 */
export function isText(contentType) {
  return ['text/plain', 'application/json', 'application/x-ndjson'].indexOf(contentType) !== -1
}

/* Limit string to n number of characters. If the length of
 * the string exceeds this limit, the string is cut hard
 * on this limit and ... is appeneded.
 *
 * @param {string} txt - the string to limit
 * @param {int} n - character limit
 * @returns the processed string
 */
export function limitText(txt, n) {
  let r = txt.substr(0, n)
  if (txt.length > n)
    r += '...'
  return r
}

/* Capitalize the first letter of a string.
 *
 * @param {string} s - the string to capitalize
 * @returns the capitalized string
 */
export function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/* Formats a duration in seconds as "hours:minutes:seconds"
 *
 * @param {float} d - duration
 * @returns duration as string
 */
export function formatDuration(d) {
  const h = Math.floor(d / 3600)
  const m = Math.floor((d % 3600) / 60)
  const s = Math.floor(d % 60)
  return ("00" + h).slice(-2) + ":" +
    ("00" + m).slice(-2) + ":" +
    ("00" + s).slice(-2)
}

/**
 * Returns a random integer between (0-n).
 */
export function randInt(n) {
  return Math.round(Math.random() * n)
}

export function setCookie(name, value, days) {
  var expires
  if (days) {
    var d = new Date()
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000))
    expires = " ; expires=" + d.toGMTString()
  } else
    expires = ""

  const cookie = name + "=" + value + expires + " ; samesite=strict; path=/";
  document.cookie = cookie
}

/**
 * Returns the URL of the content of a node.
 * 
 * @param {Node} node
 * @returns {string} URL
 */
export function nodeURL(node) {
  return "/node/get/" + node.id
}

/** Set progress and volume metadata on a node */
export function setNodeMeta(node, progress, volume) {
  node.MetaType = 'progress'
  node.MetaData = {
    Progress: progress,
    Volume: volume
  }
}

// Returns the size of 1rem in pixels.
export function remSize() {    
  return parseFloat(getComputedStyle(document.documentElement).fontSize);
}