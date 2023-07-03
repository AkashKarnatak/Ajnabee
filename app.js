const express = require('express')
const { randomUUID } = require('crypto')
const { WebSocket, WebSocketServer } = require('ws')

Array.prototype.random = function () {
  return this[Math.floor(Math.random() * this.length)]
}

WebSocket.prototype.init = function() {
  this.channels = new Map()
  this.resCallbacks = new Map()
  this.on('message', (message) => {
    const { channel, data } = JSON.parse(message.toString())
    this.propagate(channel, data)
  })
}

WebSocket.prototype.register = function (channel, callback) {
  this.channels.set(channel, callback)
}

WebSocket.prototype.propagate = function (channel, data) {
  const callback = this.channels.get(channel)
  if (!callback) return
  callback(data)
}

WebSocket.prototype.request = function(data, callback) {
  const uuid = randomUUID()
  this.resCallbacks.set(uuid, callback)
  this.send(JSON.stringify({ channel: 'request', data: { uuid, req: data } }))
}

const app = express()
const port = 8080

app.use(express.static('./public'))

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Listening on port ${port}`)
})

const wss = new WebSocketServer({ server })

wss.availableClients = []
wss.on('connection', (ws) => {
  console.log('new connection')
  console.log(wss.clients.size)
  ws.init()

  ws.register('offer', (offer) => {
    // find peer
    const peer = wss.availableClients.random()
    if (!peer) {
      return wss.availableClients.push(ws)
    }
    peer.request({ offer }, (answer) => {
      ws.request({ answer }, () => {})
    })
  })

  ws.register('response', (data) => {
    const { uuid, res } = data
    const callback = ws.resCallbacks.get(uuid)
    if (!callback) return
    callback(res)
  })

  ws.on('close', () => {
    console.log(wss.clients.size)
  })
})
