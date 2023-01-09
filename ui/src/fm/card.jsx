/**
 * card.jsx - a node card
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React from 'react'
import Typography from '@mui/material/Typography'
import ActionMenu from './action_menu'
import { isDir } from '../util'
import { renderProgress } from './progress'
import { Box } from '@mui/material'

const sxs = {
	thumb: {
		width: '100%',
		height: '100%',
		boxSizing: 'border-box',
		display: 'block',
		objectFit: 'contain',  // contain forces own aspect
		objectPosition: '50% 50%',
		borderColor: 'secondary.main',
		borderWidth: '2pt',
		padding: '2%',
		borderRadius: '5%'
	},
	dirWithCustomThumb: {
		borderStyle: 'dashed'
	},
	fileWithCustomThumb: {
		borderStyle: 'solid'
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
};

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
	const thumb = Object.assign({}, sxs.thumb)

	if (isDir(props.node.mime_type))
		Object.assign(thumb, sxs.dirWithCustomThumb)
	else if (!isDir(props.node.mime_type) && props.node.has_custom_thumb)
		Object.assign(thumb, sxs.fileWithCustomThumb)

	return (
		<Box
			component="div"
			sx={{
				position: 'relative',
				boxSizing: 'border-box',
				justifyContent: 'space-between',
				display: 'flex',
				flexDirection: 'column',
				width: '100%',
				maxHeight: (30 * props.zoom) + "vh"
			}}>
			<a href={props.node.url}>
				<Box
					component="img"
					sx={thumb}
					src={props.node.thumbURL(props.preview)}
					onDragStart={(ev) => { ev.preventDefault() }}
					onClick={(ev) => { props.onOpen(props.node); ev.preventDefault() }} /></a>

			<div style={{
				display: 'flex',
				flexDirection: 'row',
				justifyContent: 'space-between',
				alignItems: 'center'
			}}>
				<Typography
					variant="subtitle2"
					sx={sxs.title}
					onClick={() => { props.onOpen(props.node) }}>
					{props.node.name}
				</Typography>
				<ActionMenu
					node={props.node}
					authToken={props.authToken}
					onOpen={props.onOpen}
					onAction={props.onAction}
					commands={(props.settings && props.settings.NamedCommands) ? props.settings.NamedCommands : []}
					wm={props.wm} />
			</div>

			{
				props.node.progress ?
					<Box component="div" sx={sxs.progress}>
						{renderProgress(props.node)}
					</Box> : null
			}
		</Box >)
}
