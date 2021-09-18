import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { NodeNavigationToolbar } from './nav'
import { nodeURL } from '../util'

const styles = makeStyles((theme) => ({
	root: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-between',
		alignItems: 'center',
		height: '100vh'
	},
	toolBar: {
	},
	image: {
		objectFit: 'contain',
		display: 'block',
		minHeight: '32px',
		maxWidth: '100%',
		height: '100%'
	}
}))

/**
 * ImageView shows an image node.
 * 
 * @param {Node} props.node - the node to view
 * @param {function} props.onNextNode - called when the user skipped to the next node
 * @param {function} props.onPrevNode - called when the user skipped to the previous node
 * @param {state} props.ctx - app context
 */
export default function ImageView(props) {
	const classes = styles()

	return (
		<div className={classes.root}>
			<img
				className={classes.image}
				onDragStart={(ev) => { ev.preventDefault(); return false }}
				src={nodeURL(props.node)} />

			<div className={classes.toolBar}>
				<NodeNavigationToolbar
					node={props.node}
					onNextNode={props.onNextNode}
					onPrevNode={props.onPrevNode}
					ctx={props.ctx} />
			</div>
		</div>)
}
