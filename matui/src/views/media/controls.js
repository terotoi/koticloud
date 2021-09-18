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

					<IconButton onClick={props.onPaused}>
						{props.playing ? <PauseIcon /> : <PlayArrowIcon />}</IconButton>
					<IconButton onClick={() => { props.onSkip(-skipDuration) }}><Replay10Icon /></IconButton>
					<IconButton onClick={() => { props.onSkip(skipDuration) }}><Forward10Icon /></IconButton>

					<span className={classes.duration}>
						{props.progress ? formatDuration(props.progress) : null}</span>
					<Slider
						value={props.progress * 100.0 / props.duration}
						onChange={props.onProgressChanged}
						aria-labelledby="continuous-slider" />
					<span className={classes.duration}>{props.node.length ? formatDuration(props.node.length) : null}</span>
				</Box>
				<Box display="flex" flexDirection="row" alignItems="center" flexGrow={1}>
					<IconButton
						onClick={props.onMuted}
					>{props.muted ? <VolumeOff /> : <VolumeMute />}</IconButton>
					<Slider
						value={props.volume * 100.0}
						onChange={props.onVolumeChanged}
						aria-labelledby="continuous-slider" />
					<IconButton disabled><VolumeUp /></IconButton>
					{props.fullscreen ? <IconButton onClick={props.fullscreen}><FullscreenIcon /></IconButton> : null}
				</Box>
			</Box>
		</div>)
}

