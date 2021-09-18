import React from 'react'
import { makeStyles } from '@material-ui/core'

import FileManagerView from './fm_view'
import { openAlertDialog } from '../dialogs/alert'
import { openErrorDialog } from '../dialogs/error'
import { openInputDialog } from '../dialogs/input'
import { sortNodes } from './util'
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
 * FileManagerModel is the model class of the file manager.
 * File manager performs basic operations (open, copy, move, rename, delete) of file system nodes.
 * 
 * @param {[Node...]} props.nodes - optional override for nodes to list
 * @param {Object} props.node - directory node to open
 * @param {string} props.ctx.authToken - JWT authentication token
 * @param {Object} props.settings - user's settings
 * @param {state} props.ctx
 * @param {WindowManager} props.wm - the window manager
 */
export default function FileManagerModel(props) {
	const [dirPath, setDirPath] = React.useState('')
	const [nodes, setNodes] = React.useState([])
	const [title, setTitle] = React.useState('')
	const [clipboard, setClipboard] = React.useState(null)
	const classes = styles()
	const wm = props.wm

	// Copy nodes from the override to nodes state, use by search.
	React.useEffect(() => {
		if (props.nodes) {
			setNodes(props.nodes)
			setTitle("Search results:")
		} else {
			setTitle(dirPath)
		}
	}, [props.nodes])


	React.useEffect(() => {
		// Load information about a directory node and its children.
		if (props.node.children !== undefined && props.node.path !== undefined) {
			setDirPath(props.node.path)
			setNodes(props.node.children)
		} else
			api.listDir(props.node.id,
				props.ctx.authToken,
				(r) => {
					setDirPath(r.DirPath)
					setNodes(r.Children)
				},
				(error) => { openErrorDialog(wm, error) })
	}, [props.node])

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
			api.renameNode(node.id, name, props.ctx.authToken,
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
			api.deleteNode(node.id, props.ctx.authToken,
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
		api.updateProgress(node.id, node.progress, node.volume, props.ctx.authToken, () => {
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

			if (n.parent_id != props.node.id) {
				const f = (clipboard.action === 'copy') ? api.copyNode :
					((clipboard.action == 'cut') ? api.moveNode : null)

				f(n, props.node, props.ctx.authToken,
					(r) => {
						const ls = r.filter((n) => n.parent_id === props.node.id)
						setNodes((prev, props) => [...prev, ...ls])
					},
					(error) => { openErrorDialog(wm, error) })
			}
			setClipboard(null)
		}
	}

	// Called when a new node has been added.
	function onNodeAdded(n) {
		if (n.parent_id === props.node.id)
			setNodes((prev, props) => [...prev, n])
	}

	/*
	function onNodeSaved(n) {
		if (n.parent_id == props.node.id) {
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
	}*/

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

	const onBack = () => {
		props.ctx.up(props.node)
	}

	// Filter out cut nodes and sort the rest.
	var nds = nodes
	if (clipboard !== null && clipboard.action == 'cut')
		nds = nds.filter((n) => n !== clipboard.node)
	nds = sortNodes(nds)

	return (
		<div className={classes.root}>
			<FileManagerView
				dir={props.node}
				path={dirPath}
				title={title}
				nodes={nds}
				clipboard={clipboard}
				onBack={onBack}
				onNodeOpen={(node) => { props.ctx.pushCurrentNodes([node, ...nds]) }} //.filter((n) => n !== node)]) }}
				onNodeAction={nodeAction}
				onNodeAdded={onNodeAdded}
				settings={props.settings}
				ctx={props.ctx}
				wm={wm} />
		</div>)
}
