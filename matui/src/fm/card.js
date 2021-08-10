import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'

import ActionMenu from './action_menu'
import { isDir } from '../util'
import { nodeThumb } from '../thumbs'
import { renderProgress } from './progress'

const styles = makeStyles((theme) => ({
	root: {
		position: 'relative',
		boxSizing: 'border-box',
		justifyContent: 'space-between',
		display: 'flex',
		flexDirection: 'column',
		width: '100%'
	},
	thumb: {
		width: '100%',
		height: '100%',
		boxSizing: 'border-box',
		display: 'block',
		objectFit: 'contain',  // contain forces own aspect
		objectPosition: '50% 50%'
	},
	stdThumb: {
		borderWidth: '2pt',
		borderStyle: 'solid',
		borderColor: theme.palette.primary.light,
		borderRadius: '5%',
		padding: '8%',
	},
	dirThumb: {
		borderWidth: '2pt',
		borderStyle: 'solid',
		borderColor: theme.palette.primary.light,
		borderRadius: '5%',
		borderStyle: 'dashed',
		padding: '8%'
	},
	customThumb: {
		borderWidth: '2pt',
		borderStyle: 'solid',
		borderColor: theme.palette.primary.light,
		borderRadius: '5%'
	},
	action: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	title: {
		padding: '0.2em 0.3em 0 0.5em',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis'
	},
	progress: {
		position: 'absolute',
		top: '2em',
		right: '2em',
		border: '1px solid #333',
		background: 'rgb(0, 0, 0, 0.5)',
		padding: '1px 2px 0 4px',
		zIndex: 5
	},
}))

/**
 * NodeCard is the card for one filesystem node.
 * 
 * @param {Node} props.node - the node to display the dialog on
 * @param {bool} props.preview - show media preview or not
 * @param {int} props.zoom - current zoom level.
 * @param {function} props.onOpen - called when an node should be opened
 * @param {function} props.onAction - callled with (action, node, ...args) for an action on the node
 * @param {string} props.authToken - JWT authentication token
 * @param {Object} props.settings - user's settings
 * @param {WindowManager} props.wm - the window manager
 */
export default function NodeCard(props) {
	const classes = styles()

	var thumb_classes = classes.thumb
	if (isDir(props.node.mime_type))
		thumb_classes += ' ' + classes.dirThumb
	else if (props.node.has_custom_thumb)
		thumb_classes += ' ' + classes.customThumb
	else
		thumb_classes += ' ' + classes.stdThumb

	return (
		<div
			className={classes.root} style={{ maxHeight: (30 * props.zoom) + "vh" }}>

			<img
				className={thumb_classes}
				src={nodeThumb(props.node, props.preview)}
				onDragStart={(ev) => { ev.preventDefault() }}
				onClick={() => { props.onOpen(props.node) }} />

			<div className={classes.action}>
				<Typography
					variant="subtitle2"
					className={classes.title}
					onClick={() => { props.onOpen(props.node) }}>
					{props.node.name}
				</Typography>
				<div className={classes.actionMenu}>
					<ActionMenu
						node={props.node}
						authToken={props.authToken}
						onOpen={props.onOpen}
						onAction={props.onAction}
						commands={(props.settings && props.settings.NamedCommands) ? props.settings.NamedCommands : []}
						wm={props.wm} />
				</div>
			</div>

			{(props.node.progress && props.node.length) ?
				<div className={classes.progress}>
					{renderProgress(props.node)}
				</div> : null}
		</div >)
}
