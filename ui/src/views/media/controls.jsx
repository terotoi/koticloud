/**
 * controls.jsx - media player controls
 * 
 * @author Tero Oinas
 * @copyright 2021-2023 Tero Oinas
 * @license GPL-3.0 
 * @email oinas.tero@gmail.com
 */
import React from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Slider from '@mui/material/Slider'
import Forward10Icon from '@mui/icons-material/Forward10'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import PauseIcon from '@mui/icons-material/Pause'
import Replay10Icon from '@mui/icons-material/Replay10'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import VolumeUp from '@mui/icons-material/VolumeUp'
import VolumeOff from '@mui/icons-material/VolumeOff'
import VolumeMute from '@mui/icons-material/VolumeMute'
import { NodeNavigationToolbar } from '../nav'
import { formatDuration } from '../../util'

// Number of seconds to skip when pressing the skip button.
const skipDuration = 10.0

const sxs = {
	controls: {
		width: '100%',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		zIndex: 2,
		bottom: 0,
		position: 'fixed'
	},
	duration: {
		marginLeft: 1,
		marginRight: 1,
		color: 'text.primary'
	}
};

/**
 * MediaControls renders controls for video and audio players.
 * 
 * @param {Node} props.node - the node to render
 * @param {number} props.progress - current progress of the media (0.0-1.0)
 * @param {boolean} props.playing - if true, the video is currently is playing
 * @param {boolean} props.visible - whether the controls are visible or not
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
 * @param {state} props.ctx- app context
 * @returns 
 */
export default function MediaControls(props) {
	return (
		<Box
			component="div"
			sx={sxs.controls}>
			<Box
				display={props.visible ? "flex" : "none"}
				flexDirection="row"
				alignItems="center">
				<Box display="flex" flexDirection="row" alignItems="center" flexGrow={5}>
					<NodeNavigationToolbar
						node={props.node}
						onNextNode={props.onNextNode}
						onPrevNode={props.onPrevNode}
						ctx={props.ctx} />

					<IconButton color="primary" onClick={props.onPaused}>
						{props.playing ? <PauseIcon /> : <PlayArrowIcon />}</IconButton>
					<IconButton color="primary" onClick={() => { props.onSkip(-skipDuration) }}><Replay10Icon /></IconButton>
					<IconButton color="primary" onClick={() => { props.onSkip(skipDuration) }}><Forward10Icon /></IconButton>

					<Box component="span" sx={sxs.duration}>{formatDuration(props.progress * props.node.length)}</Box>
					<Slider
						value={props.progress * 100.0}
						onChange={(ev, value) => { props.onProgressChanged(value / 100.0) }}
						aria-labelledby="continuous-slider" />
					<Box component="span" sx={sxs.duration}>{formatDuration(props.node.length)}</Box>
				</Box>
				<Box display="flex" flexDirection="row" alignItems="center" flexGrow={1}>
					<IconButton color="primary"
						onClick={props.onMuted}
					>{props.muted ? <VolumeOff /> : <VolumeMute />}</IconButton>
					<Slider
						value={props.volume * 100.0}
						onChange={(ev, value) => { props.onVolumeChanged(value / 100) }}
						aria-labelledby="continuous-slider" />
					<IconButton color="primary"><VolumeUp /></IconButton>
					{props.fullscreen ? <IconButton color="primary" onClick={props.fullscreen}><FullscreenIcon /></IconButton> : null}
				</Box>
			</Box>
		</Box>)
}

