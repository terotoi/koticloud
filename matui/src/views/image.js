import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Box from '@material-ui/core/Box'
import GetAppIcon from '@material-ui/icons/GetApp'
import IconButton from '@material-ui/core/IconButton'
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious'
import SkipNextIcon from '@material-ui/icons/SkipNext'

import { nodeURL } from '../util'

const styles = makeStyles({
	root: {
		display: 'flex',
		flexDirection: 'column',
		maxWidth: '100%',
		maxHeight: '100%'
	},
	image: {
		objectFit: 'contain',
		objectPosition: '0% 0%',
		maxWidth: '100%',
		height: '100%'
	}
})

/**
 * ImageView shows an image node.
 * 
 * @param {Node} props.node - the node to view
 * @param {function} props.onNextNode - called when the user skipped to the next node
 * @param {function} props.onPrevNode - called when the user skipped to the previous node
 * @param {Window} wnd - window object containing the view
 * @param {Object} context - the window manager
 */
export default function ImageView(props) {
	const classes = styles()

	const onLoaded = (ev) => {
		props.context.resizeWindow(props.wnd,
			[ev.target.naturalWidth, ev.target.naturalHeight],
			true)
	}

	return (
		<div className={classes.root}>
			<Box
				flexDirection="row"
				alignItems="center"
				className={classes.controls}>
				<IconButton onClick={props.onPrevNode}><SkipPreviousIcon /></IconButton>
				<IconButton onClick={props.onNextNode}><SkipNextIcon /></IconButton>
				<IconButton href={nodeURL(props.node)} download={props.node.name}><GetAppIcon /></IconButton>
			</Box >

			<img
				className={classes.image}
				onLoad={onLoaded}
				onContextMenu={(ev) => { ev.preventDefault(); return false }}
				onDragStart={(ev) => { ev.preventDefault(); return false }}
				src={nodeURL(props.node)} />
		</div>)
}
