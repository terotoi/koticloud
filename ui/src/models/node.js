/**
 * node.js - a local representation of a server node
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import { isDir } from '../util'
import api from "../api"

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

// Use promises
export default class Node {
	static authToken = null
	static cache = new Map()

	// Creates a Node from a node-like object.
	constructor(node) {
		this.id = node.id
		this.name = node.name
		this.url = '/id/' + this.id
		this.content_url = '/node/get/' + this.id
		this.size = node.size
		this.type = node.type
		this.mime_type = node.mime_type
		this.owner_id = node.owner_id
		this.parent_id = node.parent_id
		this.modified_on = node.modified_on
		this.has_custom_thumb = node.has_custom_thumb
		this.length = node.length
		this.progress = node.progress
		this.volume = node.volume
		this.path = ''

		if (node.children) {
			this.children = node.children.map((n) => Node.ensure(n))
			this.childrenUpdated = true
		} else {
			this.children = []
			this.childrenUpdated = false
		}
		this.siblings = []
		this.siblingsUpdated = false
	}


	/**
	 * Returns the URL of the thumbnail of this node.
	 * 
	 * @param {bool} preview if true, download thumbnail from the server /node/thumb/id
	 *  if false, use own logic to determinate a generic thumbnail from /icons/
	 * @returns {string} URL
	 */
	thumbURL(preview) {
		if (!preview) {
			const mime = (typesWithLocalIcons.indexOf(this.mime_type) != -1) ?
				this.mime_type : "application/octet-stream"
			const filename = mime.replaceAll("-", "_").replaceAll("/", "-") + ".svg"
			return "/icons/types/" + filename + "?modified=" + this.modified_on
		} else {
			return "/node/thumb/" + this.id + "?modified=" + this.modified_on
		}
	}


	// Inserts the children of the node into node.children. Also sets node.path.
	// The children are sorted by name.
	// Calls callback(node).
	static getChildren(node, callback) {
		if (isDir(node.mime_type) && !node.childrenUpdated) {
			api._listDir(node.id, this.authToken,
				(r) => {
					node.path = r.DirPath
					node.children = r.Children || []
					node.children = node.children.map((n) => new Node(n))
					node.siblings.sort((a, b) => a.name.localeCompare(b.name))

					node.childrenUpdated = true
					callback(node)
				},
				(error) => {
					console.log("node.getChildren error:", error)
					alert(error)
				})
		} else {
			node.childrenUpdated = true
			callback(node)
		}
	}

	// Inserts the siblings of the node into node.siblings Calls callback(node).
	// The siblings are sorted by name.
	static getSiblings(node, callback) {
		if (node.parent_id !== null && !node.siblingsUpdated) {
			api._listDir(node.parent_id, this.authToken,
				(r) => {
					node.siblings = r.Children || []
					node.siblings = node.siblings.map((n) => new Node(n))
					node.siblings.sort((a, b) => a.name.localeCompare(b.name))
					node.siblingsUpdated = true
					callback(node)
				},
				(error) => {
					console.log("Node.getChildren error:", error)
					alert(error)
				})
		} else {
			node.siblingsUpdated = true
			callback(node)
		}
	}

	// Inserts the children and siblings of the node into node.children and node.siblings. Calls callback(node).
	static getChildrenAndSiblings(node, callback) {
		Node.getChildren(node, (node) => {
			Node.getSiblings(node, (node) => {
				callback(node)
			})
		})
	}

	// Fills the node with any missing information from the server.
	static fill(node, callback) {
		if (node.id > 0)
			Node.getChildrenAndSiblings(node, callback)
		else
			callback(node)
	}

	// Return a node with a given id. Calls callback(node)
	static forId(id, success, error) {
		// Search results
		if (id < 0) {
			success(this.cache.get(id))

		} else {
			api._queryNode(id, this.authToken, (nn) => {
				const node = new Node(nn)
				Node.fill(node, success)
			}, (err) => {
				console.log("Node.forId error:", err)
				if (error)
					error(err)
			})
		}
	}

	// Ensure that the given object is a Node instance.
	static ensure(n) {
		if (n instanceof Node)
			return n
		else
			return new Node(n)
	}

	// Add the specified node to the cache
	static addCache(node) {
		this.cache.set(node.id, node)
	}
}
