import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import ArrowBackIcon from '@material-ui/icons/ArrowBack'
import ArrowForwardIcon from '@material-ui/icons/ArrowForward'

import AutoSizer from 'react-virtualized-auto-sizer'
import { NodeNavigationToolbar } from './nav'
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack'
import { nodeURL } from '../util'
import api from '../api'
import { IconButton } from '@material-ui/core'

const styles = makeStyles((theme) => ({
	root: {
		flexGrow: 1,
		display: 'flex',
		flexDirection: 'column',
		height: '100%'
	},
	doc: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'center',
		flexGrow: 1,
		overflowY: 'scroll',
		overflowX: 'hidden'
	},
	sizer: {
		display: 'flex',
		flexGrow: 1,
		flexDirection: 'row'
	},
	controls: {
		alignSelf: 'center',
		display: 'flex',
		flexGrow: 0,
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		marginTop: theme.spacing(1),
		marginBottom: theme.spacing(2)
	},
	controlItem: {
		marginRight: theme.spacing(1)
	}
}))

// Send progress updates only this often.
const updateInterval = 2000

/**
 * PDFView shows a PDF renderer.
 * 
 * @param {Node} props.node - the node to view
 * @param {function} props.onNextNode - called when the user skipped to the next node
 * @param {function} props.onPrevNode - called when the user skipped to the previous node
 * @param {state} props.ctx - app context
 * @param {WindowManager} props.wm - the window manager
 */
export default function PDFView(props) {
	const [pageNum, setPageNum] = useState(1)
	const [numPages, setNumPages] = useState(0)
	const [jumpToVisible, setJumpToVisible] = useState(false)
	const [fitMode, setFitMode] = useState(0) // 0 = fit to height, 1 = fit to width, 2 = fit to 75% * width, 3 = fit to 50% * width
	const [justify, setJustify] = useState("center")
	const [updateTimeout, setUpdateTimeout] = useState(null)
	const classes = styles()

	function updateProgress() {
		if (updateTimeout !== null)
			clearTimeout(updateTimeout)

		setUpdateTimeout(setTimeout(() => {
			api.updateProgress(props.node.id, props.node.progress, 0.0,
				props.ctx.authToken,
				() => {
					console.log("updateProgress OK", props.node.id, props.node.progress)
				},
				(error) => { openErrorDialog(props.wm, error) })
		}, updateInterval))
	}

	function onLoaded({ numPages }) {
		console.log("onLoaded", numPages, props.node.progress)
		setNumPages(numPages)
		if (!props.node.progress)
			props.node.progress = 1
		setPageNum(props.node.progress)
	}

	function turnPage(dir) {
		if ((pageNum + dir > 0) && (pageNum + dir <= numPages)) {
			setPageNum(pageNum + dir)
			props.node.progress = pageNum + dir
			updateProgress()
		}
	}

	function jumpToPage(num) {
		if (num >= 1 && num <= numPages) {
			setPageNum(num)
			props.node.progress = num
			updateProgress()
		}
	}

	return (
		<Box className={classes.root}>
			<Document
				className={classes.doc}
				file={nodeURL(props.node)}
				onLoadSuccess={onLoaded}>
				<AutoSizer className={classes.sizer} style={{ "justifyContent": justify }}>
					{({ height, width }) => {
						return (
							<Page
								width={[null, width, 0.75 * width, 0.5 * width, 0.25 * width][fitMode]}
								height={(fitMode == 0) ? height : null}
								pageNumber={pageNum} />)
					}}
				</AutoSizer>
			</Document>

			<Box className={classes.controls}>
				<NodeNavigationToolbar
					node={props.node}
					onNextNode={props.onNextNode}
					onPrevNode={props.onPrevNode}
					ctx={props.ctx} />

				<IconButton
					aria-label="previous page"
					disabled={pageNum === 1}
					className={classes.controlItem}
					onClick={() => { turnPage(-1) }}>
					<ArrowBackIcon />
				</IconButton>
				<IconButton
					aria-label="next page"
					className={classes.controlItem}
					disabled={pageNum === numPages}
					onClick={() => { turnPage(1) }}>
					<ArrowForwardIcon />
				</IconButton>
				<Typography className={classes.controlItem} onClick={() => { setJumpToVisible(true) }}>{pageNum} / {numPages}</Typography>
				{!jumpToVisible ? null :
					<React.Fragment>
						<span>Page:</span>
						<TextField
							autoFocus={true}
							onKeyPress={(ev) => {
								if (ev.key === 'Enter') {
									const n = parseInt(ev.target.value)
									setJumpToVisible(false)
									jumpToPage(n)
								}
							}} />
					</React.Fragment>}
				<Button variant="contained"
					color="secondary"
					className={classes.controlItem}
					onClick={() => { setFitMode((fitMode + 1 > 4) ? 0 : (fitMode + 1)) }}>
					Fit: {["Height", "Width", "75% width", "50% width", "25% width"][fitMode]}</Button>
				<Button variant="contained" color="secondary"
					className={classes.controlItem}
					onClick={() => { setJustify(justify === "center" ? "start" : "center") }}>
					{justify === "center" ? "Justify: center" : "Justify: left"}
				</Button>
			</Box>
		</Box >)
}
