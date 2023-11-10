import { createSocket } from './socket.js'

const $ = (x) => document.querySelector(x)

const ws = await createSocket()

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
const $skipBtn = $('#skip-btn')
const $sendBtn = $('#send-btn')
const $msgArea = $('#message-area')
const $input = $('#message-input')

const initializeConnection = () => {
  $msgArea.innerHTML = `
    <div id="message-status">Looking for people online...</div>
  `
  $sendBtn.disabled = true
  ws.emit('peopleOnline')
  ws.emit('match', 'text')
}

$skipBtn.addEventListener('click', async () => {
  ws.emit('disconnect')
  initializeConnection()
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

ws.register('disconnect', async () => {
  console.log('received disconnect request')
  initializeConnection()
})

configureChat()
initializeConnection()
