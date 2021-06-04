"use strict"
import React from 'react'
import ReactDOM from 'react-dom'
import Context from './context'

(function () {
	const ui = document.getElementById("ui")
	ReactDOM.render(<Context />, ui)
})()

