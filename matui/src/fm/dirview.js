import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Tooltip from '@material-ui/core/Tooltip'

import ArrowBackIcon from '@material-ui/icons/ArrowBack'
import AddBoxIcon from '@material-ui/icons/AddBox'
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder'
import CloudUploadIcon from '@material-ui/icons/CloudUpload'
import VisibilityIcon from '@material-ui/icons/Visibility'
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff'
import ZoomInIcon from '@material-ui/icons/ZoomIn'
import ZoomOutIcon from '@material-ui/icons/ZoomOut'

import { openInputDialog } from '../dialogs/input'
import NodeList from './list'
import UploadWindow from './upload'
import { zooms, NodeGrid } from './grid'
import { openNewFileDialog } from './dialogs/new_file'
import { openErrorDialog } from '../dialogs/error'
import api from '../api'

const defaultZoom = 0

const styles = makeStyles((theme) => ({
	root: {
		marginTop: theme.spacing(2)
	},
	pathGroup: {
		marginLeft: theme.spacing(2)
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
 * DirView displays nodes of a directory nodes in either a grid or a list.
 * 
 * @param {Node} dir - the directory node
 * @param {string} path - current path
 * @param {string} title - optional title to display, instead of a path
 * @param {[...Node]} nodes - list of nodes to display
 * @param {functoin} props.onBack - called when user clicks on the back button
 * @param {function} props.onNodeOpen - called when an node should be opened
 * @param {function} props.onNodeAction - callled with (action, node, ...args) for an action on the node
 * @param {string} props.authToken - JWT authentication token
 * @param {function} props.onNodeAdded - called when a node has been uploaded
 * @param {Object} props.clipboard - contents of the clipboard
 * @param {Object} props.settings - user's settings
 * @param {WindowManager} props.wm - the window manager
 */
export default function DirView(props) {
	const settingPreviews = localStorage.getItem("previews") === "true"
	const settingZoom = localStorage.getItem("zoom") ?
		parseInt(localStorage.getItem("zoom")) : defaultZoom

	const classes = styles()
	const [previews, setPreviews] = React.useState(settingPreviews)
	const [zoom, setZoom] = React.useState(settingZoom)
	const wm = props.wm

	function newFile() {
		const createFile = (name, type) => {
			const uploader = new api.Uploader({
				parentID: props.dir.id,
				url: "/node/new",
				authToken: props.authToken,
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
				props.dir.id,
				name,
				props.authToken,
				(node) => { props.onNodeAction('makedir', node) },
				(error) => { openErrorDialog(wm, error) })
		}

		openInputDialog(wm, {
			text: "Create a directory:",
			label: "Name of the direcotory",
			onConfirm: makeDir,
			cancelText: ""
		})
	}

	function openUpload() {
		wm.openWindow('Upload files',
			<UploadWindow
				parent={props.dir}
				authToken={props.authToken}
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

	let rs = null

	if (zoom > 0) {
		rs = <NodeGrid
			zoom={zoom}
			nodes={props.nodes}
			previews={previews}
			onNodeOpen={props.onNodeOpen}
			onNodeAction={props.onNodeAction}
			authToken={props.authToken}
			settings={props.settings}
			wm={wm} />
	} else {
		rs = <NodeList
			nodes={props.nodes}
			previews={previews}
			onNodeOpen={props.onNodeOpen}
			onNodeAction={props.onNodeAction}
			authToken={props.authToken}
			settings={props.settings}
			wm={wm} />
	}

	return (
		<div className={classes.root}>
			<Box className={classes.toolbar} display="flex" justifyContent="flex-start">
				<Box display="flex" className={classes.pathGroup} >
					<Button disabled={props.onBack === null || props.path === '/'} onClick={props.onBack}><ArrowBackIcon /></Button>
					<div className={classes.pathText}>{props.title || props.path}</div>
				</Box>

				<Box display="flex">
					{(props.clipboard !== null) ?
						(<Button onClick={() => { props.onNodeAction('paste') }}>
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