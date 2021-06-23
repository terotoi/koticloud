import React from 'react'
import { makeStyles } from '@material-ui/core'
import Button from '@material-ui/core/Button'

import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'

import LinearProgress from '@material-ui/core/LinearProgress'

import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'

import { openErrorDialog } from '../dialogs/error'
import api from '../api'

// Refresh filelist after all uploads after this delay.
const refreshDelay = 5000

const styles = makeStyles((theme) => ({
	window: {
		width: '60rem',
		height: '40rem',
		padding: '1rem'
	},
	uploadButton: {
		marginTop: theme.spacing(4)
	}
}))

/**
 * UploadWindow
 * 
 * @param {Node} parent - the target directory
 * @param {string} authToken - JWT authentication token
 * @param {function(Node)} onDone - called when one or more files have been uploaded
 * @param {Object} context - context object
 */
export default function UploadWindow(props) {
	const [files, setFiles] = React.useState([])
	const [current, setCurrent] = React.useState(null)
	const [progress, setProgress] = React.useState(0)
	const classes = styles()

	function onSelected(ev) {
		setFiles(ev.target.files)
	}

	function beginUpload() {
		var i = 0
		const uploader = new api.Uploader({
			parentID: props.parent.id,
			url: "/node/new",
			authToken: props.authToken,
			progress: (p) => {
				setProgress(Math.round((p.loaded / p.total) * 100))
			},
			done: (node) => {
				props.onDone(node)

				i = i + 1
				if (i < files.length) {
					setCurrent(files[i])
					uploader.upload(files[i], { filename: files[i].name })
				}
			},
			error: (err) => {
				console.log("Upload Error:", err)
				openErrorDialog(props.context, "Error uploading the file: " + err)
			}
		})

		setCurrent(files[0].name)
		uploader.upload(files[0], { filename: files[0].name })
	}

	return (
		<div className={classes.window}>
			<DialogTitle>Upload files</DialogTitle>
			<DialogContent>
				<DialogContentText>
					Select files to upload, then click "Upload".
				</DialogContentText>

				<label htmlFor="upload-input">
					<input id="upload-input"
						type="file" multiple={true}
						onChange={onSelected} style={{ display: 'none' }} />
					<Button component="span">Select files</Button>
				</label>

				<Table aria-label="simple table">
					<TableHead>
						<TableRow>
							<TableCell>Filename</TableCell>
							<TableCell align="right">Size</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{Array.from(files).map((file) => (
							<TableRow key={file.name}>
								<TableCell component="th" scope="row">
									{file.name}
								</TableCell>
								<TableCell align="right">{file.size}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>

				<p>File progress: {current ? current.name : ""}</p>
				<LinearProgress variant="determinate" value={progress} />
			</DialogContent>
			<DialogActions>
				<Button onClick={beginUpload} disabled={current !== null}>Upload</Button>
			</DialogActions>
		</div>)
}
