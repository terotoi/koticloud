import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Container from '@material-ui/core/Container'
import CssBaseline from '@material-ui/core/CssBaseline'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Link from '@material-ui/core/Link'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'

const useStyles = makeStyles((theme) => ({
	paper: {
		marginTop: theme.spacing(6),
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center'
	},
	avatar: {
		margin: theme.spacing(1),
		backgroundColor: theme.palette.secondary.main
	},
	form: {
		marginTop: theme.spacing(1),
	},
	submit: {
		margin: theme.spacing(3, 0, 0),
	},
}))

/**
 * LoginView
 * 
 * @param {function} props.onSubmit - called on form submit with username and password 
 */
export default function LoginView(props) {
	const classes = useStyles()

	const [username, setUsername] = React.useState('')
	const [password, setPassword] = React.useState('')

	return (
		<Container component="main" maxWidth="xs">
			<CssBaseline />
			<div className={classes.paper}>
				<img src="/icons/ui/cloud.svg"/>
				<Typography component="h1" variant="h3">
					KotiCloud
				</Typography>

				<Typography component="h2" variant="h5">
					Log in
       	</Typography>
				<form className={classes.form} noValidate>
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
						color="primary"
						className={classes.submit}
						onClick={() => props.onSubmit(username, password)}>
						Log in
			    </Button>
				</form>
			</div>
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
			Copyright © 2020-2021
			{' '}
			<Link color="inherit" href="https://github.com/terotoi/">
				Tero Oinas
		    </Link>
		</Typography>
	)
}
