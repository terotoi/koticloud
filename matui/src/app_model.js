import React from 'react'
import WindowManager from './windows/wm'
import api from "./api"
import { isDir, setCookie } from './util'

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

			currentNodes: null,
			pushCurrentNodes: this.pushCurrentNodes.bind(this),
			popCurrentNodes: this.popCurrentNodes.bind(this),
			pushCurrentNodeById: this.pushCurrentNodeById.bind(this),
			nodeHistory: [],

			up: this.up.bind(this),
			printNodeHistory: this.printNodeHistory.bind(this),
			onSearchResults: this.onSearchResults.bind(this),

			settings: {
				volume: parseFloat(localStorage.getItem('volume')) || 1.0
			},
			setVolume: this.setVolume.bind(this)
		}
	}

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
		this.pushCurrentNodeById(id)
	}

	pushCurrentNodes(nodes) {
		const hs = [nodes, ...this.state.nodeHistory]
		this.setState({ nodeHistory: hs, currentNodes: nodes })
	}

	popCurrentNodes() {
		const len = this.state.nodeHistory.length
		if (len > 1) {
			const next = this.state.nodeHistory[1]
			const hs = this.state.nodeHistory.slice(1)
			this.setState({
				nodeHistory: hs,
				currentNodes: next
			})
		}
	}

	pushCurrentNodeById(id) {
		//console.log("pushCurrentnodeById", id)
		api.queryNode(id, this.state.authToken, (node) => {

			if (node.parent_id !== null && !isDir(node.mime_type)) {
				api.listDir(node.parent_id,
					this.state.authToken,
					(r) => {
						this.pushCurrentNodes([node, ...r.Children])
					},
					(error) => {
						console.log("error:", error)
						alert(error)
					})
			} else
				this.pushCurrentNodes([node])
		}, (error) => {
			console.log("error:", error)
			alert(error)
		})
	}

	/**
	 * Go to to parent node of the given node.
	 */
	up(node) {
		if (node.id === -1) {
			this.clearSearchResults()
		} else {
			const prev = (this.state.nodeHistory.length > 1) ? this.state.nodeHistory[1] : null
			if (prev !== null && prev.length > 0)
				this.state.popCurrentNodes()
			else
				this.state.pushCurrentNodeById(node.parent_id)
		}
	}

	/**
	 * Debug function to print node history.
	 * 
	 * @param {*} hs override for this.state.nodeHistory
	 */
	printNodeHistory(hs) {
		console.log("---history")
		let i = 0
		for (const h of hs || this.state.nodeHistory) {
			console.log(i + ": " + JSON.stringify(h.map((n) => n.id)))
			i = i + 1
		}
		console.log("---end_of_history")
	}

	setVolume(v) {
		this.setState({ settings: { volume: v, ...this.state.settings } })
		localStorage.setItem('volume', v)
	}

	componentDidMount() {
		if (this.props.initialNodeID)
			this.pushCurrentNodeById(this.props.initialNodeID)
		else if (this.state.homeNodeID)
			this.pushCurrentNodeById(this.state.homeNodeID)
	}

	clearSearchResults() {
		const hs = this.state.nodeHistory.filter((h) => h.length === 0 || h[0].id !== -1)
		const next = (hs.length === 0) ? null : hs[0]
		this.setState({ currentNodes: next, nodeHistory: hs })
	}

	/**
	 * Called when search results have been returned by then server.
	 * 
	 * @param {[Node]} rs matching nodes
	 */
	onSearchResults(rs) {
		if (rs === null)
			this.clearSearchResults()
		else {
			const dir = {
				id: -1,
				parent_id: null,
				mime_type: 'inode/directory',
				path: "Search results:",
				children: rs || []
			}
			this.state.pushCurrentNodes([dir])
		}
	}

	render() {
		return <WindowManager ctx={this.state} />
	}
}
