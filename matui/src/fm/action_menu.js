import React from 'react'
import IconButton from '@material-ui/core/IconButton'
import Link from '@material-ui/core/Link'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import MoreVertIcon from '@material-ui/icons/MoreVert'

import { openAlertDialog } from '../dialogs/alert'
import { openErrorDialog } from '../dialogs/error'
import { isDir, isPlayable, nodeURL } from '../util'
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
			key="OpenTab"
			onClick={() => {
				close()
				window.open("/?id=" + props.node.id, '_blank')
			}}>Open in a browser window
		</MenuItem>)

		items.push(<MenuItem
			key="Open"
			onClick={() => {
				close()
				props.onOpen(props.node)
			}}>
			Open
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

		if (isPlayable(props.node.mime_type)) {
			if (props.node.MetaData === null || props.node.MetaData.Progress < props.node.length) {
				items.push(
					<MenuItem
						key="mark_viewed"
						onClick={() => {
							close()
							props.onAction('mark_viewed', props.node)
						}}>
						Mark viewed
					</MenuItem>)
			}

			if (props.node.MetaData === null || props.node.MetaData.Progress > 0) {
				items.push(
					<MenuItem
						key="mark_notviewed"
						onClick={() => {
							close()
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
						//props.onAction('delete', props.node)
					}}>
					<Link href={nodeURL(props.node)} color="inherit"
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
