/**
 * progress.jsx - progress text
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React from 'react'
import Typography from '@mui/material/Typography'

/**
 * Render progress text for a node
 * 
 * @param {Object} node - the node to render progress for
 * @returns rendered progress text 
 */
export function renderProgress(node) {
	var progress = node.progress || 0.0

	return (
		<Typography variant="subtitle1">
			{"" + Math.round(progress * 100) + " %"}
		</Typography>)
}
