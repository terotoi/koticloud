import React from 'react'
import WindowManager from '../windows/wm'
import { isDir, setCookie } from '../util'
import Node from '../models/node'
import { isMedia } from '../util'

export default class AppModel extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			authToken: localStorage.getItem('authToken') || null,

			setAuthToken: this.setAuthToken.bind(this),
			username: localStorage.getItem('username') || "",

			setUsername: (name) => {
				localStorage.setItem('username', name)
				this.setState({ username: name })
			},

			isAdmin: localStorage.getItem('isAdmin') == 'true',
			setIsAdmin: (admin) => {
				localStorage.setItem('isAdmin', admin)
				this.setState({ admin: admin })
			},

			homeNodeID: parseInt(localStorage.getItem('homeNodeID')) || null,
			setHomeNodeID: this.setHomeNodeID.bind(this),

			settings: {
				volume: parseFloat(localStorage.getItem('volume')) || 1.0
			},
			setVolume: this.setVolume.bind(this),

			node: null,
			_pushHistory: this._pushHistory.bind(this),
			popHistory: this.popHistory.bind(this),
			_setCurrentNode: this._setCurrentNode.bind(this),
			openNode: this.openNode.bind(this),
			openNodeId: this.openNodeId.bind(this),
			refreshNode: this.refreshNode.bind(this),
			onSearchResults: this.onSearchResults.bind(this)
		}

		if(this.state.authToken)
			setCookie('jwt', this.state.authToken, 31)

		this.previousNodeId = null

		// Handler for going back in the browser history
		window.addEventListener('popstate', (ev) => {
			if (ev.state !== null) {
				this.previousNodeId = ev.state.previousNodeId ? ev.state.previousNodeId : null

				const id = ev.state.nodeId
				Node.forId(id, (node) => {
					this.setState({ node: node })
				}, (err) => {
					alert(err)
				})
			} else {
				console.log("popstate null")
				window.history.back()
			}
		})
	}

	// Set the auth token as well as the cookie.
	setAuthToken(token) {
		if (token === null) {
			localStorage.removeItem('authToken')
			setCookie("jwt", '', 31)
		} else {
			localStorage.setItem('authToken', token)
			setCookie("jwt", token, 31)
		}
		this.setState({ authToken: token })
	}

	setHomeNodeID(id) {
		localStorage.setItem('homeNodeID', id)
		this.setState({ homeNodeID: id })
	}

	setVolume(v) {
		this.setState({ settings: { volume: v, ...this.state.settings } })
		localStorage.setItem('volume', v)
	}

	// Refresh the current node state. Must be called when
	// the node has changed and change must be visible.
	refreshNode() {
		this.setState({ node: this.state.node })
	}

	// Pushes the current node into the history.
	_pushHistory(node) {
		if (node === null)
			alert("Trying to push null to history")
		if (node !== null && (this.previousNodeId == null || node.id != this.previousNodeId)) {
			const state = { nodeId: node.id, previousNodeId: this.previousNodeId }
			console.log("Pushing node into history:", state.nodeId)

			window.history.pushState(state, '', node.url)
			this.previousNodeId = node.id
		}
	}

	// Pops the current node from the History and sets the current node to the previous node.
	popHistory() {
		window.history.back()
	}

	_setCurrentNode(node) {
		this.setState({ node: node })
	}

	// Opens the given node.
	// If initial is true, the node is opened as the initial node.
	openNode(node) {
		console.log("openNode", node.id, "isMedia", isMedia(node.mime_type))

		if (this.previousNodeId === null && this.state.node !== null) {
			console.log("No previous node found, pushing current node", this.state.node.id)
			this._pushHistory(this.state.node)
		}

		if (isMedia(node.mime_type)) {
			// Avoid problems with some browsers holding on the media for too long
			window.location.assign('/id/' + node.id)
		} else {
			Node.fill(node, (node) => {
				this._pushHistory(node)
				this._setCurrentNode(node)
			})
		}
	}

	openNodeId(id) {
		console.log("openNodeId", id)
		if (id !== null) {
			Node.forId(id, (node) =>
				this.openNode(node))
		}
	}

	componentDidMount() {
		console.log("componentDidMount")
		Node.authToken = this.state.authToken

		const getNode = (id) => {
			Node.forId(id, (node) => {
				this._setCurrentNode(node)
			}, (err) => {
				this.state.setAuthToken(null)
				alert("Failed to get initial node: " + err)
			})
		}

		if (this.props.initialNodeID) {
			console.log("Fetching info on the initial node", this.props.initialNodeID)
			getNode(this.props.initialNodeID)
		} else if (this.state.homeNodeID) {
			console.log("Fetching info on the initial node", this.state.homeNodeID)
			getNode(this.state.homeNodeID)
		}
	}

	/**
	 * Called when search results have been returned by then server.
	 * 
	 * @param {[Node]} rs matching nodes
	 */
	onSearchResults(rs) {
		console.log("onSearchResults". rs)
		if (rs === null)
			; 
		else {
			const node = new Node({
				id: -Math.round(Math.random() * 100000000000),
				parent_id: null,
				mime_type: 'inode/directory',
				path: "Search results:",
				children: rs || []
			})
			Node.addCache(node)
			this.openNode(node)
		}
	}

	render() {
		return <WindowManager ctx={this.state} />
	}
}
