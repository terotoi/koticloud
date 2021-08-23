import React from 'react'
import { makeStyles } from '@material-ui/core'

import DirView from './dirview'
import NodeView from '../views/node'
import { openAlertDialog } from '../dialogs/alert'
import { openErrorDialog } from '../dialogs/error'
import { openInputDialog } from '../dialogs/input'
import { sortNodes } from './util'
import { isDir, isAudio } from '../util'
import api from '../api'

const styles = makeStyles((theme) => ({
	root: {
		display: 'flex',
		flexDirection: 'column',
		flexGrow: 1,
		padding: theme.spacing(2)
	}
}))

/**
 * FileManager performs basic operations (open, copy, move, rename, delete) of file system nodes.
 * 
 * @param {[Node...]} props.nodes - optional override for nodes to list
 * @param {string} props.initialNodeID - ID of the node to open initially
 * @param {string} props.authToken - JWT authentication token
 * @param {Object} props.settings - user's settings
 * @param {state} props.ctx
 * @param {WindowManager} props.wm - the window manager
 */
export default function FileManager(props) {
	const [dir, setDir] = React.useState(null)
	const [dirPath, setDirPath] = React.useState('')

	const [nodes, setNodes] = React.useState([])
	const [title, setTitle] = React.useState('')
	const [clipboard, setClipboard] = React.useState(null)
	const classes = styles()
	const wm = props.wm

	// Initial directory
	React.useEffect(() => {
		if (props.authToken && props.initialNodeID !== null) {
			api.queryNode(props.initialNodeID, props.authToken, (node) => {
				console.log("Opening node", node.id)
				nodeOpen(node)
			},
				(error) => { openErrorDialog(wm, error) })
		}
	}, [props.authToken, props.initialNodeID])

	// Copy nodes from the override to nodes state, use by search.
	React.useEffect(() => {
		if (props.nodes) {
			setNodes(props.nodes)
			setTitle("Search results:")
		} else {
			setTitle(dirPath)
		}
	}, [props.nodes])

	// Load information about a directory node and its children.
	// Can be called with id === undefinde, in that case reload the current directory.
	function loadDir(id) {
		//if (id === undefined)
		//	id = dir.id

		api.listDir(id,
			props.authToken,
			(r) => {
				setDir(r.Dir)
				setDirPath(r.DirPath)
				setNodes(r.Children)
			},
			(error) => { openErrorDialog(wm, error) })
	}

	/**
	 * nodeOpen
	 * @param {Node} node 
	 */
	function nodeOpen(node) {
		console.log("Open:", node.id, node.mime_type)
		if (isDir(node.mime_type)) {
			loadDir(node.id)
		} else {
			const maximize = !isAudio(node.mime_type)

			props.ctx.setFmEnabled(!maximize)

			wm.openWindow(node.name, <NodeView
				initialNode={node}
				nodes={nds}
				authToken={props.authToken}
				onNodeSaved={onNodeSaved}
				ctx={props.ctx}
				wm={wm} />, maximize)
		}
	}

	/**
	 * nodeRename
	 * @param {Node} node 
	 */
	function nodeRename(node) {
		const onRenameSuccess = (response) => {
			// Rename it locally
			const it = nodes
			for (const node of response) {
				for (const n of it) {
					if (n.id === node.id) {
						n.name = node.name
						break
					}
				}
			}
			setNodes([...it])
		}

		const onRenameConfirm = (name) => {
			api.renameNode(node.id, name, props.authToken,
				onRenameSuccess,
				(error) => { openErrorDialog(wm, error) })
		}

		openInputDialog(wm, {
			text: 'Rename a node.',
			value: node.name,
			confirmText: 'Rename',
			cancelText: 'Cancel',
			onConfirm: onRenameConfirm
		})
	}

	function nodeDelete(node) {
		const onDeleteSuccess = (response) => {
			// Remove the node locally
			const it = nodes.filter((x) => x !== node)
			setNodes(it)
		}

		const onAlertConfirm = () => {
			api.deleteNode(node.id, props.authToken,
				onDeleteSuccess,
				(error) => { openErrorDialog(wm, error) })
		}

		openAlertDialog(wm, {
			text: 'Are you sure you want to delete?',
			confirmText: 'Delete',
			cancelText: 'Cancel',
			onConfirm: onAlertConfirm
		})
	}

	function nodeUpdateProgress(node) {
		api.updateProgress(node.id, node.progress, node.volume, props.authToken, () => {
			setNodes([...nodes])
		},
			(error) => { openErrorDialog(wm, error) })
	}

	function nodeMakedirDone(node) {
		setNodes([...nodes, node])
	}

	// Cut or copy a node to the clipboard
	function nodeCutCopy(action, n) {
		setClipboard({ action: action, node: n })
	}

	function nodePaste() {
		if (clipboard !== null) {
			const n = clipboard.node

			if (n.parent_id != dir.id) {
				const f = (clipboard.action === 'copy') ? api.copyNode :
					((clipboard.action == 'cut') ? api.moveNode : null)

				f(n, dir, props.authToken,
					(r) => {
						const ls = r.filter((n) => n.parent_id === dir.id)
						setNodes((prev, props) => [...prev, ...ls])
					},
					(error) => { openErrorDialog(wm, error) })
			}
			setClipboard(null)
		}
	}

	// Called when a new node has been added.
	function onNodeAdded(n) {
		if (n.parent_id === dir.id)
			setNodes((prev, props) => [...prev, n])
	}

	function onNodeSaved(n) {
		if (n.parent_id == dir.id) {
			console.log("Save:", n.id)

			const i = nodes.findIndex((k) => k.id === n.id)
			if (i !== -1) {
				setNodes((prev) => {
					const new_nodes = [...prev]
					new_nodes[i] = n
					return new_nodes
				})
			}
		}
	}

	function nodeAction(action, n, ...args) {
		switch (action) {
			case 'cut':
			case 'copy':
				nodeCutCopy(action, n)
				break
			case 'paste':
				nodePaste()
				break

			case 'mark_viewed':
				nodeUpdateProgress(n)
				break
			case 'mark_notviewed':
				nodeUpdateProgress(n)
				break
			case 'rename':
				nodeRename(n)
				break
			case 'delete':
				nodeDelete(n)
				break
			case 'makedir':
				nodeMakedirDone(n)
				break
			default:
				break
		}
	}

	function onBack() {
		if (dir !== null && dir.parent_id !== null) {
			setTitle(null)
			loadDir(dir.parent_id)
		}
	}

	// Filter out cut nodes and sort the rest.
	var nds = nodes
	if (clipboard !== null && clipboard.action == 'cut')
		nds = nds.filter((n) => n !== clipboard.node)
	nds = sortNodes(nds)

	return (
		<div className={classes.root}>
			<DirView
				dir={dir}
				path={dirPath}
				title={title}
				nodes={nds}
				clipboard={clipboard}
				onBack={onBack}
				onNodeOpen={nodeOpen}
				onNodeAction={nodeAction}
				onNodeAdded={onNodeAdded}
				authToken={props.authToken}
				settings={props.settings}
				ctx={props.ctx}
				wm={wm} />
		</div>)
}
