const $ = (x) => document.querySelector(x)

function configureChat() {
  const $input = $('#message-input')
  const $sendBtn = $('#send-btn')
  const $msgArea = $('#message-area')
  $input.focus()

  $sendBtn.addEventListener('click', () => {
    const msg = $input.value.trim()
    if (!msg) return

    const msgE = document.createElement('div')
    msgE.className = 'message'
    msgE.innerHTML = `<span>You:</span> ${msg}`

    $msgArea.appendChild(msgE)
    $msgArea.scrollTop = $msgArea.scrollHeight
    $input.value = ''
  })

  $input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      $sendBtn.click()
      e.preventDefault()
    }
  })
}

function configureFeedbackModal() {
  const $modal = $('#feedbackModal')
  const $btn = $('#feedback-btn')
  const $close = $('#feedbackModal .close')
  const $text = $('#feedbackText')

  $btn.onclick = () => {
    $modal.style.display = 'block'
  }

  $close.onclick = () => {
    $modal.style.display = 'none'
  }

  window.onclick = (e) => {
    if (e.target == $modal) {
      $modal.style.display = 'none'
    }
  }

  $('#feedbackForm').onsubmit = async (e) => {
    e.preventDefault()
    let feedback = $text.value
    $text.value = ''
    $modal.style.display = 'none'
    // send feedback to backend
    await fetch('/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedback,
      }),
    })
  }
}

configureFeedbackModal()
configureChat()
