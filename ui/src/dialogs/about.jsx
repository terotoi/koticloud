import React from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { VERSION } from '../version.js'

/**
 * AboutDialog shows the small program information dialog.
 * 
 * @param {function} props.onClose - Called when dialog is closed
 */
export default function AboutDialog(props) {
	return (
		<Dialog
			open={true}
			onClose={props.opClose}
			aria-labelledby="about-dialog-title"
			aria-describedby="about-dialog-description">
			<DialogTitle id="about-dialog-title">KotiCloud</DialogTitle>
			<DialogContent>
				<DialogContentText id="about-dialog-description">
					KotiCloud {VERSION}<br /> Copyright © 2020-2021 Tero Oinas.<br />
					This program is published under the Generic Public License v2.0.
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onClose} autoFocus>
					OK
        </Button>
			</DialogActions>
		</Dialog>
	)
}


