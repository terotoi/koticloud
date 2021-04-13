import React from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import TextField from '@material-ui/core/TextField'

/**
 * InputDialog is for requesting single line of textual input from the user.
 * 
 * @param {string} props.text - dialog text
 * @param {label} props.label - label of the input field
 * @param {string} props.value - initial value of the input, default: ""
 * @param {string} props.confirmText - text of the button button, default: "Okay"
 * @param {string} props.cancelText - text of the cancel button, default: "Cancel"
 * @param {function} props.onClose - called when the dialog is closed for any reason
 * @param {function(string)} props.onConfirm(value) - called when user confirmed the dialog
 */
export default function InputDialog(props) {
    const [value, setValue] = React.useState(props.value || "")

    const handleConfirm = () => {
        props.onClose()
        if (props.onConfirm && value.trim() !== "")
            props.onConfirm(value)
    }

    return (
        <Dialog
            open={true}
            onClose={props.onClose}
            aria-labelledby="input-dialog-title"
            aria-describedby="input-dialog-description">
            <DialogContent>
                <DialogContentText id="input-dialog-description">
                    {props.text}
                </DialogContentText>

                <TextField
                    color="primary"
                    autoFocus
                    margin="dense"
                    id="text"
                    label={props.label}
                    type="string"
                    value={value}
                    required
                    fullWidth
                    onChange={(ev) => { setValue(ev.target.value) }} />
            </DialogContent>
            <DialogActions>
                {typeof(props.cancelText) === "string" ?
                    <Button onClick={props.onClose}>
                        {props.cancelText || "Cancel"}
                    </Button> : null}
                <Button onClick={handleConfirm}>
                    {props.confirmText || "Okay"}
                </Button>
            </DialogActions>
        </Dialog>)
}

/**
 * Creates an InputDialog and adds it to the context using context.addWindow(dialog)
 * On close, context.removeDialog(dialog) will be called.
 * 
 * @param {GlobalContext} context - the context to add the dialog in
 * @param {string} props.text - main text of the dialog
 * @param {label} props.label - label of the input field
 * @param {string} props.confirmText - text of the confirm dialog
 * @param {string} props.cancelText - text of the cancel dialog or null for no cancel
 * @param {function} props.onConfirm - function called when the dialog is confirmed
 */
export function openInputDialog(context, props) {
    const dialog =
        <InputDialog
            text={props.text}
            label={props.label}
            value={props.value}
            confirmText={props.confirmText}
            cancelText={props.cancelText}
            onConfirm={props.onConfirm}
            onClose={() => { context.removeWindow(dialog) }} />
    context.addWindow(dialog)
}
