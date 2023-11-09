const $ = (x) => document.querySelector(x)

function configureFeedbackModal() {
  const $modal = $('#feedbackModal')
  const $btn = $('#feedback-btn')
  const $close = $('#feedbackModal .close')
  const $text = $('#feedbackText')

  $btn.onclick = function () {
    $modal.style.display = 'block'
  }

  $close.onclick = function () {
    $modal.style.display = 'none'
  }

  window.onclick = function (event) {
    if (event.target == $modal) {
      $modal.style.display = 'none'
    }
  }

  $('#feedbackForm').onsubmit = function (e) {
    e.preventDefault()
    let feedbackText = $text.value
    $text.value = ''
    $modal.style.display = 'none'
    console.log(feedbackText) // TODO: send to server
  }
}

configureFeedbackModal()
