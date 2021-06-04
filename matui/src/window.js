import React, { useRef } from 'react'
import { makeStyles } from '@material-ui/core'

const styles = makeStyles((theme) => ({
	wm: {
		width: '100%',
		minHeight: '100vh'
	},

	window: {
		position: 'absolute',
		left: '10%',
		top: '5%',
		minWidth: '10rem',
		minHeight: '5rem',
		background: theme.palette.background.default,
		border: '1px solid ' + theme.palette.secondary.main,
		zIndex: 10,
		overflow: 'auto'
	}
}))

/**
 * Creates an ErrorDialog and adds it the context using context.addWindow(dialog)
 * On close, context.removeDialog(dialog) will be called.
 * 
 * @param {Context} context - the context to add the dialog in
 * @param {string} error - the error text
 */
export function openWindow(context, content) {
	let wnd = null
	function onClose() {
		context.removeWindow(wnd)
	}

	wnd =
		<Window>
			{React.cloneElement(content, { onClose: onClose })}
		</Window>
	context.addWindow(wnd)
}

/**
 * Window is a draggable container.
 * 
 * @param {[...Object]} props.children - child components to render
 * @param {function} props.onClose - called when window is closed
 */
export function Window(props) {
	const classes = styles()

	return (
		<div
			className={`${classes.window} window`}>
			{props.children}
		</div>)
}

/**
 * WindowManager handles draggable Windows.
 * 
 * @param props.windows - list of windows to draw
 * @param props.children - standard children
 */
export function WindowManager(props) {
	const classes = styles()
	const [dragActive, setDragActive] = React.useState(false)
	const [initialPos, setInitialPos] = React.useState([0, 0])
	const window = useRef(null)
	const [offset, setOffset] = React.useState([0, 0])

	function onMouseDown(ev) {
		for (var elem = ev.target; elem && !elem.classList.contains('window'); elem = elem.parentElement)
			;
		if (elem === null)
			return

		ev.preventDefault()

		window.current = elem

		let x, y
		if (ev.type == "touchstart") {
			x = ev.touches[0].clientX - offset[0]
			y = ev.touches[0].clientY - offset[1]
		} else {
			x = ev.clientX - offset[0]
			y = ev.clientY - offset[1]
		}
		setDragActive(true)
		setInitialPos([x, y])
	}

	function onMouseUp(ev) {
		if (dragActive) {
			ev.preventDefault()

			setDragActive(false)

			let x, y
			if (ev.type == "touchend") {
				x = ev.touches[0].clientX - initialPos[0]
				y = ev.touches[0].clientY - initialPos[1]
			} else {
				x = ev.clientX - initialPos[0]
				y = ev.clientY - initialPos[1]
			}
			setOffset([x, y])
		}
	}

	function onMouseMove(ev) {
		if (dragActive) {
			ev.preventDefault()
			let x, y
			if (ev.type == "touchmove") {
				x = ev.touches[0].clientX - initialPos[0]
				y = ev.touches[0].clientY - initialPos[1]
			} else {
				x = ev.clientX - initialPos[0]
				y = ev.clientY - initialPos[1]
			}

			window.current.style.transform = "translate3d(" + x + "px, " + y + "px, 0)"
		}
	}

	return (
		<div
			className={classes.wm}
			onMouseDown={onMouseDown}
			onMouseUp={onMouseUp}
			onMouseMove={onMouseMove}>
			{props.windows.map((d, i) => <div key={i}>{d}</div>)}
			{props.children}
		</div>
	)
}
