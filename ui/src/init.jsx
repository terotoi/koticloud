/**
 * init.jsx - The main entry point for the UI
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React from 'react'
import AppModel from './app/app_model'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import * as pdfjs from 'pdfjs-dist'
import { createRoot } from 'react-dom/client';

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
	const ui = document.getElementById("ui");
	const root = createRoot(ui);
	root.render(<AppModel initialNodeID={id} />)
})()

