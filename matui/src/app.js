import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Container from '@material-ui/core/Container'
import LoginView from './login'
import MyAppBar from './appbar'
import FileManager from './fm/filemanager'
import { openErrorDialog } from './dialogs/error'
import { setCookie } from './util'
import api from './api'

const styles = makeStyles((theme) => ({
	root: {
		display: 'flex',
		flexFlow: 'column',
		overflow: 'hidden'
	},
	fm: {
		border: '8px solid green',
		flex: 1
	}
}))

/**
 * App is the root component of the application.
 * @param {WindowManager) wm - the window manager
 */
export default function App(props) {
	const [username, setUsername] = React.useState('')
	const [isAdmin, setAdmin] = React.useState(false)
	const [authToken, setAuthToken] = React.useState(null)
	const [initialNodeID, setInitialNodeID] = React.useState(null)
	const [searchResults, setSearchResults] = React.useState(null)
	const [settings, setSettings] = React.useState(null)
	const ctx = props.context // React.useContext(GlobalContext)
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
				openErrorDialog(ctx, "Wrong username or password")
			} else {
				setAuthToken(resp.AuthToken)
				setUsername(resp.Username)
				setCookie("jwt", resp.AuthToken, 31)
				setAdmin(resp.Admin)
				setInitialNodeID(resp.InitialNodeID)

				localStorage.setItem('authToken', resp.AuthToken)
				localStorage.setItem('username', resp.Username)
				localStorage.setItem('admin', resp.Admin)
				localStorage.setItem('initialNodeID', "" + resp.InitialNodeID)

				loadSettings(resp.AuthTOken)
			}
		}

		api.login(username, password, loginOk,
			(error) => {
				openErrorDialog(ctx, error)
			})
	}

	/** Logs user out. */
	function logout() {
		localStorage.removeItem('authToken')
		localStorage.removeItem('username')
		localStorage.removeItem('admin')
		localStorage.removeItem('intialNodeID')
		setInitialNodeID(null)
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
			openErrorDialog(ctx, error)
		})
	}

	// Load current authentication from local storage.
	React.useEffect(() => {
		if (authToken === null) {
			const authToken = localStorage.getItem("authToken") || null
			const username = localStorage.getItem("username") || null
			const admin = localStorage.getItem("admin") || false
			const initialNodeID = localStorage.getItem("initialNodeID") || null

			if (authToken !== null && username !== null && initialNodeID !== null) {
				setAuthToken(authToken)
				setUsername(username)
				setAdmin(admin)
				setInitialNodeID(parseInt(initialNodeID))
				setCookie("jwt", authToken, 31)
				loadSettings(authToken)
			}
		}
	}, [authToken])

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
					authToken={authToken}
					onLogout={logout}
					onSearchResults={(r) => { setSearchResults(r) }}
					context={props.wm} />

				<FileManager
					className={classes.fm}
					nodes={searchResults}
					initialNodeID={initialNodeID}
					authToken={authToken}
					settings={settings}
					context={props.wm} />
			</Container>)
}
