import React, { useState } from 'react'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import AutoSizer from 'react-virtualized-auto-sizer'
import { makeStyles } from '@material-ui/core/styles'
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack'
import { nodeURL, setMetaProgress } from '../util'
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
		flexGrow: 1
	},
	page: {
	},
	controls: {
		flexGrow: 0,
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: theme.spacing(1),
		marginLeft: theme.spacing(2),
		marginBottom: theme.spacing(2)
	},
	controlItem: {
		marginRight: theme.spacing(1)
	}
}))

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
	const context = React.useContext(GlobalContext)
	const classes = styles()

	function updateProgress(page) {
		setMetaProgress(props.node, page)

		api.updateMeta(props.node.id, props.node.MetaType, props.node.MetaData,
			props.authToken,
			() => {
				console.log("updateProgress OK", JSON.stringify(props.node.MetaData))
			},
			(error) => { openErrorDialog(context, error) })
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

	function jumpPage(num) {
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
				<AutoSizer className={classes.doc}>
					{({ height, width }) => {
						return (
							<Page className={classes.page} height={height} pageNumber={pageNum} />)
					}}
				</AutoSizer>
			</Document>

			<Box display="flex" className={classes.controls} alignItems="center">
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
							onKeyPress={(ev) => {
								if (ev.key === 'Enter') {
									const n = parseInt(ev.target.value)
									jumpPage(n)
								}
							}} />
					</React.Fragment>}
				<Typography>{props.node.name}</Typography>
			</Box>
		</Box >)
}
