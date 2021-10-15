import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { isAudio, nodeURL } from '../../util'
import { openErrorDialog } from '../../dialogs/error'
import { nodeThumb } from '../../thumbs'
import MediaControls from './controls'
import api from '../../api'

const styles = makeStyles((theme) => ({
	root: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-end',
		alignItems: 'center',
		height: '100vh',
		margin: 0,
		padding: 0
	},
	video: {
		outline: 'none',
		objectFit: 'contain',
		margin: 0,

		objectPosition: '50% 50%',
		maxWidth: '100%',
		minHeight: '32px',
		height: '100%',
	},
	audio: {
		marginTop: '4em'
	},
	controls: {
		width: '100%',
		backgroundColor: theme.palette.background.default
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

// Number of ms before non-sticky controls are hidden.
const hoverOutDelay = 2000

/**
 * VideoViews renders a video with controls.
 * 
 * @param {Node} props.node - the node to render
 * @param {function} props.onEnded - called when the media has finished
 * @param {function} props.onNextNode - called when the user skipped to the next node
 * @param {function} props.onPrevNode - called when the user skipped to the previous node
 * @param {state} props.ctx
 * @param {Window} wnd - window object containing the view
 * @param {WindowManager} props.wm - the window manager
 */
export default function VideoView(props) {
	const player = React.useRef(null)
	const [nodeIsAudio, setNodeIsAudio] = useState(true)
	const [volume, setVolume] = useState(props.ctx.settings.volume)
	const [muted, setMuted] = useState(false)
	const [progress, setProgress] = useState(0)
	const [prevUpdate, setPrevUpdate] = useState(-1)
	const [fullscreen, setFullScreen] = useState(false)
	const [playing, setPlaying] = useState(false) // Not paused
	const [started, setStarted] = useState(false) // Started playing
	const [updateTimeout, setUpdateTimeout] = useState(null)
	const [endTimeout, setEndTimeout] = useState(null)
	const [hover, setHover] = useState(true)
	const [hoverTimeout, setHoverTimeout] = useState(null)
	const classes = styles()

	React.useEffect(() => {
		const pr = props.node.progress || 0
		const v = (props.node.volume !== undefined && props.node.volume !== null) ?
			Math.min(props.node.volume, 1.0) : props.ctx.settings.volume

		setNodeIsAudio(isAudio(props.node.mime_type))

		setProgress(pr)
		setVolume(v)
		player.current.currentTime = pr
		player.current.volume = v
		setPlaying(false)
		setStarted(false)

		window.scrollTo(0, document.body.scrollHeight)

	}, [props.node])

	React.useEffect(() => {
		return () => {
			if (updateTimeout !== null)
				clearTimeout(updateTimeout)

			if (player.current !== null) {
				//player.current.src = ""
				player.current = null
			}
		}
	}, [])

	function updateProgress(progress, volume) {
		if (updateTimeout !== null)
			clearTimeout(updateTimeout)

		setUpdateTimeout(setTimeout(() => {
			if (player.current)
				api.updateProgress(props.node.id, progress, volume,
					props.ctx.authToken,
					() => {
						//console.log("Update progress:", progress, "/", props.node.length, volume)
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
				updateProgress(pr, volume)
			} else {
				props.node.progress = pr
				props.node.volume = volume
			}
		}
	}

	function onProgressChanged(ev, value) {
		const d = player.current ? player.current.duration : props.node.length
		const new_pr = value / 100.0 * d
		setProgress(new_pr)
		updateProgress(new_pr, volume)

		if (player.current)
			player.current.currentTime = new_pr
	}

	function onVolumeChanged(value, diff) {
		var vol = value
		if (value === null) {
			setVolume((oldVol) => { vol = Math.max(Math.min(oldVol + diff, 1.0), 0.0); return vol })
		} else {
			vol = value
			setVolume(vol)
		}

		if (player.current) {
			player.current.volume = vol
			props.ctx.setVolume(vol)
		}
		updateProgress(progress, vol)
	}

	function onSeeked(ev) {
		if (player.current) {
			const pr = player.current.currentTime
			setProgress(pr)
			updateProgress(pr, volume)
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
			updateProgress(pr, volume)
		}
	}

	function onEnded(ev) {
		if (player.current) {
			const pr = player.current.currentTime
			setProgress(pr)
			updateProgress(pr, volume)

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

	const onMouseEnter = () => {
		if (hoverTimeout !== null)
			clearTimeout(hoverTimeout)
		setHover(true)
	}

	const onMouseLeave = () => {
		if (hoverTimeout !== null)
			clearTimeout(hoverTimeout)
		setHoverTimeout(setTimeout(() => { setHover(false) }, hoverOutDelay))
	}
	
	function renderVideo() {
		return (
			<video
				className={classes.video}
				ref={(r) => { player.current = r }}
				src={nodeURL(props.node)}
				poster={nodeThumb(props.node, true)}
				preload="metadata"
				autoPlay={true}
				controls={fullscreen}
				muted={muted}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				onClick={togglePause}
				onTimeUpdate={onTimeUpdate}
				onSeeked={onSeeked}
				onPlay={onPlay}
				onPause={onPause}
				onEnded={onEnded}
				onPlaying={() => { console.log("onPlaying") }} />)
	}

	function renderAudio() {
		return (
			<audio
				className={classes.audio}
				ref={(r) => { player.current = r }}
				src={nodeURL(props.node)}
				poster={nodeThumb(props.node, true)}
				preload="metadata"
				autoPlay={true}
				controls={fullscreen}
				muted={muted}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				onClick={togglePause}
				onTimeUpdate={onTimeUpdate}
				onSeeked={onSeeked}
				onPlay={onPlay}
				onPause={onPause}
				onEnded={onEnded}
				onPlaying={() => { console.log("onPlaying") }} />)
	}


	return (
		<div className={classes.root}>
			{nodeIsAudio ? renderAudio() : renderVideo()}

			{(player.current === null) ? null :
				<MediaControls
					node={props.node}
					progress={progress}
					onProgressChanged={onProgressChanged}
					duration={player.current ? player.current.duration : 0}
					hidable={!nodeIsAudio}
					visible={hover}
					playing={playing}
					onPaused={togglePause}
					fullscreen={toggleFullscreen}
					onNextNode={props.onNextNode}
					onPrevNode={props.onPrevNode}
					onSkip={(d) => { player.current.currentTime += d }}
					muted={muted}
					onMuted={() => {
						setMuted(m => {
							return !m
						})
					}}
					volume={volume}
					onVolumeChanged={onVolumeChanged}
					ctx={props.ctx} />}
		</div>
	)
}

