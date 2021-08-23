
import React from 'react'
import { alpha, makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import AccountCircle from '@material-ui/icons/AccountCircle'
import Toolbar from '@material-ui/core/Toolbar'
import IconButton from '@material-ui/core/IconButton'
import InputBase from '@material-ui/core/InputBase'
import Link from '@material-ui/core/Link'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import MenuIcon from '@material-ui/icons/Menu'
import SearchIcon from '@material-ui/icons/Search'
import AboutDialog from './dialogs/about'
import { openAlertDialog } from './dialogs/alert'
import { openErrorDialog } from './dialogs/error'
import { openPasswordDialog } from './dialogs/password'
import FileManager from './fm/filemanager'
import api from './api'

// Minimum number of characters
const minSearchLength = 3
const searchInterval = 1000

const useStyles = makeStyles((theme) => ({
	root: {
		flexGrow: 0,
		marginBottom: theme.spacing(1),
	},
	menuButton: {
		marginRight: theme.spacing(2),
	},
	title: {
		flexGrow: 4
	},
	search: {
		position: 'relative',
		borderRadius: theme.shape.borderRadius,
		backgroundColor: alpha(theme.palette.common.white, 0.15),
		'&:hover': {
			backgroundColor: alpha(theme.palette.common.white, 0.25),
		},
		marginLeft: 0,
		flexGrow: 1,
		marginLeft: theme.spacing(1)
	},
	searchIcon: {
		padding: theme.spacing(0, 2),
		height: '100%',
		position: 'absolute',
		pointerEvents: 'none',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	inputRoot: {
		color: 'inherit',
	},
	inputInput: {
		padding: theme.spacing(1, 1, 1, 0),
		// vertical padding + font size from searchIcon
		paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
		transition: theme.transitions.create('width'),
		width: '100%',
		[theme.breakpoints.up('sm')]: {
			width: '12ch',
			'&:focus': {
				width: '20ch',
			},
		},
	},
}))

/**
 * MyAppBar is the application main bar. To be overhauled later.
 * 
 * @param {string} props.username - name of the user logged in
 * @param {bool} props.isAdmin - true if the user is an administrator
 * @param {function} props.onTitleClicked - called when user clicks the main title
 * @param {function} props.onLogout - called when the user logs out
 * @param {[Node...]} props.onSearchResults - called when user typed in a search
 *    and the results are in
 * @param {string} props.homeNodeID - ID of the node users home directory
 * @param {string} props.authToken - JWT authentication token
 * @param {Object} props.settings - user's settings
 * @param {state} props.ctx
 * @param {WindowManager} props.wm
*/
export default function MyAppBar(props) {
	const classes = useStyles()
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
				api.searchNodes(txt, props.authToken, (r) => {
					props.onSearchResults(r)
				},
					(error) => { openErrorDialog(props.wm, error) })
			}, searchInterval))
		}
	}

	function onChangePassword() {
		function onPasswordConfirm(oldPasswd, newPasswd) {
			api.setPassword("", oldPasswd, newPasswd, props.authToken,
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
		<div className={classes.root}>
			<AppBar position="static">
				<Toolbar variant="dense">
					<IconButton
						edge="start"
						className={classes.menuButton}
						color="inherit"
						aria-label="open menu"
						onClick={(ev) => { setMainMenuAnchor(ev.currentTarget) }}>
						<MenuIcon />
					</IconButton>
					<Link color="inherit" className={classes.title} variant="h4" href="#" target="_blank">KotiCloud</Link>

					<div className={classes.search}>
						<div className={classes.searchIcon}>
							<SearchIcon />
						</div>
						<InputBase
							onChange={onSearchChanged}
							placeholder="Search…"
							classes={{
								root: classes.inputRoot,
								input: classes.inputInput,
							}}
							inputProps={{ 'aria-label': 'search' }}
						/>
					</div>

					<IconButton
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
							<MenuItem
								onClick={() => {
									setMainMenuAnchor(null)

									props.wm.openWindow("File manager",
										<FileManager
											initialNodeID={props.homeNodeID}
											authToken={props.authToken}
											settings={props.settings}
											ctx={props.ctx}
											wm={props.wm} />, false)
								}}>New file manager
							</MenuItem>
						</Menu>}

					{/** Account menu **/}
					{accountMenuAnchor === null ? null :
						<Menu
							anchorEl={accountMenuAnchor}
							open={true}
							onClose={() => setAccountMenuAnchor(null)}>

							<MenuItem>{props.username ? "Username: " + props.username : "Not logged in"}</MenuItem>

							<MenuItem onClick={onChangePassword}>Change password</MenuItem>

							{props.isAdmin ?
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
		</div >
	)
}

