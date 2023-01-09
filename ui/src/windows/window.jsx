/**
 * window.jsx - The Window class
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React from 'react'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import ControlCameraIcon from '@mui/icons-material/ControlCamera'
import MaximizeIcon from '@mui/icons-material/Maximize'
import { Box } from '@mui/material'

const sxs = {
	titleBar: {
		height: '2em',
		backgroundColor: 'brand.main',
		fontSize: '120%',
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'none',
		justifyContent: 'flex-start',
		alignItems: 'center',
		paddingTop: 1,
	},
	statusBar: {
		marginTop: 'auto',
		minHeight: '1em',
		maxHeight: '2em',
		backgroundColor: 'brand.main',
		fontSize: '120%',
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'none',
		justifyContent: 'flex-start',
		alignContent: 'center'
	},
	titleText: {
		flexGrow: 1,
		flexShrink: 0,
		marginLeft: 1,
		color: 'text.main'
	},
	borderIcon: {
		flexGrow: 0,
		color: 'primary.dark'
	},
	content: {
		display: 'flex',
		position: 'static',
		flexGrow: 1,
		flexDirection: 'column',
		overflow: 'auto'
	}
};

/**
 * Window is a draggable container.
 * 
 * @param {Object} wnd - the window object
 * @param {[...Object]} props.children - child components to render
 * @param {int} zIndex - current z-depth of the window
 * @param {[number, number]} pos - position of the window in pixels
 * @param {[number, number]} size - size of the window in pixels
 * @param {function} props.onMouseDown - called when window is pressed on the window
 *                                       decorations
 * @param {function} props.onClose - called when window is closed
 * @param {function} props.onMinimized - called when window is minimized
 * @param {function} props.onMaximized - called when window is maximized
 */
export default function Window(props) {
	function onMouseDown(ev, action) {
		ev.stopPropagation()

		if (action !== null && ev.type !== 'touchstart')
			ev.preventDefault()
		props.onMouseDown(ev, props.wnd, action)
	}

	const renderTitleBar = () => {
		return (
			<Box
				component="div"
				sx={sxs.titleBar}
				onMouseDown={(ev) => { onMouseDown(ev, 'move') }}
				onTouchStart={(ev) => { onMouseDown(ev, 'move') }}>

				<IconButton sx={{
					flexGrow: 0,
					color: 'primary.dark',
					marginBottom: '4px'
				}}
					onClick={(ev) => {
						props.onClose(ev, props.wnd)
					}}><CloseIcon />
				</IconButton>

				<Box
					component="span"
					sx={sxs.titleText}>{props.wnd.title || ""}</Box>

				<IconButton sx={sxs.borderIcon}
					onClick={(ev) => { props.onMaximize(ev, props.wnd) }}>
					<MaximizeIcon />
				</IconButton>
			</Box>)
	}

	const renderStatusBar = () => {
		return (
			<Box
				component="div"
				sx={sxs.statusBar}
				onMouseDown={(ev) => { onMouseDown(ev, 'move') }}
				onTouchStart={(ev) => { onMouseDown(ev, 'move') }}>

				<Box component="span" sx={sxs.titleText} />
				<Button sx={sxs.borderIcon}
					onMouseDown={(ev) => { onMouseDown(ev, 'resize') }}
					onTouchStart={(ev) => { onMouseDown(ev, 'resize') }}>
					<ControlCameraIcon />
				</Button>
			</Box >)
	}

	return (
		<Box
			component="div"
			sx={{
				position: 'absolute',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'flex-start',
				minWidth: '16rem',
				minHeight: '10rem',
				backgroundColor: 'background.default',
				border: '1px solid ' + 'primary.main',
				overflow: 'hidden',
				zIndex: props.zIndex,
				left: props.wnd.maximized ? "0px" : props.wnd.pos[0] + "px",
				top: props.wnd.maximized ? "0px" : props.wnd.pos[1] + "px",
				width: props.wnd.maximized ? "100%" : (props.wnd.size[0] + "px"),
				height: props.wnd.maximized ? "100%" : (props.wnd.size[1] + "px")
			}}
			datawindowid={props.wnd.id}
			onMouseDown={(ev) => {
				onMouseDown(ev, ev.shiftKey ? 'move' : null)
			}}>

			{renderTitleBar()}

			<div style={sxs.content}>
				{React.cloneElement(props.children, { wnd: props.wnd })}
			</div>

			{renderStatusBar()}
		</Box>)
}
