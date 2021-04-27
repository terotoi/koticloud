import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'

import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos'
import GetAppIcon from '@material-ui/icons/GetApp'
import IconButton from '@material-ui/core/IconButton'
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious'
import SkipNextIcon from '@material-ui/icons/SkipNext'

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
	inner: {
		display: 'flex',
		flexGrow: 1,
		flexDirection: 'column'
	},
	controls: {
		left: '2rem',
		top: '2rem',
		zIndex: 100,
		backgroundColor: theme.palette.background.default,
	},
	filename: {
		marginLeft: theme.spacing(2),
		marginRight: theme.spacing(1)
	},
	download: {
		marginLeft: '6rem',
		marginTop: '5rem',
		height: '10rem',
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
 * @param {function} props.onBack - called when user goes back the path view
 */
export default function NodeView(props) {
	const [node, setNode] = React.useState(props.initialNode)
	const [hover, setHover] = React.useState(true)
	const classes = styles()

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

	function onBack() {
		setNode(null)
		props.onBack()
	}

	function renderPlayable() {
		return <PlayableView
			node={node}
			authToken={props.authToken}
			onEnded={onNextNode} />
	}

	function renderImage() {
		return <ImageView node={node} />
	}

	function renderPDF() {
		return <PDFView
			node={node}
			authToken={props.authToken}
		/>
	}

	function renderTextEdit() {
		return <TextEdit
			node={node}
			onSave={props.onNodeSaved}
			authToken={props.authToken} />
	}

	function renderDownload() {
		return (
			<Box display="flex" flexDirection="column" className={classes.download}>
				<Box display="flex">
					<img
						src={nodeThumb(node, props.previews)} />
					</Box>
				<Typography>Type: {node.mime_type}</Typography>
				<Button variant="contained" color="secondary" href={nodeURL(node)} download={node.name}>{node.name}</Button>
				<Typography>Size: {node.size}</Typography>
			</Box >)
	}

	function renderControls(vis) {
		return (
			<Box
				display={(hover || !vis) ? "flex" : "none"}
				style={vis ? { "position": "fixed" } : {}}
				flexDirection="row"
				alignItems="center"
				onMouseEnter={() => { setHover(true) }}
				className={classes.controls}>
				<IconButton onClick={onBack}><ArrowBackIosIcon /></IconButton>
				<IconButton onClick={onPrevNode}><SkipPreviousIcon /></IconButton>
				<IconButton onClick={onNextNode}><SkipNextIcon /></IconButton>
				<IconButton href={nodeURL(node)} download={node.name}><GetAppIcon /></IconButton>
				<Typography className={classes.filename}>{node.name}</Typography>
			</Box >)
	}

	var hi
	if (isPlayable(node.mime_type))
		hi = renderPlayable()
	else if (isImage(node.mime_type))
		hi = renderImage()
	else if (node.mime_type === "application/pdf")
		hi = renderPDF()
	else if (isText(node.mime_type))
		hi = renderTextEdit()
	else
		hi = renderDownload()

	if (node !== null) {
		return (
			<div className={classes.root}>
				{ renderControls(isVideo(node.mime_type) || isImage(node.mime_type))}

				<div className={classes.inner}
					onMouseEnter={() => { setHover(true) }}
					onMouseLeave={() => { setHover(false) }}>
					{hi}
				</div>
			</div>)
	} else
		return null
}
