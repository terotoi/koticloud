import React from 'react'
import { nodeURL } from '../util'
import { openErrorDialog } from '../dialogs/error'
import api from '../api'

import MUIRichTextEditor from 'mui-rte'
import { ContentState, convertFromHTML, convertToRaw } from 'draft-js'

/**
 * TextEdit shows a text editor for nodes with textual content.
 * 
 * @param {Node} props.node - the node to edit
 * @param {function(Node)} props.onSave - called when the text has been saved to a
 * 			file node, either a new one or existing
 * @param {string} props.authToken - JWT authentication token
 * @param {Context} props.context
 */
export default function TextEdit(props) {
	const [initial, setInitial] = React.useState(null)
	const [editorState, setEditorState] = React.useState(null)
	const ctx = props.context

	function save(d) {

		const uploader = new api.Uploader({
			url: "/node/update",
			authToken: props.authToken,
			done: (node) => {
				console.log("File saved")
				if (props.onSave)
					props.onSave(node)
			},
			error: (err) => {
				console.log(err)
				openErrorDialog(ctx, "Error saving file " + props.node.name)
			}
		})

		const text = editorState.getCurrentContent().getPlainText()
		uploader.upload(new Blob([text], { type: 'text/plain' }),
			{ nodeID: props.node.id })
	}

	// Rudimentary convert from raw text
	function fromText(text) {
		return text.replace(/(\r\n|\r|\n)/gm, "<br>")
	}

	React.useEffect(() => {
		if (initial === null)
			api.fetchData(nodeURL(props.node), 'get', 'text', null, props.authToken,
				(text) => {
					const html = fromText(text)
					const chtml = convertFromHTML(html)
					const state = ContentState.createFromBlockArray(chtml.contentBlocks,
						chtml.entityMap)
					const content = JSON.stringify(convertToRaw(state))
					setInitial(content)
				},
				(error) => { openErrorDialog(ctx, error) })
	}, [props.node])

	function onKeyDown(ev) {
		if (ev.key == 'Tab')
			ev.preventDefault()
	}

	return (
		(initial === null) ? null :
			<div onKeyDown={onKeyDown}>
				<MUIRichTextEditor
					label="Type here..."
					defaultValue={initial}
					inlineToolbar={true}
					editorState={"hello"}
					onChange={(state) => setEditorState(state)}
					onSave={save} />
			</div >)
}
