/**
 * new_file.jsx - new file dialog
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'

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
                    sx={{ mt: 2, mb: 2 }}
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={fileType}
                    onChange={(ev) => { setFileType(ev.target.value) }}>
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
                    onKeyDown={(ev) => { if (ev.key == 'Enter') handleConfirm() }}
                    onChange={(ev) => { setFilename(ev.target.value) }} />
            </DialogContent >
            <DialogActions>
                <Button onClick={props.onClose}>Cancel</Button>
                <Button onClick={handleConfirm}>Create</Button>
            </DialogActions>
        </Dialog >)
}

/**
 * Creates an NewFileDialog and adds it to the window manager
 * using wm.addDialog(dialog)
 * 
 * @param {WindowManager} wm - the window manager
 * @param {function} props.onConfirm - called on dialog confirmation
 */
export function openNewFileDialog(wm, props) {
    const dialog =
        <NewFileDialog
            onConfirm={props.onConfirm}
            onClose={() => { wm.removeDialog(dialog) }} />
    wm.addDialog(dialog)
}
