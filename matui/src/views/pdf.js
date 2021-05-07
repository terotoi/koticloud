import React, { useState } from 'react'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import AutoSizer from 'react-virtualized-auto-sizer'
import { makeStyles } from '@material-ui/core/styles'
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack'
import { nodeURL, setNodeMeta } from '../util'
import GlobalContext from '../context'
import api from '../api'

const styles = makeStyles((theme) => ({
	root: {
		flexGrow: 1,
		display: 'flex',
		flexDirection: 'column'
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
 * @param {string} props.authToken - JWT authentication token
 */
export default function PDFView(props) {
	const [pageNum, setPageNum] = useState(1)
	const [numPages, setNumPages] = useState(0)
	const [jumpToVisible, setJumpToVisible] = useState(false)
	const [fitMode, setFitMode] = useState(0) // 0 = fit to height, 1 = fit to width, 2 = fit to 75% * width, 3 = fit to 50% * width
	const [justify, setJustify] = useState("center")
	const [updateTimeout, setUpdateTimeout] = useState(null)
	const context = React.useContext(GlobalContext)
	const classes = styles()

	function updateProgress(page) {
		setNodeMeta(props.node, page)

		if (updateTimeout !== null)
			clearTimeout(updateTimeout)

		setUpdateTimeout(setTimeout(() => {
			api.updateMeta(props.node.id, props.node.MetaType, props.node.MetaData,
				props.authToken,
				() => {
					console.log("updateProgress OK", JSON.stringify(props.node.MetaData))
				},
				(error) => { openErrorDialog(context, error) })
		}, updateInterval))
	}

	function onLoaded({ numPages }) {
		console.log("onLoaded", numPages)
		setNumPages(numPages)

		if (props.node.MetaType === 'progress' && props.node.MetaData !== null &&
			props.node.MetaData.Progress)
			setPageNum(props.node.MetaData.Progress)
	}

	function turnPage(dir) {
		if ((pageNum + dir > 0) && (pageNum + dir <= numPages)) {
			setPageNum(pageNum + dir)
			updateProgress(pageNum + dir)
		}
	}

	function jumpToPage(num) {
		if (num >= 1 && num <= numPages) {
			setPageNum(num)
			updateProgress(num)
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
				<Button variant="contained"
					color="secondary"
					disabled={pageNum === 1}
					className={classes.controlItem}
					onClick={() => { turnPage(-1) }}>Prev Page</Button>
				<Button variant="contained" color="secondary"
					className={classes.controlItem}
					disabled={pageNum === numPages}
					onClick={() => { turnPage(1) }}>Next Page</Button>
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
