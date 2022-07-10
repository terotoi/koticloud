"use strict"
import React from 'react'
import ReactDOM from 'react-dom'
import AppModel from './app/app_model'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import * as pdfjs from 'pdfjs-dist'

(function () {
	// Parse /id/{node_id} from the url.
	const idFromURL = (u) => {
		const url = new URL(u)

		if (url.pathname.startsWith('/id/')) {
			const path = url.pathname.substring(4)
			if (path.length > 0)
				return parseInt(path)
		}
		return null
	}

	pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

	const id = idFromURL(window.location.href)

	const ui = document.getElementById("ui")
	ReactDOM.render(<AppModel initialNodeID={id} />, ui)
})()

