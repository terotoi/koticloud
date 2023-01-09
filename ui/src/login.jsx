/**
 * login.jsx - login view
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React from 'react'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

const sxs = {
	paper: {
		marginTop: 6,
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center'
	}
};

/**
 * LoginView
 * 
 * @param {function} props.onSubmit - called on form submit with username and password 
 */
export default function LoginView(props) {
	const [username, setUsername] = React.useState('')
	const [password, setPassword] = React.useState('')

	return (
		<Container component="main" maxWidth="xs">
			<CssBaseline />
			<Box component="div" sx={sxs.paper}>
				<img src="/icons/ui/cloud.svg" />
				<Typography component="h1" variant="h3">
					KotiCloud
				</Typography>

				<Typography component="h2" variant="h5">
					Log in
				</Typography>
				<form style={{ marginTop: '1rem' }} noValidate>
					<TextField
						variant="outlined"
						margin="normal"
						required
						fullWidth
						id="username"
						label="Username"
						name="koticloud_username"
						autoFocus
						onChange={(ev) => setUsername(ev.target.value)} />
					<TextField
						variant="outlined"
						margin="normal"
						required
						fullWidth
						name="koticloud_password"
						label="Password"
						type="password"
						id="password"
						autoComplete="current-password"
						onChange={(ev) => setPassword(ev.target.value)} />
					<Button
						fullWidth
						variant="contained"
						color="secondary"
						sx={{
							marginTop: 3
						}}
						onClick={() => props.onSubmit(username, password)}>
						Log in
					</Button>
				</form>
			</Box>
			<Box mt={8}>
				<CopyrightBanner />
			</Box>
		</Container>
	)
}

/** Copyright banner under the login form. */
function CopyrightBanner() {
	return (
		<Typography variant="body2" color="textSecondary" align="center">
			Copyright © 2020-2022
			{' '}
			<Link color="inherit" href="https://github.com/terotoi/">
				Tero Oinas
			</Link>
		</Typography>
	)
}
