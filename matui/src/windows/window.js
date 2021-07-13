import React from 'react'
import { makeStyles } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import CloseIcon from '@material-ui/icons/Close'
import ControlCameraIcon from '@material-ui/icons/ControlCamera'
import MinimizeIcon from '@material-ui/icons/Minimize'
import MaximizeIcon from '@material-ui/icons/Maximize'

const styles = makeStyles((theme) => ({
	window: {
		position: 'absolute',
		left: '10%',
		top: '5%',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-start',
		minWidth: '16rem',
		minHeight: '10rem',
		background: theme.palette.background.default,
		border: '1px solid ' + theme.palette.primary.main,
		overflow: 'hidden'
	},

	titleBar: {
		minHeight: '1em',
		maxHeight: '2em',
		backgroundColor: theme.palette.primary.main,
		fontSize: theme.typography.fontSize * 1.2,
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'none',
		justifyContent: 'flex-start',
		alignContent: 'center'
	},

	statusBar: {
		marginTop: 'auto',
		minHeight: '1em',
		maxHeight: '2em',
		backgroundColor: theme.palette.primary.main,
		fontSize: theme.typography.fontSize * 1.2,
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'none',
		justifyContent: 'flex-start',
		alignContent: 'center'
	},

	titleText: {
		flexGrow: 1,
		flexShrink: 0,
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		marginLeft: theme.spacing(1)
	},

	borderIcon: {
		flexGrow: 0,
		flexShrink: 0
	},

	content: {
		display: 'flex',
		position: 'static',
		flexGrow: 1,
		flexDirection: 'column',
		overflow: 'auto'
	}
}))

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
	const classes = styles()

	function onMouseDown(ev, action) {
		ev.stopPropagation()

		if (action !== null && ev.type !== 'touchstart')
			ev.preventDefault()
		props.onMouseDown(ev, props.wnd, action)
	}

	const renderTitleBar = () => {
		return (
			<div className={classes.titleBar}
				onMouseDown={(ev) => { onMouseDown(ev, 'move') }}
				onTouchStart={(ev) => { onMouseDown(ev, 'move') }}>

				<IconButton className={classes.borderIcon}
					onClick={(ev) => {
						props.onClose(ev, props.wnd)
					}}><CloseIcon />
				</IconButton>

				<span className={classes.titleText}>{props.wnd.title || "Unnamed"}</span>

				<IconButton className={classes.borderIcon}
					onClick={(ev) => { props.onMaximize(ev, props.wnd) }}>
					<MaximizeIcon />
				</IconButton>
			</div >)
	}

	const renderStatusBar = () => {
		return (
			<div className={classes.statusBar}
				onMouseDown={(ev) => { onMouseDown(ev, 'move') }}
				onTouchStart={(ev) => { onMouseDown(ev, 'move') }}>

				<span className={classes.titleText}></span>
				<Button className={classes.borderIcon}
					onMouseDown={(ev) => { onMouseDown(ev, 'resize') }}
					onTouchStart={(ev) => { onMouseDown(ev, 'resize') }}>
					<ControlCameraIcon />
				</Button>
			</div >)
	}

	return (
		<div className={classes.window}
			style={{
				zIndex: props.zIndex,
				left: props.wnd.pos[0] + "px",
				top: props.wnd.pos[1] + "px",
				width: props.wnd.size[0] + "px",
				height: props.wnd.size[1] + "px"
			}}
			datawindowid={props.wnd.id}
			onMouseDown={(ev) => {
				onMouseDown(ev, ev.shiftKey ? 'move' : null)
			}}>

			{renderTitleBar()}

			<div className={classes.content}>
				{React.cloneElement(props.children, { wnd: props.wnd })}
			</div>

			{renderStatusBar()}
		</div>)
}
