import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import Slider from '@material-ui/core/Slider'

import GetAppIcon from '@material-ui/icons/GetApp'
import Forward10Icon from '@material-ui/icons/Forward10'
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import PauseIcon from '@material-ui/icons/Pause'
import Replay10Icon from '@material-ui/icons/Replay10'
import PlayArrowIcon from '@material-ui/icons/PlayArrow'
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious'
import SkipNextIcon from '@material-ui/icons/SkipNext'
import VolumeUp from '@material-ui/icons/VolumeUp'
import VolumeOff from '@material-ui/icons/VolumeOff'
import VolumeMute from '@material-ui/icons/VolumeMute'

import { formatDuration, isVideo, nodeURL, setNodeMeta } from '../util'
import { openErrorDialog } from '../dialogs/error'
import { nodeThumb } from '../thumbs'
import { blankVideo, blankAudio } from './blank'
import api from '../api'

const styles = makeStyles((theme) => ({
	videoRoot: {
		position: 'static',
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
		objectPosition: '0% 0%',
		maxWidth: '100%',
		height: '100%',
	},
	videoControls: {
		position: 'absolute',
		zIndex: 5,
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

// Send progress updates only this often in seconds.
const progressUpdateInterval = 20.0

// Jump to next item after this amount of time, in ms.
const nextItemTimeout = 3000

// Send progress update messages only this often, in ms. Should be smaller
// than proressUpdateInterval and nextItemItemout.
const updateInterval = 2000

// Number of seconds to skip when pressing the skip button.
const skipDuration = 10.0


/**
 * PlayableView renders a video or audio and its controls.
 * 
 * @param {Node} props.node - the node to render
 * @param {string} props.authToken - JWT authentication token
 * @param {function} props.onEnded - called when the media has finished
 * @param {function} props.onNextNode - called when the user skipped to the next node
 * @param {function} props.onPrevNode - called when the user skipped to the previous node
 * @param {Window} wnd - window object containing the view
 * @param {WindowManager} props.wm - the window manager
 */
export default function PlayableView(props) {
	const player = React.useRef(null)
	const [hover, setHover] = useState(true)
	const [volume, setVolume] = useState(1.0)
	const [muted, setMuted] = useState(false)
	const [progress, setProgress] = useState(0)
	const [prevUpdate, setPrevUpdate] = useState(-1)
	const [windowSize, setWindowSize] = useState([0, 0])
	const [controlSize, setControlSize] = useState([0, 0])
	const [fullscreen, setFullScreen] = useState(false)
	const [playing, setPlaying] = useState(false) // Not paused
	const [started, setStarted] = useState(false) // Started playing
	const [updateTimeout, setUpdateTimeout] = useState(null)
	const [endTimeout, setEndTimeout] = useState(null)
	const classes = styles()

	React.useEffect(() => {
		const size = [player.current.scrollWidth, player.current.scrollHeight]
		if (size[0] != windowSize[0] || size[1] != windowSize[1]) {
			setWindowSize(size)
			setControlSize([player.current.offsetWidth, player.current.offsetHeight])
		}
	})

	React.useEffect(() => {
		// This is used to prevent the browser from hanging on to the video and its connection.
		props.wm.addCloseHook(props.wnd, (plr) => {

			plr.pause()
			plr.removeAttribute('src'); // empty source
			plr.load()
			//plr.src = isVideo(props.node.mime_type) ? blankVideo : blankAudio
			//plr.load()
		}, player.current)
	}, [])

	React.useEffect(() => {
		console.log("Node changed to:", props.node.id, "was:", props.node.id)

		if (props.node.MetaType === "progress" && props.node.MetaData != null) {
			const pr = props.node.MetaData.Progress
			const v = props.node.MetaData.Volume

			setProgress(pr)
			setVolume(v)
			player.current.currentTime = pr
			player.current.volume = v

			props.wm.setTitle(props.wnd, props.node.name)
		}

		setPlaying(false)
		setStarted(false)
	}, [props.node])

	function updateMeta(progress, volume) {
		setNodeMeta(props.node, progress, volume)

		if (updateTimeout !== null)
			clearTimeout(updateTimeout)

		setUpdateTimeout(setTimeout(() => {
			api.updateMeta(props.node.id, props.node.MetaType, props.node.MetaData,
				props.authToken,
				() => {
					console.log("updateMeta:", progress, "/", props.node.length, volume)
				},
				(error) => { openErrorDialog(props.wm, error) })
		}, updateInterval))
	}

	function onTimeUpdate() {
		if (player.current) {
			const pr = player.current.currentTime
			setProgress(pr)
			if (started === false && (pr <= props.node.length * 0.99)) {
				setStarted(true)
			}

			if (Math.abs(pr - prevUpdate) > progressUpdateInterval) {
				setPrevUpdate(pr)
				updateMeta(pr, volume)
			} else {
				setNodeMeta(props.node, pr, volume)
			}
		}
	}

	function onLoadedMetadata() {
	}

	function onProgressChanged(ev, value) {
		const d = player.current ? player.current.duration : props.node.length
		const new_pr = value / 100.0 * d
		setProgress(new_pr)
		updateMeta(new_pr, volume)

		if (player.current)
			player.current.currentTime = new_pr
	}

	function onVolumeChanged(ev, value) {
		const volume = value / 100.0
		if (player.current) {
			player.current.volume = volume
			setVolume(volume)
		}
		updateMeta(progress, volume)
	}

	function onSeeked(ev) {
		if (player.current) {
			const pr = player.current.currentTime
			setProgress(pr)
			updateMeta(pr, volume)
		}
	}

	function onPlay() {
		setPlaying(true)

		if (player.current) {
			player.current.currentTime = progress
			player.current.volume = volume
		}
	}

	function onPause() {
		setPlaying(false)

		if (player.current) {
			const pr = player.current ? player.current.currentTime : progress
			setProgress(pr)
			updateMeta(pr, volume)
		}
	}

	function onEnded(ev) {
		if (player.current) {
			const pr = player.current.currentTime
			setProgress(pr)
			updateMeta(pr, volume)

			if (pr === player.current.duration && props.onEnded) {
				if (endTimeout !== null)
					clearTimeout(endTimeout)

				if (started) {
					setStarted(false)

					setEndTimeout(setTimeout(() => {
						setEndTimeout(null)

						props.onEnded()
					}, nextItemTimeout))
				}
			}
		}
	}

	function toggleFullscreen() {
		if (player.current) {
			const rf = player.current.webkitRequestFullScreen ||
				player.current.requestsFullScreen ||
				player.current.mozRequestFullScreen ||
				player.current.mozRequestFullScreen

			rf.apply(player.current)
			setFullScreen(!fullscreen)
		}
	}

	function togglePause() {
		setPlaying(prevPlaying => {
			if (prevPlaying)
				player.current.pause()
			else
				player.current.play()
			return !prevPlaying
		})
	}

	function onKeyDown(ev) {
		if(ev.key === ' ')
			togglePause()
	}

	function renderControls(vid) {
		return (
			<div className={vid ? classes.videoControls : classes.audioControls} style={vid ? { width: controlSize[0] } : {}}>
				<Box
					display={hover ? "flex" : "none"}
					flexDirection="row"
					alignItems="center"
					onMouseEnter={() => { setHover(true) }}>
					<Box display="flex" flexDirection="row" alignItems="center" flexGrow={5}>
						<IconButton onClick={props.onPrevNode}><SkipPreviousIcon /></IconButton>
						<IconButton onClick={props.onNextNode}><SkipNextIcon /></IconButton>
						<Button onClick={togglePause}>
							{playing ? <PauseIcon /> : <PlayArrowIcon />}</Button>
						<Button onClick={() => { player.current.currentTime -= skipDuration }}><Replay10Icon /></Button>
						<Button onClick={() => { player.current.currentTime += skipDuration }}><Forward10Icon /></Button>
						<IconButton href={nodeURL(props.node)} download={props.node.name}><GetAppIcon /></IconButton>

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
						src={nodeURL(props.node)}
						poster={nodeThumb(props.node, true)}
						preload="metadata"
						autoPlay={true}
						controls={fullscreen}
						onKeyDown={onKeyDown}
						onMouseEnter={() => { setHover(true) }}
						onMouseLeave={() => { setHover(false) }}
						onDoubleClick={togglePause}
						onContextMenu={(ev) => { ev.preventDefault(); return false }}
						onLoadedMetadata={onLoadedMetadata}
						onTimeUpdate={onTimeUpdate}
						onSeeked={onSeeked}
						onPlay={onPlay}
						onPause={onPause}
						onEnded={onEnded}
						onPlaying={() => { console.log("onPlaying") }} />
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
					onKeyDown={onKeyDown}
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
