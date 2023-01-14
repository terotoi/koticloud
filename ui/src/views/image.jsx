/**
 * image.jsx - an image viewer
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React, { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import { NodeNavigationToolbar } from './nav'
import { nodeURL } from '../util'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'

// Number of ms before controls are hidden.
const hoverOutDelay = 1500

/**
 * ImageView shows an image node.
 * 
 * @param {Node} props.node - the node to view
 * @param {function} props.onNextNode - called when the user skipped to the next node
 * @param {function} props.onPrevNode - called when the user skipped to the previous node
 * @param {function} props.onAction - callled with (action, node, ...args) for an action on the node
 * @param {state} props.ctx - app context
 */
export default function ImageView(props) {
	const root = useRef(null)
	const [hover, setHover] = useState(true)
	const hoverTimeout = useRef(null)

	const onKeyDown = (ev) => {
		switch (ev.key) {
			case 'ArrowLeft':
				props.onPrevNode()
				break

			case ' ':
			case 'ArrowRight':
				props.onNextNode()
				break
			case 'Backspace':
				props.ctx.openNodeId(props.node.parent_id)
				break
			case 'Delete':
				props.onAction('delete', props.node)
				break
		}
	}

	useEffect(() => {
		root.current.focus()

		return () => {
			if (hoverTimeout.current !== null)
				clearTimeout(hoverTimeout.current)
		}
	}, [])

	function clearHoverTimeout() {
		if (hoverTimeout.current !== null) {
			clearTimeout(hoverTimeout.current)
			hoverTimeout.current = null
		}
	}

	const onMouseMove = (ev) => {
		//const brect = ev.target.getBoundingClientRect()
		const h = ev.clientY > window.innerHeight * 0.8

		if (h) {
			clearHoverTimeout()
			setHover(true)
		} else if (hover) {
			clearHoverTimeout()
			hoverTimeout.current = setTimeout(() => { setHover(false) }, hoverOutDelay)
		}
	}

	return (
		<Box ref={root} tabIndex="0" onKeyDown={onKeyDown} onMouseMove={onMouseMove}
			display='flex' flexDirection="column" justifyContent="space-between"
			alignItems="center"
			sx={{
				position: 'absolute',
				top: 0,
				width: '100%',
				height: '100%',
				backgroundColor: 'background'
			}}>
			<img
				style={{
					objectFit: 'contain',
					maxWidth: '100%',
					height: '100%'
				}}
				onDragStart={(ev) => { ev.preventDefault(); return false }}
				src={nodeURL(props.node)} />

			<Box display={hover ? 'flex' : 'none'} flexDirection="row" flexWrap="none"
				sx={{
					zIndex: 1,
					position: 'absolute',
					bottom: '0',
					backgroundColor: 'background.default'
				}}>
				<NodeNavigationToolbar
					node={props.node}
					onNextNode={props.onNextNode}
					onPrevNode={props.onPrevNode}
					ctx={props.ctx} />
				<IconButton color="primary" onClick={() => { props.onAction('delete', props.node) }}><DeleteIcon /></IconButton>
			</Box>
		</Box >)
}
