import { createSocket } from './socket.js'

const $ = (x) => document.querySelector(x)
const esc = (x) => {
  const txt = document.createTextNode(x)
  const p = document.createElement('p')
  p.appendChild(txt)
  return p.innerHTML
}

const ws = await createSocket()
const debounceTime = 1000

let base = Math.floor(Math.random() * 50 + 30)
const noise = Math.floor(Math.random() * 10 - 5)

if (!sessionStorage.getItem('peopleOnline')) {
  sessionStorage.setItem('peopleOnline', base)
} else {
  base = +sessionStorage.getItem('peopleOnline')
}

let timeout
let pc, ls

const $peopleOnline = $('#peopleOnline p span')
const $msgs = $('#messages')
const $msgArea = $('#message-area')
const $typing = $('#typing')
const $videoPeer = $('#video-peer')
const $loader = $('#peer-video-loader')
const $skipBtn = $('#skip-btn')
const $sendBtn = $('#send-btn')
const $input = $('#message-input')

function configureChat() {
  $input.focus()

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      $skipBtn.click()
      e.preventDefault()
    }
  })
  $input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      clearInterval(timeout)
      ws.emit('typing', false)
      $sendBtn.click()
      return e.preventDefault()
    }
    ws.emit('typing', true)
  })
  $input.addEventListener('keyup', function (e) {
    clearInterval(timeout)
    timeout = setTimeout(() => {
      ws.emit('typing', false)
    }, debounceTime)
  })
}

// hide loader when video connected
$videoPeer.addEventListener('play', () => {
  $loader.style.display = 'none'
})

const initializeConnection = async () => {
  $msgs.innerHTML = `
    <div class="message-status">Looking for people online...</div>
  `
  $sendBtn.disabled = true
  $input.value = ''
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
      .filter((x) => !!x)
      .map((x) => x.trim()) || []
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
  msgE.innerHTML = `<span class="you">You:</span> ${esc(msg)}`

  $msgs.appendChild(msgE)
  $msgArea.scrollTop = $msgArea.scrollHeight
  $input.value = ''

  ws.emit('message', esc(msg))
})

ws.register('begin', async () => {
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
})

ws.register('peopleOnline', async (data) => {
  $peopleOnline.innerHTML = base + noise + +data
})

ws.register('connected', async (data) => {
  const params = new URLSearchParams(window.location.search)
  const interests =
    params
      .get('interests')
      ?.split(',')
      .filter((x) => !!x)
      .map((x) => x.trim()) || []

  let commonInterests = data.at(-1) || ''
  const first = data.slice(0, -1)
  if (first.length) {
    commonInterests = `${first.join(', ')} and ${commonInterests}`
  }

  $msgs.innerHTML = ''
  const status = document.createElement('div')
  status.className = 'message-status'
  status.innerHTML = 'You are now talking to a random stranger'
  $msgs.appendChild(status)
  if (commonInterests) {
    const status = document.createElement('div')
    status.className = 'message-status'
    status.innerHTML = `You both like ${esc(commonInterests)}`
    $msgs.appendChild(status)
  } else if (interests.length) {
    const status = document.createElement('div')
    status.className = 'message-status'
    status.innerHTML =
      "Couldn't find anyone with similar interests, so this stranger is completely random. Try adding more interests!"
    $msgs.appendChild(status)
  }
  $msgArea.scrollTop = $msgArea.scrollHeight
  $sendBtn.disabled = false
  $input.readOnly = false
})

ws.register('message', async (msg) => {
  if (!msg) return

  const msgE = document.createElement('div')
  msgE.className = 'message'
  msgE.innerHTML = `<span class="strange">Stranger:</span> ${esc(msg)}`

  $msgs.appendChild(msgE)
  $msgArea.scrollTop = $msgArea.scrollHeight
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

ws.register('typing', async (isTyping) => {
  $typing.style.display = isTyping ? 'block' : 'none'
  $msgArea.scrollTop = $msgArea.scrollHeight
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
