import React from 'react'
import { makeStyles } from '@mui/styles'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'

import ArrowUpward from '@mui/icons-material/ArrowUpward'
import AddBoxIcon from '@mui/icons-material/AddBox'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'

import { openInputDialog } from '../dialogs/input'
import { zooms, NodeGrid } from './grid'
import { openNewFileDialog } from './dialogs/new_file'
import { openErrorDialog } from '../dialogs/error'
import NodeList from './list'
import UploadWindow from './upload'
import { sortNodes } from './util'
import api from '../api'

const defaultZoom = 0

const styles = makeStyles((theme) => ({
	root: {
		marginTop: theme.spacing(2),
	},
	pathText: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		fontSize: '120%'
	},
	toolbar: {
		marginBottom: theme.spacing(2),
		alignContent: 'flex-end',
		justifyContent: 'space-between'
	},
}))

/**
 * FileManagerView displays display a directory.
 * 
 * @param {Node} props.node - the directory node
 * @param {string} props.title - optional title to display, instead of a path
 * @param {functoin} props.onBack - called when user clicks on the back button
 * @param {function} props.onAction - callled with (action, node, ...args) for an action on the node
 * @param {function} props.onNodeAdded - called when a node has been uploaded
 * @param {Object} props.clipboard - contents of the clipboard
 * @param {Object} props.settings - user's settings
 * @param {state} props.ctx
 * @param {WindowManager} props.wm - the window manager
 */
export default function FileManagerView(props) {
	const settingPreviews = localStorage.getItem("previews") !== "false"
	const settingZoom = localStorage.getItem("zoom") ?
		parseInt(localStorage.getItem("zoom")) : defaultZoom

	const classes = styles()
	const [previews, setPreviews] = React.useState(settingPreviews)
	const [zoom, setZoom] = React.useState(settingZoom)
	const wm = props.wm

	function newFile() {
		const createFile = (name, type) => {
			const uploader = new api.Uploader({
				parentID: props.node.id,
				url: "/node/new",
				authToken: props.ctx.authToken,
				done: (node) => {
					console.log("File created")
					props.onNodeAdded(node)
				},
				error: (err) => {
					console.log(err)
					openErrorDialog(wm, "Error creating a file: " + name)
				}
			})

			uploader.upload(new Blob([''], { type: 'text/plain' }),
				{ filename: name })
		}

		openNewFileDialog(wm, {
			onConfirm: createFile
		})
	}

	function newFolder() {
		const makeDir = (name) => {
			api.makeDir(
				props.node.id,
				name,
				props.ctx.authToken,
				(node) => { props.onAction('makedir', node) },
				(error) => { openErrorDialog(wm, error) })
		}

		openInputDialog(wm, {
			text: "Create a directory:",
			label: "Name of the directory",
			onConfirm: makeDir,
			cancelText: ""
		})
	}

	function openUpload() {
		wm.openWindow('Upload files',
			<UploadWindow
				parent={props.node}
				authToken={props.ctx.authToken}
				onDone={props.onNodeAdded}
				wm={wm} />)
	}

	function togglePreviews() {
		setPreviews(!previews)
		localStorage.setItem("previews", !previews ? "true" : "false")
	}

	function changeZoom(dir) {
		var z = zoom + dir
		if (z < 0)
			z = zooms.length - 1
		else if (z >= zooms.length)
			z = 0
		setZoom(z)

		localStorage.setItem("zoom", z)
	}

	// Filter out cut nodes and sort the rest.
	var nodes = props.node.children
	if (props.clipboard !== null && props.clipboard.action == 'cut')
		nodes = nodes.filter((n) => n !== props.clipboard.node)
	nodes = sortNodes(nodes)

	let rs = null

	//console.log(JSON.stringify(nodes))
	
	if (zoom > 0) {
		rs = <NodeGrid
			zoom={zoom}
			nodes={nodes}
			previews={previews}
			onNodeOpen={props.onNodeOpen}
			onAction={props.onAction}
			authToken={props.ctx.authToken}
			settings={props.settings}
			wm={wm} />
	} else {
		rs = <NodeList
			nodes={nodes}
			previews={previews}
			onNodeOpen={props.onNodeOpen}
			onAction={props.onAction}
			authToken={props.ctx.authToken}
			settings={props.settings}
			wm={wm} />
	}

	return (
		<div className={classes.root}>
			<Box className={classes.toolbar} display="flex" justifyContent="flex-start">
				<Box display="flex">
					<Button disabled={props.node.parent_id === null || props.node.path === '/'}
						onClick={() => props.ctx.openNodeId(props.node.parent_id)}>
						<ArrowUpward />
					</Button>
					<div className={classes.pathText}>{props.title || props.node.path}</div>
				</Box>

				<Box display="flex">
					{(props.clipboard !== null) ?
						(<Button onClick={() => { props.onAction('paste') }}>
							<Tooltip title="Paste"><img src="/icons/ui/paste.svg" /></Tooltip>
						</Button>) : null}
					<Button onClick={newFile}>
						<Tooltip title="Create a new file"><AddBoxIcon /></Tooltip>
					</Button>
					<Button onClick={newFolder}>
						<Tooltip title="Create a new folder"><CreateNewFolderIcon /></Tooltip>
					</Button>
					<Button onClick={openUpload}>
						<Tooltip title="Upload a file"><CloudUploadIcon /></Tooltip>
					</Button>
					<Button onClick={togglePreviews}>
						<Tooltip title="Show/hide previews">
							{previews ? <VisibilityIcon /> : <VisibilityOffIcon />}
						</Tooltip>
					</Button>
					<Button onClick={() => changeZoom(-1)}>
						<Tooltip title="Smaller icons"><ZoomOutIcon /></Tooltip>
					</Button>
					<Button onClick={() => changeZoom(1)}>
						<Tooltip title="Larger icons"><ZoomInIcon /></Tooltip>
					</Button>
				</Box>
			</Box>
			{rs}
		</div>
	)
}