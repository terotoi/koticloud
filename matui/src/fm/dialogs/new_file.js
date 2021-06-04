import React from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField'

/**
 * NewFileDialog is for requesting name and type of a new file to be created.
 * 
 * @param {function} props.onClose - called when the dialog is closed for any reason
 * @param {function(string)} props.onConfirm(filename, type) - called when user confirmed the dialog
 */
export default function NewFileDialog(props) {
    const [filename, setFilename] = React.useState("")
    const [fileType, setFileType] = React.useState("text")

    const handleConfirm = () => {
        props.onClose()
        if (props.onConfirm && filename.trim() !== "")
            props.onConfirm(filename.trim(), fileType)
    }

    const handleFileTypeChange = (ev) => {
        setFileType(ev.target.value)
    }

    return (
        <Dialog
            open={true}
            onClose={props.onClose}
            aria-labelledby="newfile-dialog-title"
            aria-describedby="newfile-dialog-description">
            <DialogContent>
                <DialogContentText id="newfile-dialog-description">
                    Create a new file:
                </DialogContentText>

                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={fileType}
                    onChange={(ev) => { setFileType(ev.target.value)}}>
                    <MenuItem value="text">Text document</MenuItem>
                    </Select>

                <TextField
                    color="primary"
                    autoFocus
                    margin="dense"
                    id="text"
                    label="Filename"
                    type="string"
                    value={filename}
                    required
                    fullWidth
                    onChange={(ev) => { setFilename(ev.target.value) }} />
            </DialogContent >
        <DialogActions>
            <Button onClick={props.onClose}>Cancel</Button>
            <Button onClick={handleConfirm}>Create</Button>
        </DialogActions>
        </Dialog >)
}

/**
 * Creates an NewFileDialog and adds it to the context using context.addWindow(dialog)
 * On close, context.removeDialog(dialog) will be called.
 * 
 * @param {Context} context - the context to add the dialog in
 * @param {function} props.onConfirm - called on dialog confirmation
 */
export function openNewFileDialog(context, props) {
    const dialog =
        <NewFileDialog
            onConfirm={props.onConfirm}
            onClose={() => { context.removeWindow(dialog) }} />
    context.addWindow(dialog)
}
