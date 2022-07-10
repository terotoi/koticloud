import React from 'react'
import Typography from '@mui/material/Typography'

export function renderProgress(node) {
	const length = node.length
	var progress = node.progress || 0.0

	return (
		<Typography variant="subtitle1">
			{"" + Math.round(progress * 100) + " %"}
		</Typography>)
}
