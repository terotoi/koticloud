/**
 * theme.jsx - application theme
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import { createTheme } from '@mui/material/styles';

const primary = '#dbdbdb'
const primaryDark = '#a0a0a0'
const contrast = '#101010'
const secondary = '#c1b685'
const brand = '#272c34'
const text = '#e8e8e8'
const textDark = '#a8a8a8'

const theme = createTheme({
	spacing: 6,

	palette: {
		type: 'dark',
		primary: {
			main: primary,
			dark: primaryDark
		},
		secondary: {
			main: secondary
		},
		text: {
			primary: text,
			secondary: textDark,
			contrast: contrast
		},
		background: {
			default: '#202020',
			paper: '#525252'
		},
		tonalOffset: 0.0,
		contrastThreshold: 3,
		brand: {
			main: brand
		},
		action: {
			disabled: primaryDark
		}
	},
	typography: {
		fontSize: 14
	},
	overrides: {
		MUIRichTextEditor: {
			root: {
				marginTop: '1em',
				flexGrow: 1,
				border: '1px solid #525252'
			},
			editor: {
				fontFamily: 'monospace',
				fontSize: '12pt',
				margin: '1em',
				minHeight: '16em',
				height: 'auto'
			}
		}
	},
	//spacing: [0, 6, 12, 5, 8]
});

spacing: [0, 2, 3, 5, 8],

console.log(theme.spacing())

export default theme;
