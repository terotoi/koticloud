/**
 * appbar.js - the application bar
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React from 'react'
import AppBar from '@mui/material/AppBar'
import AccountCircle from '@mui/icons-material/AccountCircle'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MenuIcon from '@mui/icons-material/Menu'
import TextField from '@mui/material/TextField'
import AboutDialog from '../dialogs/about'
import { openAlertDialog } from '../dialogs/alert'
import { openErrorDialog } from '../dialogs/error'
import { openPasswordDialog } from '../dialogs/password'
import api from '../api'

// Minimum number of characters
const minSearchLength = 3
const searchInterval = 1000

/**
 * MyAppBar is the application main bar. To be overhauled later.
 * 
 * @param {function} props.onTitleClicked - called when user clicks the main title
 * @param {function} props.onLogout - called when the user logs out
 * @param {[Node...]} props.onSearchResults - called when user typed in a search and the results are in
 * @param {Object} props.settings - user's settings
 * @param {state} props.ctx
 * @param {WindowManager} props.wm
*/
export default function MyAppBar(props) {
	const [mainMenuAnchor, setMainMenuAnchor] = React.useState(null)
	const [accountMenuAnchor, setAccountMenuAnchor] = React.useState(null)
	const [aboutOpen, setAboutOpen] = React.useState(false)
	const [searchCall, setSearchCall] = React.useState(null)

	function onSearchChanged(ev) {
		const txt = ev.target.value

		if (searchCall !== null)
			window.clearTimeout(searchCall)

		if (txt.length === 0)
			props.onSearchResults(null)
		else if (txt.length >= minSearchLength) {
			setSearchCall(window.setTimeout(() => {
				setSearchCall(null)
				api.searchNodes(txt, props.ctx.authToken, (r) => {
					props.onSearchResults(r)
				},
					(error) => { openErrorDialog(props.wm, error) })
			}, searchInterval))
		}
	}

	function onChangePassword() {
		function onPasswordConfirm(oldPasswd, newPasswd) {
			api.setPassword("", oldPasswd, newPasswd, props.ctx.authToken,
				() => {
					openAlertDialog(props.wm, {
						text: "Password changed."
					})
				},
				(error) => { openErrorDialog(props.wm, error) })
		}

		openPasswordDialog(props.wm, {
			text: 'Change your password.',
			onConfirm: onPasswordConfirm
		})
	}

	return (
		<React.Fragment>
			<AppBar position="static" sx={{ backgroundColor: 'brand.main' }}>
				<Toolbar>
					<IconButton
						edge="start"
						aria-label="open menu"
						sx={{ color: "primary.main" }}
						onClick={(ev) => { setMainMenuAnchor(ev.currentTarget) }}>
						<MenuIcon />
					</IconButton>
					<Link color="background.default" sx={{ color: 'primary.main', flexGrow: 4, marginLeft: 2 }} variant="h4" href="/">KotiCloud</Link>

					<TextField id="search_field" label="Search" variant="standard" size="small" onChange={onSearchChanged} />
					
					<IconButton color="primary"
						onClick={(ev) => setAccountMenuAnchor(ev.currentTarget)}>
						<AccountCircle />
					</IconButton>

					{/** Main menu **/}
					{mainMenuAnchor === null ? null :
						<Menu
							anchorEl={mainMenuAnchor} open={true}
							onClose={() => setMainMenuAnchor(null)}>

							<MenuItem
								onClick={() => {
									setAboutOpen(true)
									setMainMenuAnchor(null)
								}}>About
							</MenuItem>
						</Menu>}

					{/** Account menu **/}
					{accountMenuAnchor === null ? null :
						<Menu
							anchorEl={accountMenuAnchor}
							open={true}
							onClose={() => setAccountMenuAnchor(null)}>

							<MenuItem>{props.ctx.username ? "Username: " + props.ctx.username : "Not logged in"}</MenuItem>

							<MenuItem onClick={onChangePassword}>Change password</MenuItem>

							{props.ctx.isAdmin ?
								<MenuItem disabled>Manage users</MenuItem> : null}

							<MenuItem onClick={() => {
								setAccountMenuAnchor(null)
								props.onLogout()
							}}>Logout</MenuItem>
						</Menu>}
				</Toolbar>
			</AppBar>

			{
				aboutOpen ?
					<AboutDialog
						onClose={() => setAboutOpen(false)} /> : null
			}
		</React.Fragment>
	)
}

