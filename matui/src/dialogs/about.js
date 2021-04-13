import React from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'

const VERSION = '0.1.0'

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


