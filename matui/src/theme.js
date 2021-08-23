import { createTheme } from '@material-ui/core/styles'

/** Application theme */
const theme = createTheme({
	spacing: 6,

	palette: {
		type: 'dark',
		primary: {
			main: '#272c34'
		},
		secondary: {
			main: '#C1B685'
		},
		text: {
			primary: '#f0f0f0',
			secondary: '#a0a0a0'
		},
		background: {
			default: '#181818',
			paper: '#525252'
		},
		tonalOffset: 0.0,
		contrastThreshold: 3
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
	}
})

// Theme colors:
//   #272c34 (primary), 181818 (background),
//   #97A388 (directories), #C1B685 (files)

export default theme
