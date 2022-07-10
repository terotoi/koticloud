import React from 'react'
import { makeStyles } from '@mui/styles'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import TextField from '@mui/material/TextField'

const styles = makeStyles((theme) => ({
    newPasswd: {
        marginTop: '2em'
    }
}))

/**
 * PasswordDialog is a dialog for changing a user's password.
 * 
 * @param {string} props.text - dialog text
 * @param {function} props.onClose - called when the dialog is closed for any reason
 * @param {function(oldPasswd, newPasswd)} props.onConfirm - function called
 *  when the dialog is confirmed
 */
export default function PasswordDialog(props) {
    const [oldPasswd, setOldPasswd] = React.useState("")
    const [newPasswd, setNewPasswd] = React.useState("")
	const classes = styles()

    const handleConfirm = () => {
        props.onClose()
        if (props.onConfirm)
            props.onConfirm(oldPasswd, newPasswd)
    }

    return (
        <Dialog
            open={true}
            onClose={props.onClose}
            aria-labelledby="passwd-dialog-title"
            aria-describedby="passwd-dialog-description">
            <DialogContent>
                <DialogContentText id="passwd-dialog-description">
                    {props.text}
                </DialogContentText>

                <TextField
                    color="primary"
                    autoFocus required fullWidth
                    margin="dense"
                    label={"Enter old password"}
                    type="password"
                    autoComplete="current-password"
                    value={oldPasswd}
                    onChange={(ev) => { setOldPasswd(ev.target.value) }} />

                <TextField
                    className={classes.newPasswd}
                    color="primary"
                    required fullWidth
                    margin="dense"
                    label={"Enter new password"}
                    type="password"
                    autoComplete="new-password"
                    value={newPasswd}
                    onChange={(ev) => { setNewPasswd(ev.target.value) }} />
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose}>
                    Cancel
                    </Button>
                <Button onClick={handleConfirm}>
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>)
}

/**
 * Creates a PasswordDialog and adds it to the context using context.addDialog(dialog)
 * On close, context.removeDialog(dialog) will be called.
 * 
 * @param {Context} context - the context to add the dialog in
 * @param {string} props.text - main text of the dialog
 * @param {function(oldPasswd, newPasswd)} props.onConfirm - function called
 *  when the dialog is confirmed
 */
export function openPasswordDialog(context, props) {
    const dialog =
        <PasswordDialog
            text={props.text}
            onConfirm={props.onConfirm}
            onClose={() => { context.removeDialog(dialog) }} />
    context.addDialog(dialog)
}
