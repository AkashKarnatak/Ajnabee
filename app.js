const express = require('express')
const { WebSocket, WebSocketServer } = require('ws')

const SERVER_PORT = process.env.SERVER_PORT

if (!SERVER_PORT) {
  throw new Error('Forgot to initialze some variables')
}

Array.prototype.random = function () {
  return this[Math.floor(Math.random() * this.length)]
}

WebSocket.prototype.init = function () {
  this.channels = new Map()
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
  // redirect message to peer
  if (!callback && this.peer) {
    return this.peer.send(JSON.stringify({ channel, data }))
  }
  callback(data)
}

const app = express()
const port = SERVER_PORT

app.use(express.static('./public'))

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Listening on port ${port}`)
})

const wss = new WebSocketServer({ server })

app.get('/data', (_, res) => {
  res.send(Array.from(wss.availableClients.values()))
})

wss.availableClients = new Map()
wss.on('connection', (ws, req) => {
  console.log('new connection')

  ws.init()

  ws.register('ping', () => {})

  ws.register('match', () => {
    const peer = Array.from(wss.availableClients.keys()).random()
    if (!peer || peer == ws) {
      console.log('No peers found')
      console.log(
        `Pushing ${req.socket.remoteAddress}:${req.socket.remotePort} to queue`
      )
      return wss.availableClients.set(
        ws,
        `${req.socket.remoteAddress}:${req.socket.remotePort}`
      )
    }

    console.log('peer availabe:', wss.availableClients.get(peer))
    console.log(
      `matching ${req.socket.remoteAddress}:${
        req.socket.remotePort
      } with ${wss.availableClients.get(peer)}`
    )
    wss.availableClients.delete(peer)

    // set peer
    ws.peer = peer
    peer.peer = ws

    ws.send(JSON.stringify({ channel: 'begin', data: '' }))
  })

  ws.register('disconnect', async () => {
    if (!ws.peer) return
    ws.peer.peer = undefined
    ws.peer.send(JSON.stringify({ channel: 'disconnect', data: '' }))
  })

  ws.on('close', () => {
    console.log(
      `${req.socket.remoteAddress}:${req.socket.remotePort} disconnected`
    )
    if (ws.peer) {
      ws.peer.send(JSON.stringify({ channel: 'disconnect', data: '' }))
      ws.peer.peer = undefined
    }
    wss.availableClients.delete(ws)
  })
})
