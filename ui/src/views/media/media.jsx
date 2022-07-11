import React, { useState, useRef, useEffect } from 'react'
import { makeStyles } from '@mui/styles'
import { isAudio, nodeURL } from '../../util'
import { openErrorDialog } from '../../dialogs/error'
import MediaControls from './controls'
import api from '../../api'

const styles = makeStyles((theme) => ({
	root: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		display: 'flex',
		flexDirection: 'column'
	},
	video: {
		outline: 'none',
		height: '100%',
		objectFit: 'contain',
		background: theme.palette.background.default
	},
	audio: {
		marginTop: '4em'
	},
	duration: {
		marginLeft: theme.spacing(1),
		marginRight: theme.spacing(1)
	}
}))

// Send progress updates only this often in milliseconds
const progressUpdateInterval = 5000

// Jump to next item after this amount of time, in ms.
const nextItemTimeout = 3000

// Number of ms before controls are hidden.
const hoverOutDelay = 1500

// Volume change step for hotkeys
const volumeStep = 0.05

// Fast forward and rewind steps
const fastStep = 10.0
const veryFastStep = 30.0


/**
 * MediaView renders a video or audio file with controls.
 * 
 * @param {Node} props.node - the node to render
 * @param {function} props.onEnded - called when the media has finished
 * @param {function} props.onNextNode - called when the user skipped to the next node
 * @param {function} props.onPrevNode - called when the user skipped to the previous node
 * @param {state} props.ctx
 * @param {Window} wnd - window object containing the view
 * @param {WindowManager} props.wm - the window manager
 */
export default function MediaView(props) {
	const root = useRef(null)
	const player = useRef(null)
	const updateTimeout = useRef(null)
	const endTimeout = useRef(null)
	const hoverTimeout = useRef(null)
	const [volume, setVolume] = useState(props.ctx.settings.volume)
	const [muted, setMuted] = useState(false)
	const [progress, setProgress] = useState(0)
	const [prevUpdate, setPrevUpdate] = useState(new Date())
	const [fullscreen, setFullScreen] = useState(false)
	const [playing, setPlaying] = useState(false) // Not paused
	const [started, setStarted] = useState(false) // Started playing
	const [hover, setHover] = useState(true)
	const classes = styles()

	React.useEffect(() => {
		const pr = (props.node.progress > 1.0) ? (props.node.progress / props.node.length) : (props.node.progress || 0)
		const prl = (pr != 1.0) ? pr : 0.0;
		const v = (props.node.volume !== undefined && props.node.volume !== null) ?
			Math.min(props.node.volume, 1.0) : props.ctx.settings.volume

		console.log("progress: " + pr + " volume: " + v)
		setProgress(prl)
		setVolume(v)
		player.current.currentTime = prl
		player.current.volume = v
		setPlaying(false)
		setStarted(false)

		window.scrollTo(0, document.body.scrollHeight)

	}, [props.node])

	// Clean up the player. Cancel all timeouts.
	React.useEffect(() => {
		return () => {
			if (updateTimeout.current !== null)
				clearTimeout(updateTimeout.current)

			if (endTimeout.current !== null)
				clearTimeout(endTimeout.current)

			if (hoverTimeout.current !== null)
				clearTimeout(hoverTimeout.current)

			if (player.current !== null) {
				player.current = null
			}
		}
	}, [])

	useEffect(() => {
		root.current.focus()
	})

	const callUpdateProgress = (progress, volume) => {
		props.node.progres = progress
		props.node.volume = volume

		api.updateProgress(props.node.id, progress, volume,
			props.ctx.authToken,
			() => {
				console.log("Update progress:", progress, volume)
			},
			(error) => { openErrorDialog(props.wm, error) })
	}

	function onTimeUpdate() {
		if (player.current) {
			const pr = player.current.currentTime / player.current.duration
			if (started === false && (pr <= 0.99)) {
				setStarted(true)
			}

			if (started) {
				setProgress(pr)
			}

			props.node.progress = pr
			props.node.volume = volume

			const now = new Date()
			if ((now - prevUpdate) > progressUpdateInterval) {
				setPrevUpdate(now)
				callUpdateProgress(progress, volume)
			}
		}
	}

	function onProgressChanged(pr) {
		console.log("onProgressChanged", pr)
		setProgress(pr)

		if (pr == 0.0 || pr == 1.0)
			callUpdateProgress(pr, volume)

		if (player.current)
			player.current.currentTime = pr * player.current.duration
	}

	function onVolumeChanged(value, diff) {
		if (value === null) {
			setVolume((oldVol) => {
				const vol = Math.max(Math.min(oldVol + diff, 1.0), 0.0)
				player.current.volume = vol
				return vol
			})
		} else {
			setVolume(value)
			player.current.volume = value
		}
	}

	function onPlay() {
		setPlaying(true)

		if (player.current) {
			console.log("Progress is", progress)
			player.current.currentTime = progress * player.current.duration
			player.current.volume = volume
		}
	}

	function onPause() {
		console.log("onPause")
		setPlaying(false)

		if (player.current) {
			const pr = player.current ? (player.current.currentTime / player.current.duration) : progress
			setProgress(pr)
			callUpdateProgress(pr, volume)
		}
	}

	function onSeeked(ev) {
		console.log("onSeeked")
		if (player.current) {
			const pr = player.current.currentTime / player.current.duration

			if (pr == 0.0 || pr == 1.0)
				callUpdateProgress(pr, volume)
		}
	}

	function onEnded(ev) {
		console.log("onEnded")
		if (player.current) {
			const pr = player.current.currentTime / player.current.duration
			setProgress(pr)
			callUpdateProgress(pr, volume)

			if (player.current.currentTime == player.current.duration && props.onEnded) {
				if (endTimeout.current !== null)
					clearTimeout(endTimeout.current)

				if (started) {
					setStarted(false)

					endTimeout.current = setTimeout(() => {
						if (endTimeout.current !== null)
							clearTimeout(endTimeout.current)
						endTimeout.current = null

						props.onEnded()
					}, nextItemTimeout)
				}
			}
		}
	}

	function enableFullscreen(enable) {
		if (enable) {
			if (player.current) {
				const rf = player.current.webkitRequestFullScreen ||
					player.current.requestsFullScreen ||
					player.current.mozRequestFullScreen ||
					player.current.mozRequestFullScreen

				rf.apply(player.current)
			}
		} else {
			Document.exitFullscreen()
		}
	}

	function toggleFullscreen() {
		setFullScreen((old) => {
			enableFullscreen(!old)
			return !old
		})
	}

	function clearHoverTimeout() {
		if (hoverTimeout.current !== null) {
			clearTimeout(hoverTimeout.current)
			hoverTimeout.current = null
		}
	}

	function togglePause() {
		setPlaying(prevPlaying => {
			if (prevPlaying)
				player.current.pause()
			else
				player.current.play()
			clearHoverTimeout()
			setHover(true)
			return !prevPlaying
		})
	}

	const onMouseMove = (ev) => {
		const brect = ev.target.getBoundingClientRect()
		const h = ev.clientY > brect.height * 0.8

		if (h) {
			clearHoverTimeout()
			setHover(true)
		} else if (hover) {
			clearHoverTimeout()
			hoverTimeout.current = setTimeout(() => { setHover(false) }, hoverOutDelay)
		}
	}

	const onToggleMute = () => {
		setMuted(m => {
			return !m
		})
	}

	function fastForward(d) {
		const pr = Math.max(Math.min(1.0, progress + d))
		setProgress(pr)
		player.current.currentTime = pr * player.current.duration
	}

	const onKeyDown = (ev) => {

		switch (ev.key) {
			case 'ArrowLeft':
				fastForward(-fastStep / props.node.length)
				break
			case 'ArrowRight':
				fastForward(fastStep / props.node.length)
				break
			case 'ArrowDown':
				fastForward(-veryFastStep / props.node.length)
				break
			case 'ArrowUp':
				fastForward(veryFastStep / props.node.length)
				break

			case 'p':
				props.onPrevNode()
				break
			case 'n':
				props.onNextNode()
				break
			case 'Backspace':
				props.ctx.openNodeId(props.node.parent_id)
				break
			case 'Delete':
				props.onAction('delete', props.node)
				break

			case ' ':
				togglePause()
				break

			case 'm':
				onToggleMute()
				break
			case '+':
				onVolumeChanged(null, volumeStep)
				break
			case '-':
				onVolumeChanged(null, -volumeStep)
				break

			case 's':
				console.log("Setting hidable to ", !hidable)
				setHidable(!hidable)
				break;
		}
	}

	function renderVideo() {
		return (
			<video
				className={classes.video}
				ref={(r) => { player.current = r }}
				src={nodeURL(props.node)}
				poster={props.node.thumbURL(true)}
				preload="metadata"
				autoPlay={true}
				controls={fullscreen}
				muted={muted}
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
				poster={props.node.thumbURL(true)}
				preload="metadata"
				autoPlay={true}
				controls={fullscreen}
				muted={muted}
				onClick={togglePause}
				onTimeUpdate={onTimeUpdate}
				onSeeked={onSeeked}
				onPlay={onPlay}
				onPause={onPause}
				onEnded={onEnded}
				onPlaying={() => { console.log("onPlaying") }} />)
	}

	return (
		<div ref={root} className={classes.root} tabIndex="0"
			onKeyDown={onKeyDown} onMouseMove={onMouseMove}>

			{isAudio(props.node.mime_type) ? renderAudio() : renderVideo()}

			{(player.current === null) ? null :
				<MediaControls
					node={props.node}
					progress={progress}
					onProgressChanged={onProgressChanged}
					duration={player.current ? (player.current.duration || 0) : 0}
					visible={isAudio(props.node.mime_type) || hover}
					playing={playing}
					onPaused={togglePause}
					fullscreen={toggleFullscreen}
					onNextNode={props.onNextNode}
					onPrevNode={props.onPrevNode}
					onSkip={(d) => { player.current.currentTime += d }}
					muted={muted}
					onMuted={onToggleMute}
					volume={volume}
					onVolumeChanged={onVolumeChanged}
					ctx={props.ctx} />}
		</div>
	)
}

