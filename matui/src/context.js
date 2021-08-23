import React from 'react'
import WindowManager from './windows/wm'

export default class Context extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			initialNodeID: props.initialNodeID,

			fmEnabled: true,
			setFmEnabled: (enabled) => {
				this.setState({ fmEnabled: enabled })
			}
		}
	}

	render() {
		return <WindowManager ctx={this.state} />
	}
}
