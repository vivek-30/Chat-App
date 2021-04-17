import React, { useState, useEffect, useRef } from 'react'
import { socket } from '../../../client/Chat'
import { useParams, useHistory } from 'react-router-dom'
import Peer from 'simple-peer'
import './videoCall.css'

export var answerCall = null
export var callRejected = null
export var callUser = null

const VideoCall = () => {

	const [ myID, setMyID ] = useState(null)
	const [ person, setPerson ] = useState('')
	const [ caller, setCaller ] = useState('')
	const [ stream, setStream ] = useState(null)
	const [ callEnded, setCallEnded ] = useState(false)
	const [ callerSignal, setCallerSignal ] = useState(null)
	const [ callAccepted, setCallAccepted ] = useState(false)
	const [ receivingCall, setReceivingCall ] = useState(false)

	const params = useParams()
	const history = useHistory()

	const connectionRef = useRef(null)
	const myVideoRef = useRef(null)
	const userVideoRef = useRef(null)

	useEffect(() => {

		let isMounted = true

		if (isMounted) {

			socket.emit('get-myID')

			socket.on('myID', (id) => setMyID(id))
			
			navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true
			})
			.then((stream) => {
				setStream(stream)
				myVideoRef.current.srcObject = stream
			})
			.catch((err) => {
				console.log('Error in setting video call', err)
			})

			socket.on('call-user', ({ name, from, signal }) => {
				setReceivingCall(true)
				setPerson(name)
				setCaller(from)
				setCallerSignal(signal)
			})
		}

		return () => {
			socket.emit('stop-notifying')
			stream?.getTracks()?.forEach(function(track) {
				track.stop()
			})
			isMounted = false
		}

	}, [])

	callRejected = () => {
		console.log('callReject using video component')
	}

	callUser = (id = null) => {

		const ID = id || params.id

		if(!ID) {
			alert('Something Went Wrong. Can\'t make a call.')
			return
		}

		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})

		peer.on('signal', (data) => {
			socket.emit('call-user', {
				userToCall: ID,
				signalData: data,
				from: myID
			})
		})

		peer.on('stream', (stream) => {
			userVideoRef.current.srcObject = stream
		})

		socket.on('call-accepted', (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})

		connectionRef.current = peer
	}

	answerCall = () => {

		setCallAccepted(true)

		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})

		peer.on('signal', (data) => {
			socket.emit('answer-call', { 
				signal: data, 
				to: caller 
			})
		})

		peer.on('stream', (stream) => {
			userVideoRef.current.srcObject = stream
		})

		callerSignal ? peer.signal(callerSignal) : console.log('no callersignal')
		connectionRef.current = peer
	}

	const endCall = () => {
		setCallEnded(true)
		stream?.getTracks().forEach(function(track) {
			track.stop()
		})
		connectionRef.current?.destroy()
		history.push('/chat')
	}

	return (
		<div className="section">
			<div className="left">
				{ receivingCall && !callAccepted ? (
					<span className="flow-text black-text">{person} is calling...</span>
				) : null }
			</div>
			<div id="video-container">
				<span className="video">
					{ stream && <video ref={myVideoRef} playsInline autoPlay muted /> }
				</span>
				<span className="video">
					{ callAccepted && !callEnded ? ( <video ref={userVideoRef} playsInline autoPlay muted /> )
					: null }
				</span>
			</div>
			<div id="call-handlers">
				{ callAccepted && !callEnded ? (
					<button className="btn-large red darken-1 center" onClick={endCall}>
						<i className="material-icons left">call_end</i>
						End Call
					</button> 
				) : receivingCall && !callAccepted ? (
					<button className="btn-large green lighten-1 center" onClick={() => answerCall()}>
						<i className="material-icons left">call</i>
						Anwer Call
					</button>
				) : (
					<button className="btn-large blue darken-1 center" onClick={() => callUser()}>
						<i className="material-icons left">call</i>
						Make Call
					</button>
				) }
			</div>
		</div>
	)
}

export default VideoCall
