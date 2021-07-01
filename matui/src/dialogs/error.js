import React from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import { capitalize } from '../util'

/**
 * ErorDialog is for showing error messages.
 * 
 * @param {string} props.text - dialog text
 * @param {function} props.onClose - Called when dialog is closed
 */
export default function ErrorDialog(props) {
	return (
		<Dialog
			open={true}
			onClose={props.onClose}
			aria-labelledby="error-dialog-title"
			aria-describedby="error-dialog-description">
			<DialogTitle id="error-dialog-title">Error</DialogTitle>
			<DialogContent>
				<DialogContentText id="error-dialog-description">
					{capitalize(props.text)}.
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

/**
 * Creates an ErrorDialog and adds it to the window manager
 * using wm.addDialog(dialog)
 * On close, wm.removeDialog(dialog) will be called.
 * 
 * @param {WindowManager} wm - the window manager
 * @param {string} error - the error text
 */
export function openErrorDialog(wm, error) {
  const dialog =
    <ErrorDialog
      text={error.toString()}
      onClose={() => { wm.removeDialog(dialog) }} />
	wm.addDialog(dialog)
}

