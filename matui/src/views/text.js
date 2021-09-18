import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { ContentState, convertFromHTML, convertToRaw } from 'draft-js'
import MUIRichTextEditor from 'mui-rte'
import { nodeURL } from '../util'
import { openErrorDialog } from '../dialogs/error'
import { NodeNavigationToolbar } from './nav'
import api from '../api'


const styles = makeStyles((theme) => ({
	root: {
		flexGrow: 1,
		display: 'flex',
		flexDirection: 'column',
		height: '100%'
	},
	editor: {
	}
}))

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
	const [initial, setInitial] = React.useState(null)
	const [editorState, setEditorState] = React.useState(null)
	const classes = styles()

	function save(d) {

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
			api.fetchData(nodeURL(props.node), 'get', 'text', null, props.ctx.authToken,
				(text) => {
					const html = fromText(text)
					const chtml = convertFromHTML(html)
					const state = ContentState.createFromBlockArray(chtml.contentBlocks,
						chtml.entityMap)
					const content = JSON.stringify(convertToRaw(state))
					setInitial(content)
				},
				(error) => { openErrorDialog(props.wm, error) })
	}, [props.node])

	function onKeyDown(ev) {
		if (ev.key == 'Tab')
			ev.preventDefault()
	}

	return (
		(initial === null) ? null :
			<div onKeyDown={onKeyDown} className={classes.root}>
				<NodeNavigationToolbar
					node={props.node}
					onNextNode={props.onNextNode}
					onPrevNode={props.onPrevNode}
					ctx={props.ctx} />

				<MUIRichTextEditor
					label="Type here..."
					defaultValue={initial}
					inlineToolbar={true}
					editorState={"hello"}
					onChange={(state) => setEditorState(state)}
					onSave={save} />
			</div >)
}
