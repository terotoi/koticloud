"use strict"
import React from 'react'
import ReactDOM from 'react-dom'
import WindowManager from './windows/wm'
import 'typeface-roboto'

(function () {
	const ui = document.getElementById("ui")
	ReactDOM.render(<WindowManager />, ui)
})()

