import React, { useRef } from 'react'
import { makeStyles } from '@material-ui/core'
import Window from './window'

// Base z-depth for windows.
const zIndexBase = 10

const styles = makeStyles((theme) => ({
	wm: {
		width: '100%',
		minHeight: '100vh'
	}
}))

// Returns window position of a touch of button event.
function getEventPos(ev) {
	if (["touchstart", "touchmove", "touchend"].indexOf(ev.type) !== -1)
		return [ev.touches[0].pageX, ev.touches[0].pageY]
	else
		return [ev.pageX, ev.pageY]
}

/**
 * WindowRenderer handles draggable and resizble Windows.
 * 
 * @param props.wm - the window manager
 * @param props.children - standard children
 */
export default function WindowRenderer(props) {
	const [dragActive, setDragActive] = React.useState(false)
	const [resizeActive, setResizeActive] = React.useState(false)
	const [offset, setOffset] = React.useState([0, 0])
	const [updated, setUpdated] = React.useState(false)
	const [window, setWindow] = React.useState(null)
	const classes = styles()

	function onMouseDown(ev, wnd, action) {
		setWindow(wnd)
		props.wm.raiseWindow(wnd.id)

		if (!wnd.maximized && (action === 'resize' || action === 'move')) {
			const isResize = (action === 'resize')
			setResizeActive(isResize)

			/*const rect = wnd.getBoundingClientRect()
			const [x, y] = [rect.left + doc.scrollLeft, rect.top + doc.scrollTop]
			const [x2, y2] = [rect.right + doc.scrollLeft, rect.bottom + doc.scrollTop]*/

			const [mx, my] = getEventPos(ev)
			const [x, y] = wnd.pos
			const [x2, y2] = [x + wnd.size[0], y + wnd.size[1]]

			let xoff, yoff
			if (isResize) {
				xoff = mx - x2
				yoff = my - y2
			} else {
				xoff = mx - x
				yoff = my - y
			}

			setDragActive(true)
			setOffset([xoff, yoff])
		}
	}

	function onMouseUp(ev) {
		if (dragActive) {
			ev.preventDefault()
			setDragActive(false)
			setResizeActive(false)
			setWindow(null)
		}
	}

	function onMouseMove(ev) {
		if (dragActive) {
			if (ev.type !== 'touchmove')
				ev.preventDefault()

			const [mx, my] = getEventPos(ev)
			const [xoff, yoff] = offset

			if (resizeActive) {
				const newSize = [mx - window.pos[0] - xoff, my - window.pos[1] - yoff]
				window.size = newSize
			} else {
				const newPos = [mx - xoff, my - yoff]
				window.pos = newPos
			}
			setUpdated(!updated) // Force refresh
		}
	}

	function onMinimize(ev, wnd) {
		console.log("onMinimize")
	}

	function onMaximize(ev, wnd) {
		console.log("onMaximize")

		//const doc = document.documentElement
		//wnd.pos = [doc.scrollLeft, doc.scrollTop]
		//wnd.size = [doc.clientWidth, doc.clientHeight]
		wnd.maximized = !wnd.maximized
		setUpdated(!updated) // Force refresh
	}

	return (
		<div
			className={classes.wm}
			onMouseUp={onMouseUp}
			onTouchEnd={onMouseUp}
			onMouseMove={dragActive ? onMouseMove : null}
			onTouchMove={dragActive ? onMouseMove : null}>

			{props.wm.windows.map((wnd) =>
				<Window
					key={wnd.id}
					wnd={wnd}
					zIndex={zIndexBase + wnd.zIndex}
					pos={wnd.pos}
					size={wnd.size}
					onClose={(ev, wnd) => { props.wm.closeWindow(wnd) }}
					onMouseDown={onMouseDown}
					onMinimize={onMinimize}
					onMaximize={onMaximize}>
					{wnd.content}
				</Window>)}

			{props.wm.dialogs.map((dialog, i) =>
				<React.Fragment key={i}>{dialog}</React.Fragment>)}
			{props.children}
		</div>
	)
}
