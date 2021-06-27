import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'

import ImageView from './image'
import PDFView from './pdf'
import PlayableView from './playable'
import TextEdit from './text'

import { isPlayable, isImage, isDir, isVideo, isText, nodeURL } from '../util'
import { nodeThumb } from '../thumbs'

const styles = makeStyles((theme) => ({
	root: {
		display: 'flex',
		flexGrow: 1,
		flexDirection: 'column',
	},
	download: {
		height: '16rem',
		padding: '1rem',
		flexDirection: 'column',
		gap: '1rem'
	}
}))

/**
 * NodeView renders a resource node (currently always a node.)
 * 
 * @param {Node} props.initialNode - the node to render
 * @param {[...Node]} props.nodes - list of nodes which can be used to move forward / backward
 * @param {Node} props.onNodeSaved - called when a node has been saved either to a new file or existing
 * @param {string} props.authToken - JWT authentication token
 * @param {Context} props.context
 */
export default function NodeView(props) {
	const [node, setNode] = React.useState(props.initialNode)
	const classes = styles()
	const ctx = props.context

	function onNextNode() {
		for (let i = 0; i < props.nodes.length - 1; i++) {
			if (node.id === props.nodes[i].id) {
				// Skip to next non-dir node
				for (let j = i + 1; j < props.nodes.length; j++) {
					if (!isDir(props.nodes[j].mime_type)) {
						setNode(props.nodes[j])
						break
					}
				}
				break
			}
		}
	}

	function onPrevNode() {
		for (let i = 1; i < props.nodes.length; i++) {
			if (node.id === props.nodes[i].id) {
				// Skip to next non-dir node
				for (let j = i - 1; j >= 0; j--) {
					if (!isDir(props.nodes[j].mime_type)) {
						setNode(props.nodes[j])
						break
					}
				}
				break
			}
		}
	}

	function renderPlayable() {
		return <PlayableView
			node={node}
			authToken={props.authToken}
			onEnded={onNextNode}
			onNextNode={onNextNode}
			onPrevNode={onPrevNode}
			wnd={props.wnd}
			context={ctx} />
	}

	function renderImage() {
		return <ImageView
			node={node}
			onNextNode={onNextNode}
			onPrevNode={onPrevNode}
			wnd={props.wnd}
			context={ctx} />
	}

	function renderPDF() {
		return <PDFView
			node={node}
			authToken={props.authToken}
			context={ctx} />
	}

	function renderTextEdit() {
		return <TextEdit
			node={node}
			onSave={props.onNodeSaved}
			authToken={props.authToken}
			context={ctx} />
	}

	function renderDownload() {
		return (
			<div className={classes.root}>
				<Box display="flex" flexDirection="column" className={classes.download}>
					<Box display="flex">
						<img
							src={nodeThumb(node, props.previews)} />
					</Box>
					<Typography>Type: {node.mime_type}</Typography>
					<Button variant="contained" color="secondary" href={nodeURL(node)} download={node.name}>{node.name}</Button>
					<Typography>Size: {node.size}</Typography>
				</Box >
			</div>)
	}

	let html
	if (isPlayable(node.mime_type))
		html = renderPlayable()
	else if (isImage(node.mime_type))
		html = renderImage()
	else if (node.mime_type === "application/pdf")
		html = renderPDF()
	else if (isText(node.mime_type))
		html = renderTextEdit()
	else
		html = renderDownload()

	return html
}
