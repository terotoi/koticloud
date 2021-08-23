import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Container from '@material-ui/core/Container'
import LoginView from './login'
import MyAppBar from './appbar'
import FileManager from './fm/filemanager'
import { openErrorDialog } from './dialogs/error'
import { isDir, setCookie } from './util'
import NodeView from './views/node'
import api from './api'

const styles = makeStyles((theme) => ({
	root: {
		display: 'flex',
		flexFlow: 'column',
		overflow: 'hidden'
	}
}))

/**
 * App is the root component of the application.
 * 
 * @param {number} initialNodeID - ID passed in the URL
 * @param {state} props.ctx
 * @param {WindowManager) wm - the window manager
 */
export default function App(props) {
	const [username, setUsername] = React.useState('')
	const [isAdmin, setAdmin] = React.useState(false)
	const [authToken, setAuthToken] = React.useState(null)
	const [homeNodeID, setHomeNodeID] = React.useState(null)
	const [fmNodeID, setFmNodeID] = React.useState(null)
	const [searchResults, setSearchResults] = React.useState(null)
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
				setAuthToken(resp.AuthToken)
				setUsername(resp.Username)
				setCookie("jwt", resp.AuthToken, 31)
				setAdmin(resp.Admin)
				setHomeNodeID(resp.InitialNodeID)

				localStorage.setItem('authToken', resp.AuthToken)
				localStorage.setItem('username', resp.Username)
				localStorage.setItem('admin', resp.Admin)
				localStorage.setItem('homeNodeID', "" + resp.InitialNodeID)

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
		localStorage.removeItem('authToken')
		localStorage.removeItem('username')
		localStorage.removeItem('admin')
		localStorage.removeItem('homeNodeID')
		setHomeNodeID(null)
		setAuthToken(null)
		setUsername('')
		setAdmin(false)
		setCookie('jwt', "")
	}

	/** Load settings from the server. */
	function loadSettings(token) {
		api.querySettings(token, (settings) => {
			setSettings(settings)
		}, (error) => {
			openErrorDialog(props.wm, error)
		})
	}

	// Load current authentication from local storage.
	React.useEffect(() => {
		var localHomeNodeID = parseInt(localStorage.getItem("homeNodeID")) || null
		if (localHomeNodeID !== null) {
			setHomeNodeID(localHomeNodeID)
		}

		if (authToken === null) {
			const authToken = localStorage.getItem("authToken") || null
			const username = localStorage.getItem("username") || null
			const admin = localStorage.getItem("admin") || false

			if (authToken !== null && username !== null) {
				setAuthToken(authToken)
				setUsername(username)
				setAdmin(admin)
				setCookie("jwt", authToken, 31)
				loadSettings(authToken)
			}
		}
	}, [authToken])

	React.useEffect(() => {
		if (authToken !== null && (homeNodeID !== null || props.ctx.initialNodeID !== null)) {
			api.queryNode(props.ctx.initialNodeID || homeNodeID , authToken, (node) => {
				if (isDir(node.mime_type)) {
					setFmNodeID(node.id)
				} else {
					props.wm.openWindow(node.name, <NodeView
						initialNode={node}
						nodes={[]}
						authToken={authToken}
						onNodeSaved={() => { alert("Saving url opened nodes not supported yet.") }}
						wm={props.wm} />, true)
				}
			}, (error) => { openErrorDialog(wm, error) })
		}
	}, [homeNodeID])

	return (
		(authToken == null) ?
			<Container>
				<LoginView
					onSubmit={login} />
			</Container>
			:
			<Container maxWidth={false} display="flex" className={classes.root}>
				<MyAppBar
					className={classes.appBar}
					username={username}
					isAdmin={isAdmin}
					onLogout={logout}
					onSearchResults={(r) => { setSearchResults(r) }}
					homeNodeID={homeNodeID}
					authToken={authToken}
					settings={settings}
					ctx={props.ctx}
					wm={props.wm} />

				{(props.ctx.fmEnabled && (fmNodeID !== null)) ?
					<FileManager
						nodes={searchResults}
						initialNodeID={fmNodeID}
						authToken={authToken}
						settings={settings}
						ctx={props.ctx}
						wm={props.wm} /> : null}
			</Container>)
}
