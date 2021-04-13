import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { nodeURL } from '../util'

const styles = makeStyles({
	root: {
		position: 'fixed',
		left: 0,
		top: 0,
		height: '100%'
	},
	image: {
		objectFit: 'contain',

		// For centering content
		objectPosition: '50% 50%',
		height: '100%',
	}
})

/**
 * ImageView shows an image node.
 * 
 * @param {Node} props.node - the node to view
 */
export default function ImageView(props) {
	const classes = styles()

	return (
		<div className={classes.root}>
			<img
				onContextMenu={(ev) => { ev.preventDefault(); return false }}
				onDragStart={(ev) => { ev.preventDefault(); return false }}

				className={classes.image}
				src={nodeURL(props.node)} />
		</div>)
}
