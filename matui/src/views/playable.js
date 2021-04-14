import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import Slider from '@material-ui/core/Slider'

import Forward10Icon from '@material-ui/icons/Forward10'
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import PauseIcon from '@material-ui/icons/Pause'
import Replay10Icon from '@material-ui/icons/Replay10'
import PlayArrowIcon from '@material-ui/icons/PlayArrow'
import VolumeUp from '@material-ui/icons/VolumeUp'
import VolumeOff from '@material-ui/icons/VolumeOff'
import VolumeMute from '@material-ui/icons/VolumeMute'

import { formatDuration, isVideo, nodeURL, setMetaProgress } from '../util'
import { openErrorDialog } from '../dialogs/error'
import GlobalContext from '../context'
import { nodeThumb } from '../thumbs'
import api from '../api'

const progressUpdateInterval = 20.0
const skipDuration = 10.0

const styles = makeStyles((theme) => ({
	videoRoot: {
		position: 'fixed',
		left: 0,
		top: 0,
		height: '100%',
	},
	videoCont: {
		margin: 0,
		padding: 0,
		maxWidth: '100%',
		height: '100%',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-end'
	},
	video: {
		outline: 'none',
		objectFit: 'contain',
		margin: 0,

		// For left-aligning content
		objectPosition: '0% 50%',
		maxWidth: '100%',
		height: '100%',
	},
	videoControls: {
		position: 'fixed',
		zIndex: 10,
		backgroundColor: theme.palette.background.default,
	},
	audioCont: {
		marginTop: '4rem',
	},
	audioControls: {
		width: '100%'
	},
	duration: {
		marginLeft: theme.spacing(1),
		marginRight: theme.spacing(1)
	}
}))


/**
 * PlayableView renders a video or audio and its controls.
 * 
 * @param {Node} props.node - the node to render
 * @param {string} props.authToken - JWT authentication token
 * @param {function} props.onEnded - called when the media has finished
 */
export default function PlayableView(props) {
	const classes = styles()

	const player = React.useRef(null)
	const [playing, setPlaying] = React.useState(true)
	const [hover, setHover] = React.useState(true)
	const [volume, setVolume] = React.useState(1.0)
	const [muted, setMuted] = React.useState(false)
	const [progress, setProgress] = React.useState(0)
	const [prevUpdate, setPrevUpdate] = React.useState(-1)
	const [playerSize, setPlayerSize] = React.useState([0, 0])
	const [fullscreen, setFullScreen] = React.useState(false)
	const [loaded, setLoaded] = React.useState(false)
	const context = React.useContext(GlobalContext)

	React.useEffect(() => {
		const [w, h] = [player.current.offsetWidth, player.current.offsetHeight]
		if (w != playerSize[0] || h != playerSize[1]) {
			setPlayerSize([player.current.offsetWidth, player.current.offsetHeight])
		}
	})

	// Unmount
	React.useEffect(() => {
		return () => {
			player.current = null
		}
	}, [])

	React.useEffect(() => {
		setLoaded(false)
	}, [props.node])

	function updateProgress() {
		if (!loaded)
			return
		setMetaProgress(props.node, player.current.currentTime, player.current.volume)

		api.updateMeta(props.node.id, props.node.MetaType, props.node.MetaData,
			props.authToken,
			() => {
				console.log("updateProgress OK", player.current.currentTime, player.current.volume)
			},
			(error) => { openErrorDialog(context, error) })
	}

	function onTimeUpdate() {
		if (!loaded)
			return
		setProgress(player.current.currentTime)

		if (Math.abs(player.current.currentTime - prevUpdate) > progressUpdateInterval) {
			setPrevUpdate(player.current.currentTime)
			updateProgress()
		} else {
			setMetaProgress(props.node, player.current.currentTime, player.current.volume)
		}
	}

	function onLoadedMetadata() {
		if (props.node.MetaType === "progress" && props.node.MetaData != null) {
			player.current.currentTime = props.node.MetaData.Progress
			player.current.volume = props.node.MetaData.Volume
		} else {
			player.current.currentTime = 0
			player.current.volume = 1.0
		}

		setProgress(player.current.currentTime)
		setVolume(player.current.volume)
		setLoaded(true)
	}

	function onProgressChanged(ev, value) {
		if (player.current && loaded) {
			const progress = value / 100.0 * player.current.duration
			player.current.currentTime = progress
			setProgress(progress)
			updateProgress()
		}
	}

	function onVolumeChanged(ev, value) {
		const volume = value / 100.0
		player.current.volume = volume
		setVolume(volume)
		updateProgress()
	}

	function onSeeked(ev) {
		if (loaded) {
			const t = player.current.currentTime
			updateProgress()
		}
	}

	function onPlay() {
		if (loaded)
			setPlaying(true)
	}

	function onPause() {
		setPlaying(false)
		updateProgress()
	}

	function onEnded(ev) {
		if (loaded) {
			console.log("onEnded")
			setPlaying(false)
			updateProgress()
		}
	}

	function toggleFullscreen() {
		const rf = player.current.webkitRequestFullScreen ||
			player.current.requestsFullScreen ||
			player.current.mozRequestFullScreen ||
			player.current.mozRequestFullScreen

		rf.apply(player.current)
		setFullScreen(!fullscreen)
	}

	function renderControls(vid) {
		return (
			<div className={vid ? classes.videoControls : classes.audioControls} style={vid ? { width: playerSize[0] } : {}}>
				<Box
					display={hover ? "flex" : "none"}
					flexDirection="row"
					alignItems="center"
					onMouseEnter={() => { setHover(true) }}>
					<Box display="flex" flexDirection="row" alignItems="center" flexGrow={5}>
						<Button onClick={() => { if (playing) player.current.pause(); else player.current.play() }}>
							{playing ? <PauseIcon /> : <PlayArrowIcon />}</Button>
						<Button onClick={() => { player.current.currentTime -= skipDuration }}><Replay10Icon /></Button>
						<Button onClick={() => { player.current.currentTime += skipDuration }}><Forward10Icon /></Button>
						<span className={classes.duration}>{player.current ? formatDuration(player.current.currentTime) : null}</span>
						<Slider
							value={progress * 100.0 / player.current.duration}
							onChange={onProgressChanged}
							aria-labelledby="continuous-slider" />
						<span className={classes.duration}>{props.node.length ? formatDuration(props.node.length) : null}</span>
					</Box>
					<Box display="flex" flexDirection="row" alignItems="center" flexGrow={1}>
						<IconButton
							onClick={() => { setMuted(!muted); player.current.muted = !muted }}
						>{muted ? <VolumeOff /> : <VolumeMute />}</IconButton>
						<Slider
							value={volume * 100.0}
							onChange={onVolumeChanged}
							aria-labelledby="continuous-slider" />
						<IconButton disabled><VolumeUp /></IconButton>
						{vid ? <IconButton onClick={toggleFullscreen}><FullscreenIcon /></IconButton> : null}
					</Box>
				</Box>
			</div>)
	}

	function renderVideo() {
		return (
			<div className={classes.videoRoot}>
				<div className={classes.videoCont}>
					<video
						className={classes.video}
						ref={(r) => { player.current = r }}
						src={nodeThumb(props.node)}
						poster={"/node/thumb/" + props.node.id}
						preload="metadata"
						autoPlay={playing}
						controls={fullscreen}
						onMouseEnter={() => { setHover(true) }}
						onMouseLeave={() => { setHover(false) }}
						onClick={() => { if (playing) player.current.pause(); else player.current.play() }}
						onContextMenu={(ev) => { ev.preventDefault(); return false }}
						onLoadedMetadata={onLoadedMetadata}
						onTimeUpdate={onTimeUpdate}
						onSeeked={onSeeked}
						onPlay={onPlay}
						onPause={onPause}
						onEnded={onEnded} />
					{(player.current === null) ? null : renderControls(true)}
				</div>
			</div>
		)
	}

	function renderAudio() {
		return (
			<div className={classes.audioCont}>
				<audio
					className={classes.audio}
					ref={(r) => { player.current = r }}
					src={nodeURL(props.node)}
					preload="metadata"
					controls={false}
					autoPlay={true}
					onDragStart={(ev) => { ev.preventDefault(); return false }}
					onLoadedMetadata={onLoadedMetadata}
					onTimeUpdate={onTimeUpdate}
					onSeeked={onSeeked}
					onPlay={onPlay}
					onPause={onPause}
					onEnded={onEnded} />
				<Box display="flex" flexDirection="row" flexGrow="1">
					{(player.current === null) ? null : renderControls(false)}
				</Box>
			</div>
		)
	}

	return isVideo(props.node.mime_type) ? renderVideo() : renderAudio()
}
