import React from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'

/**
 * AlertDialog is a general dialog for alerts.
 * 
 * @param {string} props.text - dialog text
 * @param {string} props.confirmText - text of the button button
 * @param {string} props.cancelText - text of the cancel button
 * @param {function} props.onClose - called when the dialog is closed for any reason
 * @param {function} props.onConfirm - called when user confirmed the dialog
 */
export default function AlertDialog(props) {
    const handleConfirm = () => {
        props.onClose()
        if (props.onConfirm)
            props.onConfirm()
    }

    return (
        <Dialog
            open={true}
            onClose={props.onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description">
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {props.text}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                {typeof (props.cancelText) === "string" ?
                    <Button onClick={props.onClose} autoFocus>
                        {props.cancelText || "Cancel"}
                    </Button> : null}
                <Button onClick={handleConfirm}>
                    {props.confirmText || "Okay"}
                </Button>
            </DialogActions>
        </Dialog>)
}

/**
 * Creates an AlertDialog and adds it to the context using context.addWindow(dialog)
 * On close, context.removeDialog(dialog) will be called.
 * 
 * @param {GlobalContext} context - the context to add the dialog in
 * @param {string} props.text - main text of the dialog
 * @param {string} props.confirmText - text of the confirm dialog
 * @param {string} props.cancelText - text of the cancel dialog or null for no cancel
 * @param {function} props.onConfirm - function called when the dialog is confirmed
 */
export function openAlertDialog(context, props) {
    const dialog =
        <AlertDialog
            text={props.text}
            confirmText={props.confirmText}
            cancelText={props.cancelText}
            onConfirm={props.onConfirm}
            onClose={() => { context.removeWindow(dialog) }} />
    context.addWindow(dialog)
}
