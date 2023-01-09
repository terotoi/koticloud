/**
 * app_view.jsx - the main view of the application
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React from 'react'
import LoginView from '../login'
import MyAppBar from './appbar'
import FileManagerModel from '../fm/fm_model'
import { openErrorDialog } from '../dialogs/error'
import api from '../api'

/**
 * AppView
 * 
 * @param {number} initialNodeID - ID passed in the URL
 * @param {state} props.ctx
 * @param {WindowManager) wm - the window manager
 */
export default function AppView(props) {
	const [settings, setSettings] = React.useState(null)

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

	// Logs user out.
	function logout() {
		props.ctx.setAuthToken(null)
		props.ctx.setUsername('')
		props.ctx.setIsAdmin(false)
	}

	/// Load settings from the server.
	function loadSettings(token) {
		api.querySettings(token, (settings) => {
			setSettings(settings)
		}, (error) => {
			openErrorDialog(props.wm, error)
		})
	}

	React.useEffect(() => {
		document.title = "KotiCloud - " +
			(props.ctx.node ? props.ctx.node.name : "")
	}, [props.ctx.node])

	// Load current authentication from local storage.
	React.useEffect(() => {
		if (props.ctx.authToken !== null) {
			loadSettings(props.ctx.authToken)
		}
	}, [props.ctx.authToken])

	if (props.ctx.authToken === null) {
		return (<LoginView
			onSubmit={login} />)

	}

	if (props.ctx.node === null) {
		return null
	}

	return (
		<div style={{
			display: 'flex',
			flexFlow: 'column',
			height: '100%',
			minHeight: '100vh'
		}}>
			<React.Fragment>
				<MyAppBar
					onLogout={logout}
					onSearchResults={props.ctx.onSearchResults}
					authToken={props.ctx.authToken}
					settings={settings}
					ctx={props.ctx}
					wm={props.wm} />
				<FileManagerModel
					node={props.ctx.node}
					settings={settings}
					ctx={props.ctx}
					wm={props.wm} />
			</React.Fragment>
		</div>)
}
