import React, { useEffect } from 'react'
import { makeStyles, MuiThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'
import Container from '@material-ui/core/Container'

import LoginView from './login'
import MyAppBar from './appbar'
import FileManager from './fm/filemanager'
import GlobalContext from './context'
import { openErrorDialog } from './dialogs/error'
import theme from './theme'
import api from './api'

import { WindowManager } from './window'
import { setCookie } from './util'

const styles = makeStyles((theme) => ({
	root: {
		display: 'flex',
		flexFlow: 'column',
		minHeight: '100vh'
	},
	fm: {
		border: '8px solid green',
		flex: 1
	}
}))

/**
 * App is the root component of the application.
 */
export default function App(props) {
	const [username, setUsername] = React.useState('')
	const [isAdmin, setAdmin] = React.useState(false)
	const [authToken, setAuthToken] = React.useState(null)
	const [initialNodeID, setInitialNodeID] = React.useState(null)
	const [searchResults, setSearchResults] = React.useState(null)

	const ctx = React.useContext(GlobalContext)
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
			}
		}
	}, [authToken])

	return (
		<MuiThemeProvider theme={theme}>
			<CssBaseline />
			<WindowManager windows={ctx.windows}>
				{(authToken == null) ?
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

							onSearchResults={(r) => { setSearchResults(r) }} />
						
						<FileManager
							className={classes.fm}
							nodes={searchResults}
							initialNodeID={initialNodeID}
							authToken={authToken} />
					</Container>}
			</WindowManager>
		</MuiThemeProvider>
	)
}
