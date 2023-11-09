import { WEBSOCKET_URL } from './env.js'

if (!WEBSOCKET_URL) {
  throw new Error('Forgot to initialze some variables')
}

const $ = (x) => document.querySelector(x)

const $peopleOnline = $('#peopleOnline p span')
const $videoPeer = $('#video-peer')
const $loader = $('#peer-video-loader')

// hide loader when video connected
$videoPeer.addEventListener('play', () => {
  $loader.style.display = 'none'
})

const ws = new WebSocket(WEBSOCKET_URL)
setInterval(function () {
  if (ws.readyState === WebSocket.OPEN) {
    ws.emit('peopleOnline')
  }
}, 30000)

let pc, ls

$('#skip-btn').addEventListener('click', () => {
  ws.emit('disconnect')
  pc.close()
  initializeConnection()
})

WebSocket.prototype.init = function () {
  this.channels = new Map()
  this.addEventListener('message', (message) => {
    const { channel, data } = JSON.parse(message.data.toString())
    this.propagate(channel, data)
  })
}

WebSocket.prototype.emit = function (channel, data) {
  this.send(JSON.stringify({ channel, data }))
}

WebSocket.prototype.register = function (channel, callback) {
  this.channels.set(channel, callback)
}

WebSocket.prototype.propagate = function (channel, data) {
  const callback = this.channels.get(channel)
  if (!callback) return
  callback(data)
}

async function initializeConnection() {
  const iceConfig = {
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302',
          'stun:stun4.l.google.com:19302',
        ],
      },
    ],
  }

  pc = new RTCPeerConnection(iceConfig)
  pc.sentDescription = false

  pc.onicecandidate = (e) => {
    if (!e.candidate) return

    if (!pc.sentRemoteDescription) {
      pc.sentRemoteDescription = true
      console.log(JSON.stringify(pc.localDescription))
      ws.emit('description', pc.localDescription)
    }
    console.log(JSON.stringify(e.candidate))
    ws.emit('iceCandidate', e.candidate)
  }

  pc.oniceconnectionstatechange = async function () {
    if (
      pc.iceConnectionState === 'disconnected' ||
      pc.iceConnectionState === 'closed'
    ) {
      console.log(pc.iceConnectionState)
      pc.close()
      initializeConnection()
    }
  }

  const rs = new MediaStream()

  $videoPeer.srcObject = rs
  $loader.style.display = 'inline-block' // show loader

  ls.getTracks().forEach((track) => {
    console.log('adding tracks')
    pc.addTrack(track, ls)
  })

  pc.ontrack = (event) => {
    console.log('received track')
    event.streams[0].getTracks().forEach((track) => {
      rs.addTrack(track)
    })
  }

  ws.emit('peopleOnline')
  ws.emit('match')
}

ws.addEventListener('open', async () => {
  ws.init()

  ws.register('begin', async () => {
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
  })

  ws.register('peopleOnline', async (data) => {
    $peopleOnline.innerHTML = data
  })

  ws.register('iceCandidate', async (data) => {
    // TODO: add a queueing mechanism to ensure remoteDescription is
    // set before adding ice candidate
    await pc.addIceCandidate(data)
  })

  ws.register('description', async (data) => {
    await pc.setRemoteDescription(data)
    if (!pc.localDescription) {
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
    }
  })

  ws.register('disconnect', async () => {
    console.log('received disconnect request')
    pc.close()
    initializeConnection()
  })

  try {
    ls = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })
  } catch (e) {
    alert('This website needs video and audio permission to work correctly')
  }
  $('#video-self').srcObject = ls

  await initializeConnection()
})
