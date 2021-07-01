import React from 'react'
import { MuiThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'
import App from '../app'
import WindowRenderer from './render'
import theme from '../theme'
import { remSize } from '../util'

/**
 * WindowManager manages windows and dialogs.
 */
export default class WindowManager extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			// window is {
			// content: Object, title: String, id: int, zIndex: int,
			// pos: [number, number], size: [number, number]} }
			windows: [],
			dialogs: [],
			closeHooks: [],

			openWindow: this.openWindow.bind(this),
			addCloseHook: this.addCloseHook.bind(this),
			closeWindow: this.closeWindow.bind(this),
			raiseWindow: this.raiseWindow.bind(this),
			resizeWindow: this.resizeWindow.bind(this),
			addDialog: this.addDialog.bind(this),
			removeDialog: this.removeDialog.bind(this),
		}
	}

	// Find the next largest availabe z index for a window.
	findNextZindex() {
		const max_idx = this.state.windows.reduce((p, c) =>
			(p === null || (c.zIndex > p.zIndex)) ? c : p, null)
		return (max_idx === null) ? 0 : max_idx.zIndex + 1
	}

	/**
	 * Add a window to list of global windows.
	 * @param {Object} content - content of the window to add
	 * @returns the window 
	 */
	openWindow(title, content, maximized) {
		const idx = this.findNextZindex()

		// Find the maximum id
		const max_id = this.state.windows.reduce((p, c) =>
			(p === null || (c.id > p.id)) ? c : p, null)

		const id = (max_id === null) ? 0 : max_id.id + 1

		const doc = document.documentElement
		const pos_f = (maximized === true) ? 0.0 : 0.1
		const size_f = (maximized === true) ? 1.0 : 0.6

		const pos = [doc.scrollLeft + doc.clientWidth * pos_f,
		doc.scrollTop + doc.clientHeight * pos_f]
		const size = [doc.clientWidth * size_f, doc.clientHeight * size_f]

		this.setState({
			windows: [...this.state.windows,
			{
				content: content,
				title: title, id: id, zIndex: idx,
				pos: pos,
				size: size
			}]
		})
		return window
	}

	/**
	* Adds a hook that is called before the window is closed.
	* 
	* @param {Window} wnd - the affected window
	* @param {function} hook - the function to call before closing the window
	* @param {Object} arg - optional argument for the close hook
	*/
	addCloseHook(wnd, hook, arg) {
		this.state.closeHooks.push({ id: wnd.id, hook: hook, arg: arg })
		this.setState({ closeHooks: this.state.closeHooks })
	}

	/** 
	 * Remove a window from the list of windows.
	 * @param {Window} window - the window to remove
	 */
	closeWindow(window) {
		// Call pre-close hooks
		const h = this.state.closeHooks.find((x) => x.id === window.id)
		if (h !== undefined) {
			h.hook(h.arg)
		}

		this.setState({
			hooks: this.state.closeHooks.filter((x) => x.id !== window.id),
			windows: this.state.windows.filter((x) => x.id !== window.id)
		})
	}

	/** Raise a window to the top. */
	raiseWindow(windowId) {
		const w = this.state.windows.find((x) => x.id === windowId)
		if (w !== undefined) {
			const idx = this.findNextZindex()
			w.zIndex = idx
			this.setState({ windows: this.state.windows })
		}
	}

	/**
	 * Resizes the window to given content size.
	 * 
	 * @param {Window} wnd - the window to resize
	 * @param {[number, number]} size - size of the content area
	 * @param {bool} limitToViewport - if true, do not expand the window over viewport
	 * 		(document's client size)
	 */
	resizeWindow(wnd, size, limitToViewport) {
		const borderSize = remSize(4)

		const w = this.state.windows.find((x) => x.id === wnd.id)
		if (w !== undefined) {
			w.size = [size[0], size[1] + borderSize]

			if (limitToViewport) {
				const doc = document.documentElement
				w.size = [
					Math.min(size[0], doc.clientWidth),
					Math.min(size[1], doc.clientHeight)]
			}
			this.setState({ windows: this.state.windows })
		}
	}

	/**
	 * Adds a dialog to the list of dialog windows.
	 * @param {Object} dialog - the dialog window to add
	 * @returns the dialog window
	 */
	addDialog(dialog) {
		this.setState({ dialogs: [...this.state.dialogs, dialog] })
	}

	/**
	 * Remove a dialog from the list of dialogs.
	 * @param {Object} dialog - the dialog to remove
	 */
	removeDialog(dialog) {
		this.setState({ dialogs: this.state.dialogs.filter((x) => x !== dialog) })
	}

	render() {
		return (
			<React.Fragment>
				<MuiThemeProvider theme={theme}>
					<CssBaseline />
					<WindowRenderer wm={this.state}>
						<App wm={this.state} />
					</WindowRenderer>
				</MuiThemeProvider>
			</React.Fragment>)
	}
}

