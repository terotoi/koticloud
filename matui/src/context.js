"use strict"
import React from 'react'
import ReactDOM from 'react-dom'
import 'typeface-roboto'

import App from './app'

/**
 * Application context is provided by the state of this object.
 */
export default class Context extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			windows: [],
			addWindow: this.addWindow.bind(this),
			removeWindow: this.removeWindow.bind(this)
		}
	}

	/**
	 * Add a window to list of global windows.
	 * @param {Window} window - the window to add
	 * @returns the window 
	 */
	addWindow(window) {
		this.setState({ windows: [...this.state.windows, window] })
		return window
	}

	/** Remove a window from the list of global windows.
	 * 	@param {Window} window - the window to add
	*/
	removeWindow(window) {
		this.setState({ windows: this.state.windows.filter((x) => x !== window) })
	}

	render() {
		return <App context={this.state} />
	}
}
