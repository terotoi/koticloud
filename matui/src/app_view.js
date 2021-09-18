import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import LoginView from './login'
import MyAppBar from './appbar'
import FileManagerModel from './fm/fm_model'
import NodeView from './views/node'
import { openErrorDialog } from './dialogs/error'
import { isDir } from './util'
import api from './api'

const styles = makeStyles((theme) => ({
	root: {
		display: 'flex',
		flexFlow: 'column',
		height: '100%',
		minHeight: '100vh'
	}
}))

/**
 * AppView
 * 
 * @param {number} initialNodeID - ID passed in the URL
 * @param {state} props.ctx
 * @param {WindowManager) wm - the window manager
 */
export default function AppView(props) {
	const [settings, setSettings] = React.useState(null)
	const classes = styles()

	/**
	 * Log in the server with username and password.
	 * 
	 * @param {string} username - username to login with
	 * @param {string} password - password to login with
	 */
	function login(username, password) {
		if (username == '' || password == '')
			return

		/**
		 * Successful login calllback.
		 * 
		 * @param {string} resp.Username
		 * @param {string} resp.AuthToken
		 * @param {int} resp.InitialNode
		 */
		function loginOk(resp) {
			if (resp === null) {
				openErrorDialog(props.wm, "Wrong username or password")
			} else {
				props.ctx.setAuthToken(resp.AuthToken)
				props.ctx.setUsername(resp.Username)
				props.ctx.setIsAdmin(resp.Admin)
				props.ctx.setHomeNodeID(resp.InitialNodeID)
				loadSettings(resp.AuthToken)
			}
		}

		api.login(username, password, loginOk,
			(error) => {
				openErrorDialog(props.wm, error)
			})
	}

	/** Logs user out. */
	function logout() {
		props.ctx.setAuthToken(null)
		props.ctx.setUsername('')
		props.ctx.setIsAdmin(false)
	}

	/** Load settings from the server. */
	function loadSettings(token) {
		api.querySettings(token, (settings) => {
			setSettings(settings)
		}, (error) => {
			openErrorDialog(props.wm, error)
		})
	}

	React.useEffect(() => {
		document.title = "KotiCloud - " +
			(props.ctx.currentNodes ? props.ctx.currentNodes[0].name : "")
	}, [props.ctx.currentNodes])

	// Load current authentication from local storage.
	React.useEffect(() => {
		if (props.ctx.authToken !== null) {
			loadSettings(props.ctx.authToken)
		}
	}, [props.ctx.authToken])

	function renderNodeView(nodes) {
		var view = null
		if (nodes !== null) {
			if (isDir(nodes[0].mime_type))
				view = <FileManagerModel
					nodes={null}
					node={nodes[0]}
					settings={settings}
					ctx={props.ctx}
					wm={props.wm} />
			else
				view = <NodeView
					nodes={nodes.slice(1)}
					initialNode={nodes[0]}
					onNodeSaved={null}
					ctx={props.ctx}
					wm={props.wm} />
		}
		return view
	}

	const showFileManagerFor = (nodes) =>
		nodes === null || nodes.length === 0 || isDir(nodes[0].mime_type)

	return (
		(props.ctx.authToken == null) ?
			<div className={classes.root}>
				<LoginView
					onSubmit={login} />
			</div>
			:
			<div className={classes.root}>
				{(showFileManagerFor(props.ctx.currentNodes)) ?
					<MyAppBar
						className={classes.appBar}
						onLogout={logout}
						onSearchResults={props.ctx.onSearchResults}
						authToken={props.ctx.authToken}
						settings={settings}
						ctx={props.ctx}
						wm={props.wm} /> : null}
				{renderNodeView(props.ctx.currentNodes)}
			</div>)
}
