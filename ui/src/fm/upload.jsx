/**
 * upload.jsx - file upload window
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React from 'react'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import LinearProgress from '@mui/material/LinearProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { openErrorDialog } from '../dialogs/error'
import api from '../api'
import { Box } from '@mui/material'

const sxs = {
	window: {
		width: '60rem',
		height: '40rem',
		padding: '1rem'
	}
};

/**
 * UploadWindow
 * 
 * @param {Node} parent - the target directory
 * @param {string} authToken - JWT authentication token
 * @param {function(Node)} onDone - called when one or more files have been uploaded
 * @param {WindowManager} props.wm - the window manager
 */
export default function UploadWindow(props) {
	const [files, setFiles] = React.useState([])
	const [current, setCurrent] = React.useState(null)
	const [progress, setProgress] = React.useState(0)

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
				openErrorDialog(props.wm, "Error uploading the file: " + err)
			}
		})

		setCurrent(files[0].name)
		uploader.upload(files[0], { filename: files[0].name })
	}

	return (
		<Box
			component="div"
			sx={sxs.window}>
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
				<Button onClick={beginUpload} disabled={(current !== null) || (files.length === 0)}>Upload</Button>
			</DialogActions>
		</Box>)
}
