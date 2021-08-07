import React from 'react'
import Typography from '@material-ui/core/Typography'

export function renderProgress(node) {
	const length = node.length
	if (node.progress !== null) {
		var progress = node.progress
		if (progress / length > 0.99)
			progress = length

		return (
			<Typography variant="subtitle1">
				{"" + Math.round(progress / length * 100) + " %"}
			</Typography>)
	}
	return null
}
