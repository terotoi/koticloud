import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Box from '@material-ui/core/Box'
import IconButton from '@material-ui/core/IconButton'
import Slider from '@material-ui/core/Slider'

import Forward10Icon from '@material-ui/icons/Forward10'
import FullscreenIcon from '@material-ui/icons/Fullscreen'
import PauseIcon from '@material-ui/icons/Pause'
import Replay10Icon from '@material-ui/icons/Replay10'
import PlayArrowIcon from '@material-ui/icons/PlayArrow'
import ToggleOnIcon from '@material-ui/icons/ToggleOn'
import ToggleOffIcon from '@material-ui/icons/ToggleOff'
import VolumeUp from '@material-ui/icons/VolumeUp'
import VolumeOff from '@material-ui/icons/VolumeOff'
import VolumeMute from '@material-ui/icons/VolumeMute'

import { NodeNavigationToolbar } from '../nav'
import { formatDuration } from '../../util'

// Number of seconds to skip when pressing the skip button.
const skipDuration = 10.0

// Volume change step for hotkeys
const volumeStep = 0.05

// Fast forward and rewind steps
const fastStep = 10.0
const veryFastStep = 30.0

const styles = makeStyles((theme) => ({
	controls: {
		width: '100%',
		backgroundColor: theme.palette.background.default
	},
	duration: {
		marginLeft: theme.spacing(1),
		marginRight: theme.spacing(1)
	}
}))

/**
 * MediaControls renders controls for video and audio players.
 * 
 * @param {Node} props.node - the node to render
 * @param {number} props.progress - current time
 * @param {boolean} props.hidable - if true, hide on hoverout
 * @param {boolean} props.playing - if true, the video is currently is playing
 * @param {function} props.onPaused
 * @param {function} props.onMouseEnter
 * @param {function} props.onMouseLeave
 * @param {function} props.fullscreen - if set, show fullscreen controls
 * @param {function} props.onNextNode - called when the user skipped to the next node
 * @param {function} props.onPrevNode - called when the user skipped to the previous node
 * @param {boolean} props.muted - if true, the media is muted
 * @param {function(boolean)} props.onMuted - called when mute is toggled
 * @param {fuction(number)} props.onSkip - called when user skips forward / backward
 * @param {number} props.volume - current volume
 * @param {function(number)} props.onVolumeChanged - called when user changes the volume
 * @param {state} props.ctx
 * @returns 
 */
export default function MediaControls(props) {
	const classes = styles()
	const [sticky, setSticky] = useState(true)

	React.useEffect(() => {
		document.addEventListener('keydown', onKeyDown)
		document.addEventListener('keypress', onKeyPress)

		return () => {
			document.removeEventListener('keypress', onKeyPress)
			document.removeEventListener('keydown', onKeyDown)
		}
	}, [])

	function onKeyDown(ev) {
		//console.log("onKeyDown:", ev.key)
		var stop = true

		if (ev.key === 'Backspace')
			props.ctx.up(props.node)
		else if (ev.key === 'ArrowLeft')
			props.onProgressChanged(null, -fastStep)
		else if (ev.key === 'ArrowRight')
			props.onProgressChanged(null, fastStep)
		else if (ev.key === 'ArrowDown')
			props.onProgressChanged(null, -veryFastStep)
		else if (ev.key === 'ArrowUp')
			props.onProgressChanged(null, veryFastStep)
		else
			stop = false

		if (stop)
			ev.preventDefault()
	}

	function onKeyPress(ev) {
		//console.log("key:", ev.key)
		var stop = true
		if (ev.key === ' ')
			props.onPaused()

		else if (ev.key === 'm')
			props.onMuted()
		else if (ev.key === '+')
			props.onVolumeChanged(null, volumeStep)
		else if (ev.key === '-')
			props.onVolumeChanged(null, -volumeStep)
		else
			stop = false

		if (stop)
			ev.preventDefault()
	}

	return (
		<div className={classes.controls}>
			<Box
				display={(props.visible || sticky) ? "flex" : "none"}
				flexDirection="row"
				alignItems="center"
				onMouseEnter={props.hidable ? props.onMouseEnter : null}
				onMouseLeave={props.hidable ? props.onMouseLeave : null}>
				<Box display="flex" flexDirection="row" alignItems="center" flexGrow={5}>
					<NodeNavigationToolbar
						node={props.node}
						onNextNode={props.onNextNode}
						onPrevNode={props.onPrevNode}
						ctx={props.ctx} />

					{props.hidable ?
						<IconButton onClick={() => { setSticky(!sticky) }}>
							{sticky ? <ToggleOnIcon /> : <ToggleOffIcon />}
						</IconButton> : null}

					<IconButton onClick={(ev) => { ev.stopPropagation(); props.onPaused }}>
						{props.playing ? <PauseIcon /> : <PlayArrowIcon />}</IconButton>
					<IconButton onClick={() => { props.onSkip(-skipDuration) }}><Replay10Icon /></IconButton>
					<IconButton onClick={() => { props.onSkip(skipDuration) }}><Forward10Icon /></IconButton>

					<span className={classes.duration}>
						{props.progress ? formatDuration(props.progress) : null}</span>
					<Slider
						value={props.progress * 100.0 / props.duration}
						onChange={(ev, value) => { props.onProgressChanged(value / 100.0 * props.node.length) }}
						aria-labelledby="continuous-slider" />
					<span className={classes.duration}>{props.node.length ? formatDuration(props.node.length) : null}</span>
				</Box>
				<Box display="flex" flexDirection="row" alignItems="center" flexGrow={1}>
					<IconButton
						onClick={props.onMuted}
					>{props.muted ? <VolumeOff /> : <VolumeMute />}</IconButton>
					<Slider
						value={props.volume * 100.0}
						onChange={(ev, value) => { props.onVolumeChanged(value / 100) }}
						aria-labelledby="continuous-slider" />
					<IconButton disabled><VolumeUp /></IconButton>
					{props.fullscreen ? <IconButton onClick={props.fullscreen}><FullscreenIcon /></IconButton> : null}
				</Box>
			</Box>
		</div>)
}

