import express from 'express'
import { WebSocket, WebSocketServer } from 'ws'
import db from './db/sqlite.js'

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
  if (callback) {
    callback(data)
  } else if (this.peer) {
    // redirect message to peer
    return this.peer.send(JSON.stringify({ channel, data }))
  }
}

const app = express()
const port = SERVER_PORT

app.use(express.static('./public', { extensions: ['html'] }))

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Listening on port ${port}`)
})

const wss = new WebSocketServer({ server })

app.get('/online', (_, res) => {
  res.send({ online: wss.clients.size })
})

app.post('/feedback', express.json(), async (req, res) => {
  await db.insertFeedback({ feedback: req.body.feedback })
  res.sendStatus(200)
})

wss.availableTextClients = new Map()
wss.availableVideoClients = new Map()
wss.on('connection', (ws, req) => {
  console.log('new connection')

  ws.init()

  ws.register('peopleOnline', () => {
    ws.send(JSON.stringify({ channel: 'peopleOnline', data: wss.clients.size }))
  })

  ws.register('match', (data) => {
    ws.clients = ((_) =>
      data === 'video' ? wss.availableVideoClients : wss.availableTextClients)()
    const peer = Array.from(ws.clients.keys()).random()

    if (!peer || peer == ws) {
      console.log('No peers found')
      console.log(
        `Pushing ${req.socket.remoteAddress}:${req.socket.remotePort} to queue`
      )
      return ws.clients.set(
        ws,
        `${req.socket.remoteAddress}:${req.socket.remotePort}`
      )
    }

    console.log('peer available:', ws.clients.get(peer))
    console.log(
      `matching ${req.socket.remoteAddress}:${
        req.socket.remotePort
      } with ${ws.clients.get(peer)}`
    )
    ws.clients.delete(peer)

    // set peer
    ws.peer = peer
    peer.peer = ws

    ws.send(JSON.stringify({ channel: 'connected', data: '' }))
    ws.peer.send(JSON.stringify({ channel: 'connected', data: '' }))
    if (data === 'video') {
      ws.send(JSON.stringify({ channel: 'begin', data: '' }))
    }
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
    ws.clients.delete(ws)
  })
})
