/**
 * reader.jsx - a document reader
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React, { useState, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import FirstPageIcon from '@mui/icons-material/FirstPage'
import LastPageIcon from '@mui/icons-material/LastPage'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import FormatIndentDecreaseIcon from '@mui/icons-material/FormatIndentDecrease'
import FormatIndentIncreaseIcon from '@mui/icons-material/FormatIndentIncrease'

import * as pdfjs from 'pdfjs-dist'

import { NodeNavigationToolbar } from './nav'
import api from '../api'

// Number of ms before progress updates.
const progressUpdateInterval = 3000

// Number of ms before controls are hidden.
const hoverOutDelay = 1500

/**
 * ReaderControls renders controls for the document reader.
 * 
 * @param {Node} props.node - the file to view
 * @param {Document} props.doc - the document to render
 * @param {int} props.pageNum - the current page number
 * @param {zoom} props.zoom - the current zoom level
 * @param {fuction} props.turnPage(dir) - called when the user turns the page
 * @param {function} props.turnPageTo(num) - called when the user wants to turn to a specific page
 * @param {function} props.zoomIn(offset) - called when the user wants to zoom in or out
 * @param {function} props.adjustMargin(offset) - called when the user wants to move the document to left or right
 * @param {function} props.onNextNode - called when the user skipped to the next node
 * @param {function} props.onPrevNode - called when the user skipped to the previous node
 * @param {state} props.ctx - app context
 */
function ReaderControls(props) {
	return (
		<Box sx={{
			display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center',
			padding: '0 0.5rem 0 0'
		}}>
			<NodeNavigationToolbar
				node={props.node}
				onNextNode={props.onNextNode}
				onPrevNode={props.onPrevNode}
				ctx={props.ctx} />
			<Button onClick={() => { props.turnPageTo(1) }}><FirstPageIcon /></Button>
			<Button onClick={() => { props.turnPage(-1) }}><ArrowBackIcon /></Button>
			<Button onClick={() => { props.turnPage(1) }}><ArrowForwardIcon /></Button>
			<Button onClick={() => {
				props.turnPageTo(props.doc ? props.doc.numPages : 1)
			}}><LastPageIcon /></Button>
			<Typography color='secondary'>{props.pageNum} / {props.doc ? props.doc.numPages : 0}</Typography>
			<Button onClick={() => { props.zoomIn(0.1) }}><ZoomInIcon /></Button>
			<Button onClick={() => { props.zoomIn(-0.1) }}><ZoomOutIcon /></Button>
			<Typography color='secondary'>{Math.round(props.zoom * 100)} %</Typography>
			<Button onClick={() => { props.adjustMargin(-5) }}><FormatIndentDecreaseIcon /></Button>
			<Button onClick={() => { props.adjustMargin(5) }}><FormatIndentIncreaseIcon /></Button>
		</Box>)
}

/**
 * Reader shows PDF files.
 * 
 * @param {Item} props.node - the current file
 * @param {function()} props.onNextNode - the next file is selected
 * @param {function()} props.onPrevPrev - the previous file is selected
*/
export default function ReaderView(props) {
	const root = React.useRef(null)
	const wrapper = React.useRef(null)
	const doc = React.useRef(null)
	const rendering = React.useRef(false)
	const [pageNum, setPageNum] = React.useState(1)
	const [numPages, setNumPages] = React.useState(1)
	const [zoom, setZoom] = React.useState(1.0)
	const [margin, setMargin] = React.useState(parseInt(localStorage.getItem('pdf-margin') || '0'))
	const [hover, setHover] = useState(true)
	const hoverTimeout = useRef(null)
	const progressInterval = useRef(null)

	React.useEffect(() => {
		console.log("Starting interval")

		let prevNode = null, prevProgress = null

		progressInterval.current = setInterval(() => {
			if (props.node.id !== prevNode || props.node.progress != prevProgress) {
				prevNode = props.node.id
				prevProgress = props.node.progress

				api.updateProgress(props.node.id, props.node.progress, 1.0, props.ctx.authToken,
					() => { console.log("update progress: ", props.node.progress) },
					(err) => { console.log("update progress error: ", err) })
			}

		}, progressUpdateInterval)

		return () => {
			console.log("Clearing progress timeout")
			clearTimeout(progressInterval.current)
		}
	}, [props.node])

	React.useEffect(() => {
		//document.onkeydown = onKeyDown

		const url = props.node.content_url

		pdfjs.getDocument(url).promise.then((d) => {
			const pn = Math.round(props.node.progress * d.numPages) || 1
			doc.current = d
			setPageNum(pn)
			setNumPages(d.numPages)
			render(d, pn)
		}, (err) => {
			console.log("getDocument error:", err)
		})

		return () => {
			//document.onkeydown = null
		}
	}, [props.node])

	React.useEffect(() => {
		if (doc.current === null)
			return
		render(doc.current, pageNum)
	}, [pageNum, zoom])

	React.useEffect(() => {
		if(root.current !== null) {
			root.current.focus()
		}
	})

	const render = (doc, pageNum) => {
		doc.getPage(pageNum).then((page) => {
			if (rendering.current)
				return

			rendering.current = true

			const z = Math.max(zoom, 1.0)
			const viewport = page.getViewport({ scale: z * 2 })
			const wrapper = document.getElementById("pdf-wrapper")
			const canvas = document.getElementById("pdf-canvas")
			//const outputScale = window.devicePixelRatio || 1

			canvas.width = viewport.width
			canvas.height = viewport.height

			const aspect = viewport.width / viewport.height
			canvas.style.height = (zoom * wrapper.offsetHeight) + "px"
			canvas.style.width = aspect * (zoom * wrapper.offsetHeight) + "px"

			const ctx = canvas.getContext("2d")

			page.render({
				canvasContext: ctx,
				viewport: viewport
			}).promise.then(() => {
			}).finally(() => {
				rendering.current = false
			})
		}, (err) => {
			console.log("getPage error: ", err)
		})
	}

	const onKeyDown = (e) => {
		const ev = e || window.event

		if (ev.keyCode == 37) {
			// Left
			setPageNum((num) => {
				const pn = Math.max(1, num - (ev.ctrlKey ? 10 : 1))
				props.node.progress = pn / doc.current.numPages
				wrapper.current.scrollTop = 0
				return pn
			})

		} else if (ev.keyCode == 39) {
			// Right
			setPageNum((num) => {
				const pn = Math.min(doc.current.numPages, num + (ev.ctrlKey ? 10 : 1))
				props.node.progress = pn / doc.current.numPages
				return pn
			})
			wrapper.current.scrollTop = 0

		} else if (ev.keyCode == 38 && ev.ctrlKey) {
			// Up
			setZoom((z) => z + 0.1)
		} else if (ev.keyCode == 40 && ev.ctrlKey) {
			// Down
			setZoom((z) => z - 0.1)
		}
	}

	const turnPage = (delta) => {
		const pn = pageNum + delta
		if ((pn >= 1) && (pn <= doc.current.numPages) && !rendering.current) {
			setPageNum(pn)
			props.node.progress = pn / doc.current.numPages
			wrapper.current.scrollTop = 0
		}
	}

	const turnPageTo = (pn) => {
		if (!rendering.current) {
			props.node.progress = pn / doc.current.numPages
			setPageNum(pn)
			wrapper.current.scrollTop = 0
		}
	}

	const zoomIn = (delta) => {
		const z = Math.max(Math.min(zoom + delta, 10.0), 0.1)
		setZoom(z)
	}

	const adjustMargin = (delta) => {
		const m = Math.max(Math.min(margin + delta, 200), 0)
		setMargin(m)
		localStorage.setItem('pdf-margin', m)
	}

	function clearHoverTimeout() {
		if (hoverTimeout.current !== null) {
			clearTimeout(hoverTimeout.current)
			hoverTimeout.current = null
		}
	}

	const onMouseMove = (ev) => {
		const h = ev.clientY > (window.innerHeight * 0.8)

		if (h) {
			clearHoverTimeout()
			setHover(true)
		} else if (hover) {
			clearHoverTimeout()
			hoverTimeout.current = setTimeout(() => { setHover(false) }, hoverOutDelay)
		}
	}

	return (
		<Box tabIndex="0" onKeyDown={onKeyDown} onMouseMove={onMouseMove}
			display='flex' flexDirection="column" justifyContent="space-between"
			alignItems="center"
			ref={root}
			sx={{
				position: 'absolute',
				width: '100%',
				height: '100%'
			}} >

			<div ref={wrapper} id="pdf-wrapper"
				style={{
					display: 'flex', flexDirection: 'row',
					width: '100%', height: '100%', overflowY: 'auto'
				}}>
				<canvas style={{ marginLeft: margin + 'rem' }} id="pdf-canvas" />
			</div>

			<Box display={hover ? 'flex' : 'none'} flexDirection="row" flexWrap="none"
				sx={{
					zIndex: 1, position: 'absolute', bottom: '0',
					backgroundColor: 'background.default'
				}}>
				<ReaderControls node={props.node} doc={doc.current} pageNum={pageNum} zoom={zoom}
					turnPage={turnPage} turnPageTo={turnPageTo} zoomIn={zoomIn}
					adjustMargin={adjustMargin}
					onNextNode={props.onNextNode} onPrevNode={props.onPrevNode}
					ctx={props.ctx} />
			</Box>
		</Box >)
}
