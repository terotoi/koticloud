import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'

import ImageView from './image'
import MediaView from './media/media'
import PDFView from './pdf'
//import TextEdit from './text'

import { isImage, isDir, isText, isMedia, nodeURL } from '../util'
import { nodeThumb } from '../thumbs'

const styles = makeStyles((theme) => ({
	root: {
		height: '100%'
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
 * @param {state} props.ctx
 * @param {Window} props.wnd - optional window object
 * @param {WindowManager} props.wm - the window manager
 */
export default function NodeView(props) {
	const [node, setNode] = React.useState(props.initialNode)
	const classes = styles()
	const wm = props.wm

	function onNextNode() {
		console.log("onNextNode", props.nodes.length)
		for (let i = 0; i < props.nodes.length - 1; i++) {
			if (node.id === props.nodes[i].id) {
				// Skip to next non-dir node
				for (let j = i + 1; j < props.nodes.length; j++) {
					if (!isDir(props.nodes[j].mime_type)) {
						setNode(props.nodes[j])
						if (props.wnd)
							props.wm.setTitle(props.wnd, props.nodes[j].name)
						break
					}
				}
				break
			}
		}
	}

	function onPrevNode() {
		console.log("onPrevNode", props.nodes.length)

		for (let i = 1; i < props.nodes.length; i++) {
			if (node.id === props.nodes[i].id) {
				// Skip to next non-dir node
				for (let j = i - 1; j >= 0; j--) {
					if (!isDir(props.nodes[j].mime_type)) {
						setNode(props.nodes[j])
						if (props.wnd)
							props.wm.setTitle(props.wnd, props.nodes[j].name)
						break
					}
				}
				break
			}
		}
	}

	function renderMedia() {
		return <MediaView
			node={node}
			onEnded={onNextNode}
			onNextNode={onNextNode}
			onPrevNode={onPrevNode}
			wnd={props.wnd}
			ctx={props.ctx}
			wm={wm} />
	}

	function renderImage() {
		return <ImageView
			node={node}
			onNextNode={onNextNode}
			onPrevNode={onPrevNode}
			wnd={props.wnd}
			ctx={props.ctx}
			wm={wm} />
	}

	function renderPDF() {
		return <PDFView
			node={node}
			onNextNode={onNextNode}
			onPrevNode={onPrevNode}
			ctx={props.ctx}
			wm={wm} />
	}

	function renderTextEdit() {
		return <div>Text editing disabled temporarily (mui-rte)</div>
		/*<TextEdit
			node={node}
			onSave={props.onNodeSaved}
			ctx={props.ctx}
			wm={wm} />*/
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
	if (isMedia(node.mime_type))
		html = renderMedia(node)
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
