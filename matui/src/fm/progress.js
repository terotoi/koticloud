import React from 'react'
import Typography from '@material-ui/core/Typography'

export function renderProgress(node) {
	const length = node.length
	var progress = 0.0
	if (node.MetaType == "progress") {
		progress = node.MetaData.Progress
		if (progress / length > 0.99)
			progress = length
	}

	return (
		<Typography variant="subtitle1">
			{"" + Math.round(progress / length * 100) + " %"}
		</Typography>)
}
