import React from 'react'
import IconButton from '@material-ui/core/IconButton'
import Link from '@material-ui/core/Link'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import MoreVertIcon from '@material-ui/icons/MoreVert'
import { nodeURL } from '../util'

/**
 * ActionMenu shows the list of actions for a file system node.
 * 
 * @param {Node} props.node - the node to display the dialog on
 * @param {string} props.authToken - JWT authentication token
 * @param {function} props.onOpen - called when an node should be opened
 * @param {function} props.onAction - callled with (action, node, ...args) for an action on the node
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
					id="long-menu"
					anchorEl={anchor}
					keepMounted
					open={open}
					onClose={close}
					PaperProps={{
						style: {
							width: '20ch'
						}
					}}>

					<MenuItem
						key="Open"
						onClick={() => {
							close()
							props.onOpen(props.node)
						}}>
						Open
					</MenuItem>

					<MenuItem
						key="Cut"
						onClick={() => {
							close()
							props.onAction('cut', props.node)
						}}>
						Cut
					</MenuItem>

					<MenuItem
						key="Copy"
						onClick={() => {
							close()
							props.onAction('copy', props.node)
						}}>
						Copy
					</MenuItem>

					<MenuItem
						key="Rename"
						onClick={() => {
							close()
							props.onAction('rename', props.node)
						}}>
						Rename
					</MenuItem>

					{(props.node.length &&
						!(props.node.MetaType === 'progress' && props.node.MetaData.Progress >= props.node.length)) ?
						<MenuItem
							key="mark_viewed"
							onClick={() => {
								close()
								props.onAction('mark_viewed', props.node)
							}}>
							Mark viewed
					</MenuItem> : null}

					{(props.node.length &&
						(props.node.MetaType !== 'progress' || props.node.MetaData.Progress > 0)) ?
						<MenuItem
							key="mark_notviewed"
							onClick={() => {
								close()
								props.onAction('mark_notviewed', props.node)
							}}>
							Mark not viewed
					</MenuItem> : null}

					{(props.node.type !== 'directory') ?
						<MenuItem
							key="Download"
							onClick={() => {
								close()
								//props.onAction('delete', props.node)
							}}>
							<Link href={nodeURL(props.node)} color="inherit"
								download={props.node.name}>Download</Link>
						</MenuItem> : null}

					<MenuItem
						key="Delete"
						onClick={() => {
							close()
							props.onAction('delete', props.node)
						}}>
						Delete
					</MenuItem>
				</Menu>}
		</div >)
}
