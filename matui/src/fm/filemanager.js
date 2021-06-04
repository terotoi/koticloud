import React from 'react'
import { makeStyles } from '@material-ui/core'

import DirView from './dirview'
import NodeView from '../views/node'
import { openAlertDialog } from '../dialogs/alert'
import { openErrorDialog } from '../dialogs/error'
import { openInputDialog } from '../dialogs/input'

import { sortNodes } from './util'
import { setNodeMeta } from '../util'
import api from '../api'

const styles = makeStyles((theme) => ({
	root: {
		display: 'flex',
		flexDirection: 'column',
		flexGrow: 1
	}
}))

/**
 * FileManager performs basic operations (open, copy, move, rename, delete) of file system nodes.
 * 
 * @param {[Node...]} props.nodes - optional override for nodes to list
 * @param {string} props.initialNodeID - ID of the node to open
 * @param {string} props.authToken - JWT authentication token
 * @param {Context} props.context
 */
export default function FileManager(props) {
	const [dir, setDir] = React.useState(null)
	const [dirPath, setDirPath] = React.useState('')

	const [nodes, setNodes] = React.useState([])
	const [node, setNode] = React.useState(null) // Currently selected node

	const [title, setTitle] = React.useState('')
	const [clipboard, setClipboard] = React.useState(null)
	const classes = styles()
	const ctx = props.context

	// Load information about a directory node and its children.
	// Can be called with id === undefinde, in that case reload the current directory.
	function loadDir(id) {
		if (id === undefined)
			id = dir.id

		api.listDir(id,
			props.authToken,
			(r) => {
				setDir(r.Dir)
				setDirPath(r.DirPath)
				setNodes(r.Children)
			},
			(error) => { openErrorDialog(ctx, error) })
	}

	// Initial directory
	React.useEffect(() => {
		if (props.authToken && props.initialNodeID !== null) {
			loadDir(props.initialNodeID)
		}
	}, [props.authToken, props.initialNodeID])

	// Copy nodes from the override to nodes state, use by search.
	React.useEffect(() => {
		if (props.nodes !== null) {
			setNodes(props.nodes)
			setTitle("Search results:")
		} else {
			setTitle(dirPath)
			//loadPath()
		}
	}, [props.nodes])

	function onBack() {
		if (node !== null)
			setNode(null)
		else if (dir !== null && dir.parent_id !== null) {
			setTitle(null)
			loadDir(dir.parent_id)
		}
	}

	/**
	 * nodeOpen
	 * @param {Node} node 
	 */
	function nodeOpen(node) {
		console.log("Open:", node.mime_type)
		if (node.mime_type == "inode/directory") {
			loadDir(node.id)
		} else {
			setNode(node)
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
				(error) => { openErrorDialog(ctx, error) })
		}

		openInputDialog(ctx, {
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
				(error) => { openErrorDialog(ctx, error) })
		}

		openAlertDialog(ctx, {
			text: 'Are you sure you want to delete?',
			confirmText: 'Delete',
			cancelText: 'Cancel',
			onConfirm: onAlertConfirm
		})
	}

	function nodeMarkViewed(node, progress) {
		setNodeMeta(node, progress, (node.MetaType === 'progress' && node.MetaData.Volume !== undefined) ?
			node.MetaData.Volume : 1.0)
		api.updateMeta(node.id, node.MetaType, node.MetaData, props.authToken, () => {
			setNodes([...nodes])
		},
			(error) => { openErrorDialog(ctx, error) })
	}

	function nodeMakedirDone(node) {
		setNodes([...nodes, node])
	}

	// Cut or copy a node to the clipboard
	function nodeCutCopy(action, n) {
		if (action === 'cut' && n === node)
			setNode(null)
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
					(error) => { openErrorDialog(ctx, error) })
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
				nodeMarkViewed(n, n.length)
				break
			case 'mark_notviewed':
				nodeMarkViewed(n, 0.0)
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

	// Filter out cut nodes and sort the rest.
	var nds = nodes
	if (clipboard !== null && clipboard.action == 'cut')
		nds = nds.filter((n) => n !== clipboard.node)
	nds = sortNodes(nds)

	if (node) {
		return (
			<div className={classes.root}>
				<NodeView
					initialNode={node}
					nodes={nds}
					authToken={props.authToken}
					onNodeSaved={onNodeSaved}
					onBack={() => { setNode(null) }}
					context={ctx} />
			</div>)
	} else {
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
					context={ctx} />
			</div>)
	}
}
