const $ = (x) => document.querySelector(x)

function configureTags() {
  const $input = $('#interest-container input')
  const $tags = $('#tag-container')
  const $textBtn = $('#text-btn')
  const $videoBtn = $('#video-btn')

  $input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ',') return

    const value = $input.value
    if (!value) return

    const tag = document.createElement('div')
    tag.id = 'tag'
    tag.innerHTML = `<p>${value} ×</p>`
    tag.style = 'cursor: pointer'
    tag.onclick = () => tag.remove()
    $tags.appendChild(tag)
    $input.value = ''

    e.preventDefault()
  })

  $textBtn.addEventListener('click', () => {
    window.location.href = '/chat'
  })

  $videoBtn.addEventListener('click', () => {
    window.location.href = '/video'
  })
}

async function getPeopleOnline() {
  const $peopleOnline = $('#peopleOnline p span')
  const res = await fetch('/online')
  if (!res.ok) {
    return console.error("Couldn't fetch GET /online")
  }
  const { online } = await res.json()
  console.log(online)
  $peopleOnline.innerHTML = online
}

configureTags()
await getPeopleOnline()
