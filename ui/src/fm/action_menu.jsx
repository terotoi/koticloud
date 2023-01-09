/**
 * action_menu.jsx - action menu for a node
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React from 'react'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { openAlertDialog } from '../dialogs/alert'
import { openErrorDialog } from '../dialogs/error'
import { isMedia, nodeURL } from '../util'
import api from '../api'

/**
 * ActionMenu shows the list of actions for a file system node.
 * 
 * @param {Node} props.node - the node to display the dialog on
 * @param {string} props.authToken - JWT authentication token
 * @param {function} props.onOpen - called when an node should be opened
 * @param {function} props.onAction - callled with (action, node, ...args) for an action on the node
 * @param {[]Object} props.commands - list of external commands
 * @param {WindowManager} props.wm - the window manager
 */
export default function ActionMenu(props) {
	const [anchor, setAnchor] = React.useState(null)
	const open = Boolean(anchor)

	const handleClick = (event) => {
		setAnchor(event.currentTarget)
	}

	const close = () => {
		setAnchor(null)
	}

	function renderItems() {
		let items = []

		items.push(<MenuItem
			key="Open"
			onClick={() => {
				close()
				props.onOpen(props.node)
			}}>
			Open
		</MenuItem>)

		items.push(<MenuItem
			key="OpenTab"
			onClick={() => {
				close()
				window.open("/id/" + props.node.id, '_blank')
			}}>Open in a new window
		</MenuItem>)

		items.push(<MenuItem
			key="Cut"
			onClick={() => {
				close()
				props.onAction('cut', props.node)
			}}>
			Cut
		</MenuItem>)

		items.push(
			<MenuItem
				key="Copy"
				onClick={() => {
					close()
					props.onAction('copy', props.node)
				}}>
				Copy
			</MenuItem>)

		items.push(
			<MenuItem
				key="Rename"
				onClick={() => {
					close()
					props.onAction('rename', props.node)
				}}>
				Rename
			</MenuItem>)

		items.push(
			<MenuItem
				key="Delete"
				onClick={() => {
					close()
					props.onAction('delete', props.node)
				}}>
				Delete
			</MenuItem>)

		if (isMedia(props.node.mime_type)) {
			if (props.node.progress === null || props.node.progress < 1.0) {
				items.push(
					<MenuItem
						key="mark_viewed"
						onClick={() => {
							close()
							props.node.progress = 1.0
							props.onAction('mark_viewed', props.node)
						}}>
						Mark viewed
					</MenuItem>)
			}

			if (props.node.progress !== null && props.node.progress > 0) {
				items.push(
					<MenuItem
						key="mark_notviewed"
						onClick={() => {
							close()
							props.node.progress = 0.0
							props.onAction('mark_notviewed', props.node)
						}}>
						Mark not viewed
					</MenuItem>)
			}
		}

		if (props.node.type !== 'directory') {
			items.push(
				<MenuItem
					key="Download"
					onClick={() => {
						close()
					}}>
					<Link href={nodeURL(props.node)} color="inherit" underline="none"
						download={props.node.name}>Download</Link>
				</MenuItem>)
		}

		// Build named commands
		let cmds = props.commands.map((cmd) =>
			(cmd.ContentTypes.indexOf(props.node.mime_type) !== -1) ?
				<MenuItem key={cmd.ID}
					onClick={() => {
						close()
						api.runNamedCommand(cmd, props.node, props.authToken,
							(msg) => {
								openAlertDialog(props.wm, {
									text: msg || "Command executed successfully.",
									configText: "Okay"
								})
							},
							(error) => openErrorDialog(props.wm, "Failed to execute the command"))
					}}>
					{cmd.Entry}
				</MenuItem> : null)

		return [...items, ...cmds.filter((m) => m !== null)]
	}

	return (
		<div>
			<IconButton
				aria-label="more"
				aria-controls="long-menu"
				aria-haspopup="true"
				color="primary"
				onClick={handleClick}>
				<MoreVertIcon />
			</IconButton>
			{!open ? null :
				<Menu
					id="action-menu"
					anchorEl={anchor}
					keepMounted
					open={open}
					onClose={close}
					PaperProps={{
						style: {
							width: '30ch'
						}
					}}>
					{renderItems()}
				</Menu>}
		</div >)
}
