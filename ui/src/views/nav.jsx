import React from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import ArrowUpIcon from '@mui/icons-material/ArrowUpward'
import GetAppIcon from '@mui/icons-material/GetApp'
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import { nodeURL } from '../util'

/**
 * NodeNavigationToolbar renders a generic back/next/previous/download content toolbar for nodes.
 * 
 * @param {Node} props.node - the node to view
 * @param {function} props.onNextNode - called when the user skipped to the next node
 * @param {function} props.onPrevNode - called when the user skipped to the previous node
 * @param {state} props.ctx - app context
 */
export function NodeNavigationToolbar(props) {
	return (
		<Box display="flex" flexDirection="row" justifyContent="start" alignItems="center">
			<IconButton color="primary" disabled={props.node.parent_id === null}
				onClick={() => { props.ctx.openNodeId(props.node.parent_id) }}><ArrowUpIcon /></IconButton>
			<IconButton color="primary" onClick={props.onPrevNode}><SkipPreviousIcon /></IconButton>
			<IconButton color="primary" onClick={props.onNextNode}><SkipNextIcon /></IconButton>
			<IconButton color="primary" href={nodeURL(props.node)} download={props.node.name}><GetAppIcon /></IconButton>
		</Box>)
}
