/**
 * fm_model.jsx - file manager model
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React from 'react'
import FileManagerView from './fm_view'
import NodeView from '../views/node'
import { openAlertDialog } from '../dialogs/alert'
import { openErrorDialog } from '../dialogs/error'
import { openInputDialog } from '../dialogs/input'
import { isDir } from '../util'
import api from '../api'
import Node from '../models/node'

/**
 * FileManagerModel is the model class of the file manager.
 * File manager performs basic operations (open, copy, move, rename, delete) of file system nodes.
 * 
 * @param {Object} props.node - node to open
 * @param {string} props.ctx.authToken - JWT authentication token
 * @param {Object} props.settings - user's settings
 * @param {state} props.ctx
 * @param {WindowManager} props.wm - the window manager
 */
export default function FileManagerModel(props) {
	const [title, setTitle] = React.useState('')
	const [clipboard, setClipboard] = React.useState(null)
	const wm = props.wm

	/**
	 * nodeRename
	 * @param {Node} node 
	 */
	function nodeRename(node) {
		const onRenameSuccess = (response) => {
			// Rename it locally

			const it = props.node.children
			for (const node of response) {
				for (const n of it) {
					if (n.id === node.id) {
						n.name = node.name
						break
					}
				}
			}

			props.node.children = [...it]
			props.ctx.refreshNode()
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
			const it = props.node.children.filter((x) => x !== node)
			props.node.children = it
			props.ctx.refreshNode()
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
			props.ctx.refreshNode()
		},
			(error) => { openErrorDialog(wm, error) })
	}

	function nodeMakedirDone(node) {
		props.node.children = [...props.node.children, node]
		props.ctx.refreshNode()
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
						const lsm = ls.map((n) => Node.ensure(n))
						props.node.children = [...props.node.children, ...lsm]
						props.ctx.refreshNode()
					},
					(error) => { openErrorDialog(wm, error) })
			} else {
				openErrorDialog(wm, "Pasting into same directory not supported yet")
			}
			setClipboard(null)
		}
	}

	// Called when a new node has been added.
	function onNodeAdded(n) {
		if (n.parent_id === props.node.id) {
			props.node.children = [...props.node.children, n]
			props.ctx.refreshNode()
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

	const onBack = () => {
		props.ctx.popHistory()
	}

	if (isDir(props.node.mime_type)) {
		return (
			<div style={{
				display: 'flex',
				flexDirection: 'column',
				flexGrow: 1,
				padding: 2,
			}}>
				<FileManagerView
					node={props.node}
					title={title}
					clipboard={clipboard}
					onBack={onBack}
					onNodeOpen={props.ctx.openNode}
					onAction={nodeAction}
					onNodeAdded={onNodeAdded}
					settings={props.settings}
					ctx={props.ctx}
					wm={wm} />
			</div>)
	} else {
		return (
			<NodeView
				onAction={nodeAction}
				node={props.node}
				onNodeSaved={null}
				ctx={props.ctx}
				wm={wm} />)
	}
}
