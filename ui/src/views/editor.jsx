/**
 * editor.jsx - a text editor
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import SaveIcon from '@mui/icons-material/Save';
import ContentEditable from 'react-contenteditable'
import { nodeURL } from '../util'
import { openErrorDialog } from '../dialogs/error'
import { NodeNavigationToolbar } from './nav'
import api from '../api'

const sxs = {
	editable: {
		borderWidth: 1,
		borderStyle: 'dashed',
		borderColor: 'primary.main',
		padding: 2,
		minHeight: '5rem',
		minWidth: '100%'
	}
};
	
/**
 * EditorToolBar
 * 
 * @param {function} props.onSave - called when user clicks the save button
 */
function EditorToolBar(props) {
	return (
		<Box display="flex" flexDirection="row">
			<Tooltip title="Save"><IconButton color="primary" onClick={props.onSave}><SaveIcon /></IconButton></Tooltip>
		</Box>)
}

/**
 * TextEdit shows a text editor for nodes with textual content.
 * 
 * @param {Node} props.node - the node to edit
 * @param {function(Node)} props.onSave - called when the text has been saved to a
 * 			file node, either a new one or existing
 * @param {state} props.ctx
 * @param {WindowManager} props.wm - the window manager
 */
export default function TextEdit(props) {
	const [content, setContent] = React.useState('')
	const contentEditable = React.useRef(null)

	function toHTML(text) {
		return text.replaceAll("\n", "<br>")
	}

	function save() {
		const uploader = new api.Uploader({
			url: "/node/update",
			authToken: props.ctx.authToken,
			done: (node) => {
				console.log("File saved")
				if (props.onSave)
					props.onSave(node)
			},
			error: (err) => {
				console.log(err)
				openErrorDialog(props.wm, "Error saving file " + props.node.name)
			}
		})

		uploader.upload(new Blob([content], { type: 'text/plain' }),
			{ nodeID: props.node.id })
	}

	React.useEffect(() => {
		api.fetchData(nodeURL(props.node), 'get', 'text', null, props.ctx.authToken,
			(data) => {
				const c = toHTML(data)
				setContent(toHTML(data))
			},
			(error) => { openErrorDialog(props.wm, error) })
	}, [props.node])

	function onKeyDown(ev) {
		if (ev.key == 'Tab')
			ev.preventDefault()
	}

	function contentChanged(ev) {
		setContent(ev.target.value)
	}

	return (
		<Box onKeyDown={onKeyDown} sx={{ m: 2 }}>
			<Box display="flex" flexDirection="row">
				<NodeNavigationToolbar
					node={props.node}
					onNextNode={props.onNextNode}
					onPrevNode={props.onPrevNode}
					ctx={props.ctx} />
				<EditorToolBar onSave={save} />
			</Box>

			<Box display="flex" sx={{ m: 2 }}>
				<ContentEditable innerRef={contentEditable} html={content} disabled={false}
					onChange={contentChanged} tagName='div' sx={sxs.editable}/>
			</Box>
		</Box>)
}
