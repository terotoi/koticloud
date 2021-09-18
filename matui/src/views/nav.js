import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import GetAppIcon from '@material-ui/icons/GetApp'
import IconButton from '@material-ui/core/IconButton'
import ArrowBackIcon from '@material-ui/icons/ArrowBack'
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious'
import SkipNextIcon from '@material-ui/icons/SkipNext'
import { nodeURL } from '../util'

const styles = makeStyles({
	controls: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'start',
		alignItems: 'center'
	}
})

/**
 * NodeNavigationToolbar renders a generic back/next/previous/download content toolbar for nodes.
 * 
 * @param {Node} props.node - the node to view
 * @param {function} props.onNextNode - called when the user skipped to the next node
 * @param {function} props.onPrevNode - called when the user skipped to the previous node
 * @param {state} props.ctx - app context
 */
export function NodeNavigationToolbar(props) {
	const classes = styles()

	return (
		<div className={classes.controls}>
			<IconButton onClick={() => { props.ctx.up(props.node) }}><ArrowBackIcon /></IconButton>
			<IconButton onClick={props.onPrevNode}><SkipPreviousIcon /></IconButton>
			<IconButton onClick={props.onNextNode}><SkipNextIcon /></IconButton>
			<IconButton href={nodeURL(props.node)} download={props.node.name}><GetAppIcon /></IconButton>
		</div>)
}
