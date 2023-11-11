const $ = (x) => document.querySelector(x)
const $$ = (x) => document.querySelectorAll(x)

function configureTags() {
  const $input = $('#interest-container input')
  const $tags = $('#tag-container')
  const $textBtn = $('#text-btn')
  const $videoBtn = $('#video-btn')

  $input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ',') return

    const value = $input.value.trim()
    if (!value) return

    const tag = document.createElement('div')
    tag.id = 'tag'
    tag.innerHTML = `<p><span>${value}</span> ×</p>`
    tag.style = 'cursor: pointer'
    tag.onclick = () => tag.remove()
    $tags.appendChild(tag)
    $input.value = ''

    e.preventDefault()
  })

  $textBtn.addEventListener('click', () => {
    const interests = Array.from($$('#tag p span')).map(x => x.innerText)
    window.location.href = '/chat?' + new URLSearchParams({ interests })
  })

  $videoBtn.addEventListener('click', () => {
    const interests = Array.from($$('#tag p span')).map(x => x.innerText)
    window.location.href = '/video?' + new URLSearchParams({ interests })
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
