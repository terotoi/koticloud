import React from 'react'
import ActionMenu from './action_menu'
import { makeStyles } from '@material-ui/core/styles'
import { isDir } from '../util'
import { nodeThumb } from '../thumbs'
import { renderProgress } from './progress'

import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'

const styles = makeStyles((theme) => ({
	thumb: {
		width: '70pt',
		height: '40pt',
		objectFit: 'contain',
		borderWidth: '2pt',
		borderColor: theme.palette.primary.main,
		borderRadius: '5%'
	},
	customThumb: {
		borderStyle: 'solid',
	},
	dirThumb: {
		borderStyle: 'dashed',
		borderColor: theme.palette.primary.main
	},
	filename: {
		marginLeft: theme.spacing(2),
		width: '50%'
	},
	iconCell: {
		width: '80pt',
		padding: theme.spacing(1)
	},
	progressCell: {
		width: '5em',
		padding: theme.spacing(1)
	},
	sizeCell: {
		width: '15em',
		padding: theme.spacing(1)
	},
	modifiedCell: {
		width: '10em',
		padding: theme.spacing(1)
	},
	actionCell: {
		width: '10em',
		padding: theme.spacing(1)
	}
}))

/**
 * NodeList displays directory nodes in a list.
 * 
 * @param {[...Node]} nodes - list of nodes to display
 * @param {bool} props.previews - show media previews or not
 * @param {function} props.onNodeOpen - called when an node should be opened
 * @param {function} props.onNodeAction - callled with (action, node, ...args) for an action on the node
 * @param {string} props.authToken - JWT authentication token
 * @param {Object} props.settings - user's settings
 * @param {Object} props.context
 */
export default function NodeList(props) {
	const classes = styles()

	return (
		<Table aria-label="simple table">
			<TableHead>
				<TableRow>
					<TableCell align="center" className={classes.iconCell}>Icon</TableCell>
					<TableCell>Filename</TableCell>
					<TableCell align="right" className={classes.sizeCell}>Progress</TableCell>
					<TableCell align="right" className={classes.sizeCell}>Size</TableCell>
					<TableCell align="center" className={classes.sizeCell}>Modified</TableCell>
					<TableCell align="center" className={classes.actionCell}>Action</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{Array.from(props.nodes).map((node) => {
					var thumb_classes = classes.thumb
					if (isDir(node.mime_type))
						thumb_classes += ' ' + classes.dirThumb
					else if (node.has_custom_thumb)
						thumb_classes += ' ' + classes.customThumb

					const modified_on = new Date(node.modified_on)

					return (
						<TableRow key={node.id}>
							<TableCell className={classes.iconCell} align="center">
								<img
									className={thumb_classes}
									src={nodeThumb(node, props.previews)}
									onClick={() => { props.onNodeOpen(node) }} />
							</TableCell>
							<TableCell component="th" scope="row" onClick={() => { props.onNodeOpen(node) }}>
								{node.name}
							</TableCell>
							<TableCell align="right" className={classes.progressCell}>{(node.length !== null) ? renderProgress(node) : null}</TableCell>
							<TableCell align="right" className={classes.sizeCell}>{node.size}</TableCell>
							<TableCell align="center" className={classes.modifiedCell}>
								{modified_on.toLocaleDateString() + " " + modified_on.toLocaleTimeString()}</TableCell>
							<TableCell align="center" className={classes.actionCell}>
								<ActionMenu
									node={node}
									authToken={props.authToken}
									onOpen={props.onNodeOpen}
									onAction={props.onNodeAction}
									commands={(props.settings && props.settings.NamedCommands) ? props.settings.NamedCommands : []}
									context={props.context} />
							</TableCell>
						</TableRow>)
				})}
			</TableBody>
		</Table >)
}
