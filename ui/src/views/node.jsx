/**
 * node.jsx - the node (file) view
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import ImageView from './image'
import MediaView from './media/media'
import ReaderView from './reader'
import TextEdit from './editor'
import { isImage, isText, isMedia, nodeURL } from '../util'

const sxs = {
	download: {
		height: '16rem',
		padding: '1rem',
		flexDirection: 'column',
		gap: '1rem'
	}
};

/**
 * NodeView renders a resource node (currently always a node.)
 * 
 * @param {Node} props.node - the node to render
 * @param {Node} props.onNodeSaved - called when a node has been saved either to a new file or existing
 * @param {function} props.onAction - callled with (action, node, ...args) for an action on the node
 * @param {state} props.ctx
 * @param {Window} props.wnd - optional window object
 * @param {WindowManager} props.wm - the window manager
 */
export default function NodeView(props) {
	const wm = props.wm

	function jumpBy(dir) {
		const siblings = props.node.siblings
		const index = siblings.findIndex(n => n.id === props.node.id)

		if (index !== -1 && (index + dir <= siblings.length - 1) &&
			(index + dir >= 0)) {
			const node = siblings[index + dir]
			console.log("Setting new node to", node.id)
			props.ctx.openNode(node)
		}
	}

	function nextNode() {
		jumpBy(1)
	}

	function prevNode() {
		jumpBy(-1)
	}

	function renderMedia() {
		return <MediaView
			node={props.node}
			onEnded={nextNode}
			onNextNode={nextNode}
			onPrevNode={prevNode}
			onAction={props.onAction}
			wnd={props.wnd}
			ctx={props.ctx}
			wm={wm} />
	}

	function renderImage() {
		return <ImageView
			node={props.node}
			onNextNode={nextNode}
			onPrevNode={prevNode}
			onAction={props.onAction}
			wnd={props.wnd}
			ctx={props.ctx}
			wm={wm} />
	}

	function renderReader() {
		return <ReaderView
			node={props.node}
			onNextNode={nextNode}
			onPrevNode={prevNode}
			onAction={props.onAction}
			ctx={props.ctx}
			wm={wm} />
	}

	function renderTextEdit() {
		return <TextEdit
			node={props.node}
			onSave={props.onNodeSaved}
			onAction={props.onAction}
			ctx={props.ctx}
			wm={wm} />
	}

	function renderDownload(node) {
		return (
			<Box display="flex" flexDirection="column" sx={{ margin: '1rem', gap: '1rem', maxWidth: '20rem' }}>
				<Box display="flex">
					<img
						src={node.thumbURL(props.previews)} />
				</Box>
				<Typography>{node.name}</Typography>
				<Typography>Type: {node.mime_type}</Typography>
				<Button variant="contained" color="secondary" href={nodeURL(node)} download={node.name}>Download</Button>
				<Typography>Size: {Math.round(node.size / 1024)} kB</Typography>
			</Box >)
	}

	let html
	if (isMedia(props.node.mime_type))
		html = renderMedia(props.node)
	else if (isImage(props.node.mime_type))
		html = renderImage()
	else if (props.node.mime_type === "application/pdf")
		html = renderReader()
	else if (isText(props.node.mime_type))
		html = renderTextEdit()
	else
		html = renderDownload(props.node)

	return html
}
