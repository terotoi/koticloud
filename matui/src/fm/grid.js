import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import NodeCard from './card'

export const zooms = [
	'list',
	{ xl: 1, lg: 1, md: 3, sm: 4, xs: 6 },
	{ xl: 2, lg: 2, md: 4, sm: 6, xs: 12 },
	{ xl: 3, lg: 3, md: 6, sm: 12, xs: 12 }
]

const styles = makeStyles((theme) => ({
	grid: {
		display: 'flex'
	}
}))

/**
 * NodeGrid displays directory nodes in either a grid.
 * 
 * @param {[...Node]} nodes - list of nodes to display
 * @param {bool} props.previews - show media previews or not
 * @param {int} props.zoom - current zoom level.
 * @param {function} props.onNodeOpen - called when an node should be opened
 * @param {function} props.onNodeAction - callled with (action, node, ...args) for an action on the node
 * @param {string} props.authToken - JWT authentication token
 */
export function NodeGrid(props) {
	const classes = styles()

	let nodes = []
	for (const node of props.nodes) {
		nodes.push(
			<Grid item
				className={classes.grid}
				key={node.id}
				xl={zooms[props.zoom].xl}
				lg={zooms[props.zoom].lg}
				md={zooms[props.zoom].md}
				sm={zooms[props.zoom].sm}
				xs={zooms[props.zoom].xs}>
				<NodeCard
					node={node}
					preview={props.previews}
					onOpen={props.onNodeOpen}
					onAction={props.onNodeAction}
					authToken={props.authToken}
					zoom={props.zoom} />
			</Grid>)
	}

	return (
		<div>
			<Grid container spacing={2}>
				{nodes}
			</Grid>
		</div>
	)
}