const ChatModule = {
  messages: [],
  attachedImage: null,
  attachedMimeType: null,

  init() {
    document.getElementById('sendBtn').addEventListener('click', () => this.send())
    document.getElementById('clearBtn').addEventListener('click', () => this.clearInput())
    document.getElementById('promptInput').addEventListener('input', () => this.updateCounter())
    document.getElementById('promptInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send() }
    })
    document.getElementById('imageInput').addEventListener('change', (e) => this.handleImage(e))
    document.getElementById('dropZone').addEventListener('click', () => document.getElementById('imageInput').click())
    document.getElementById('clearImgBtn').addEventListener('click', () => this.clearImage())
  },

  async send() {
    const input = document.getElementById('promptInput')
    const text = input.value.trim()
    if (!text && !this.attachedImage) {
      input.style.borderColor = '#ff0055'
      setTimeout(() => input.style.borderColor = '', 1500)
      return
    }

    this.addMessage(text || '(image analysis)', 'user')
    input.value = ''
    this.updateCounter()

    App.showLoader(true)

    try {
      const payload = {
        messages: [
          { role: 'system', content: App.systemPrompt },
          { role: 'user', content: text || 'Analyze this image.' }
        ]
      }
      if (this.attachedImage) {
        payload.messages[1].image = `data:${this.attachedMimeType};base64,${this.attachedImage}`
      }
      if (document.getElementById('toggleSearch').checked) {
        payload.web_search = true
      }

      const response = await App.sendToEngine(payload)
      this.addMessage(response, 'bot')
      App.showLoader(false)
    } catch (err) {
      this.addMessage(`**Error:** ${err.message}`, 'bot')
      App.showLoader(false)
    }
  },

  addMessage(text, role) {
    const container = document.getElementById('messages')
    const welcome = container.querySelector('.welcome')
    if (welcome) welcome.remove()

    const div = document.createElement('div')
    div.className = `msg ${role}`
    div.innerHTML = `
      <div class="msg-avatar ${role}">
        <i class="fa-solid fa-${role === 'bot' ? 'shield-halved' : 'user'}"></i>
      </div>
      <div class="msg-bubble">${this.renderMarkdown(text)}</div>
    `
    container.appendChild(div)
    container.scrollTop = container.scrollHeight
  },

  renderMarkdown(text) {
    if (typeof marked !== 'undefined') return marked.parse(text)
    return text.replace(/\n/g, '<br>')
  },

  loadPreset(type) {
    const input = document.getElementById('promptInput')
    const presets = {
      tactical: "Conduct a high-level tactical cyber defense analysis on securing cloud infrastructure against zero-day vulnerability threats. Format with executive summary, threat matrix, and 3-step mitigation playbook.",
      code: "Write a high-performance Python script for a multi-threaded parallel task executor featuring exponential backoff retries, error boundaries, and real-time metric logging.",
      scifi: "Simulate an orbital satellite telemetry crisis scenario. Provide a strategic mission log with tactical directives, atmospheric impact assessments, and emergency override protocols.",
      search: "What are the latest breakthroughs in AI robotics and quantum computing? Summarize top news items and key industry metrics."
    }
    input.value = presets[type] || ''
    this.updateCounter()
  },

  clearInput() {
    document.getElementById('promptInput').value = ''
    this.updateCounter()
  },

  updateCounter() {
    const len = document.getElementById('promptInput').value.length
    document.getElementById('charCounter').textContent = `${len} chars`
  },

  handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return App.showToast('Please attach a valid image file.')
    const reader = new FileReader()
    reader.onload = (ev) => {
      this.attachedImage = ev.target.result.split(',')[1]
      this.attachedMimeType = file.type
      const preview = document.getElementById('imagePreview')
      preview.src = ev.target.result
      preview.classList.remove('hidden')
      document.getElementById('dropZoneText').textContent = file.name
      document.getElementById('clearImgBtn').classList.remove('hidden')
    }
    reader.readAsDataURL(file)
  },

  clearImage() {
    this.attachedImage = null
    this.attachedMimeType = null
    document.getElementById('imageInput').value = ''
    document.getElementById('imagePreview').src = ''
    document.getElementById('imagePreview').classList.add('hidden')
    document.getElementById('dropZoneText').textContent = 'Click or drag image for analysis'
    document.getElementById('clearImgBtn').classList.add('hidden')
  }
}
