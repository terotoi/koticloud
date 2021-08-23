"use strict"
import React from 'react'
import ReactDOM from 'react-dom'
import Context from './context'
import 'typeface-roboto'

(function () {
	// Parse ?id=[node-id] from the url.
	const parseIDinURL = (u) => {
		const url = new URL(u)
		const ids = url.searchParams.get('id')
		if (ids !== null)
			return parseInt(ids)
		else
			return null
	}

	const id = parseIDinURL(window.location.href)
	console.log("id:", id)

	const ui = document.getElementById("ui")
	ReactDOM.render(<Context initialNodeID={id} />, ui)
})()

