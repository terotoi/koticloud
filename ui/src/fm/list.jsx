/**
 * list.jsx - directory list view
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React from 'react'
import ActionMenu from './action_menu'
import { isDir } from '../util'
import { renderProgress } from './progress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { Box } from '@mui/material'

const sxs = {
	thumb: {
		width: '70pt',
		height: '40pt',
		objectFit: 'contain',
		borderWidth: '2pt',
		borderColor: 'primary.main',
		borderRadius: '5%'
	},
	customThumb: {
		borderStyle: 'solid',
	},
	dirThumb: {
		borderStyle: 'dashed',
		borderColor: 'primary.main',
	},
	iconCell: {
		width: '80pt',
		padding: 1,
	},
	progressCell: {
		width: '5em',
		padding: 1,
	},
	sizeCell: {
		width: '15em',
		padding: 1,
	},
	modifiedCell: {
		width: '10em',
		padding: 1,
	},
	actionCell: {
		width: '10em',
		padding: 1
	}
};

/**
 * NodeList displays directory nodes in a list.
 * 
 * @param {[...Node]} nodes - list of nodes to display
 * @param {bool} props.previews - show media previews or not
 * @param {function} props.onNodeOpen - called when an node should be opened
 * @param {function} props.onAction - callled with (action, node, ...args) for an action on the node
 * @param {string} props.authToken - JWT authentication token
 * @param {Object} props.settings - user's settings
 * @param {WindowManager} props.wm - the window manager
 */
export default function NodeList(props) {
	return (
		<Table aria-label="simple table">
			<TableHead>
				<TableRow>
					<TableCell align="center" sx={sxs.iconCell}>Icon</TableCell>
					<TableCell>Filename</TableCell>
					<TableCell align="right" sx={sxs.sizeCell}>Progress</TableCell>
					<TableCell align="right" sx={sxs.sizeCell}>Size</TableCell>
					<TableCell align="center" sx={sxs.sizeCell}>Modified</TableCell>
					<TableCell align="center" sx={sxs.actionCell}>Action</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{Array.from(props.nodes).map((node) => {
					const thumb = Object.assign({}, sxs.thumb)

					if (isDir(node.mime_type))
						Object.assign(thumb, sxs.dirThumb)
					else if (node.has_custom_thumb)
						Object.assign(thumb, sxs.customThumb)

					const modified_on = new Date(node.modified_on)

					return (
						<TableRow key={node.id}>
							<TableCell sx={sxs.iconCell} align="center">
								<a href={node.url}>
									<Box
										component="img"
										sx={thumb}
										src={node.thumbURL(props.previews)}
										onClick={(ev) => { props.onNodeOpen(node); ev.preventDefault() }} />
								</a>
							</TableCell>
							<TableCell component="th" scope="row" onClick={() => { props.onNodeOpen(node) }}>
								{node.name}
							</TableCell>
							<TableCell align="right" sx={sxs.progressCell}>
								{(node.progress != null) ? renderProgress(node) : null}
							</TableCell>
							<TableCell align="right" sx={sxs.sizeCell}>{node.size}</TableCell>
							<TableCell align="center" sx={sxs.modifiedCell}>
								{modified_on.toLocaleDateString() + " " + modified_on.toLocaleTimeString()}</TableCell>
							<TableCell align="center" sx={sxs.actionCell}>
								<ActionMenu
									node={node}
									authToken={props.authToken}
									onOpen={props.onNodeOpen}
									onAction={props.onAction}
									commands={(props.settings && props.settings.NamedCommands) ? props.settings.NamedCommands : []}
									wm={props.wm} />
							</TableCell>
						</TableRow>)
				})}
			</TableBody>
		</Table >)
}
