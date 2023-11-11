import { createSocket } from './socket.js'

const $ = (x) => document.querySelector(x)

const ws = await createSocket()
let pc, ls

function configureChat() {
  const $input = $('#message-input')
  const $sendBtn = $('#send-btn')
  $input.focus()

  $input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      $sendBtn.click()
      e.preventDefault()
    }
  })
}

const $peopleOnline = $('#peopleOnline p span')
const $msgArea = $('#message-area')
const $videoPeer = $('#video-peer')
const $loader = $('#peer-video-loader')
const $skipBtn = $('#skip-btn')
const $sendBtn = $('#send-btn')
const $input = $('#message-input')

// hide loader when video connected
$videoPeer.addEventListener('play', () => {
  $loader.style.display = 'none'
})

const initializeConnection = async () => {
  $msgArea.innerHTML = `
    <div id="message-status">Looking for people online...</div>
  `
  $sendBtn.disabled = true
  $input.readOnly = true

  const iceConfig = {
    iceServers: [
      {
        urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
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
      await initializeConnection()
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
  const params = new URLSearchParams(window.location.search)
  const interests =
    params
      .get('interests')
      ?.split(',')
      .filter(x => !!x)
      .map(x => x.trim()) || []
  ws.emit('match', { data: 'video', interests })
}

$skipBtn.addEventListener('click', async () => {
  ws.emit('disconnect')
  pc.close()
  await initializeConnection()
})

$sendBtn.addEventListener('click', () => {
  const msg = $input.value.trim()
  if (!msg) return

  const msgE = document.createElement('div')
  msgE.className = 'message'
  msgE.innerHTML = `<span class="you">You:</span> ${msg}`

  $msgArea.appendChild(msgE)
  $msgArea.scrollTop = $msgArea.scrollHeight
  $input.value = ''

  ws.emit('message', msg)
})

ws.register('begin', async () => {
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
})

ws.register('peopleOnline', async (data) => {
  $peopleOnline.innerHTML = data
})

ws.register('connected', async () => {
  $msgArea.innerHTML = ''
  const status = document.createElement('div')
  status.id = 'message-status'
  status.innerHTML = 'You are now talking to a random stranger'
  $msgArea.appendChild(status)
  $msgArea.scrollTop = $msgArea.scrollHeight
  $sendBtn.disabled = false
  $input.readOnly = false
})

ws.register('message', async (msg) => {
  if (!msg) return

  const msgE = document.createElement('div')
  msgE.className = 'message'
  msgE.innerHTML = `<span class="strange">Stranger:</span> ${msg}`

  $msgArea.appendChild(msgE)
  $msgArea.scrollTop = $msgArea.scrollHeight
  $input.value = ''
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
  await initializeConnection()
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

configureChat()
await initializeConnection()
