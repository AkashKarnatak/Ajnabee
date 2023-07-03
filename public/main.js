const ws = new WebSocket('ws://localhost:8080')
const cn = new RTCPeerConnection()

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

ws.addEventListener('open', () => {
  ws.init()

  ws.register('request', async (data) => {
    console.log('received request:', data)
    const { uuid, req } = data
    let res
    if (req.offer) {
      console.log('setting offer', req.offer)
      cn.setRemoteDescription(req.offer)
      const answer = await cn.createAnswer()
      cn.setLocalDescription(answer)
      res = answer
      console.log('sending answer', answer)
    } else if (req.answer) {
      console.log('setting answer', req.answer)
      cn.setRemoteDescription(req.answer)
    } else return
    ws.emit('response', { uuid, res })
  })

  main()
})

let rs
async function main() {
  cn.onicecandidate = e =>  {
    if (e.candidate) {
      console.log(e.candidate)
    } else {
      console.log('done')
      ws.emit('offer', cn.localDescription)
    }
  }
  ls = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  })
  rs = new MediaStream()

  document.getElementById('video-self').srcObject = ls
  document.getElementById('video-peer').srcObject = rs

  ls.getTracks().forEach((track) => {
    console.log('adding tracks')
    cn.addTrack(track, ls)
  })

  cn.ontrack = (event) => {
    console.log('received track')
    event.streams[0].getTracks().forEach((track) => {
      rs.addTrack(track)
    })
  }

  const offer = await cn.createOffer()
  cn.setLocalDescription(offer)
}
