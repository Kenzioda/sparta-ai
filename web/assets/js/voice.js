const VoiceModule = {
  active: false,
  session: null,
  inputCtx: null,
  outputCtx: null,
  mediaStream: null,
  workletNode: null,
  nextStartTime: 0,
  outputSources: new Set(),

  async toggle() {
    if (this.active) return this.stop()
    await this.start()
  },

  async start() {
    const btn = document.getElementById('voiceBtn')
    const badge = document.getElementById('voiceBadge')
    const visualizer = document.getElementById('voiceVisualizer')
    const transcript = document.getElementById('voiceTranscript')
    const source = document.getElementById('voiceSource').value

    btn.textContent = 'CONNECTING...'
    btn.disabled = true

    try {
      if (source === 'external') {
        await this.startExternal()
      } else {
        await this.startBuiltin()
      }

      this.active = true
      btn.textContent = 'TERMINATE LIVE STREAM'
      btn.className = 'btn'
      btn.style.borderColor = '#ff0055'
      btn.style.color = '#ff0055'
      btn.style.background = 'rgba(255,0,85,0.15)'
      badge.textContent = 'LIVE'
      badge.className = 'badge active'
      visualizer.querySelector('.voice-standby').classList.add('hidden')
      transcript.classList.remove('hidden')
    } catch (e) {
      console.error('Voice start error:', e)
      App.showToast('Voice connection failed. Check your audio devices and API key.')
      btn.textContent = 'INITIALIZE LIVE COMMS'
      btn.className = 'btn btn-emerald'
      btn.disabled = false
    }
  },

  async startBuiltin() {
    if (!window.GoogleGenAI) {
      throw new Error('Gemini Live SDK not loaded')
    }
    const API_KEY = localStorage.getItem('sparta_api_key') || ''
    if (!API_KEY) {
      throw new Error('API key required for built-in voice mode. Set it in settings.')
    }
    const ai = new window.GoogleGenAI({ apiKey: API_KEY })
    this.inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 })
    this.outputCtx = new (window.AudioContext || window.webkitAudioContext)()

    const workletCode = `
      class RecorderProcessor extends AudioWorkletProcessor {
        process(inputs) {
          if (inputs[0] && inputs[0].length > 0) this.port.postMessage(inputs[0])
          return true
        }
      }
      registerProcessor('recorder-processor', RecorderProcessor)
    `
    const blob = new Blob([workletCode], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    await this.inputCtx.audioWorklet.addModule(url)

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
    })

    const sessionPromise = ai.live.connect({
      model: 'gemini-3.1-flash-live-preview',
      callbacks: {
        onopen: () => {
          const source = this.inputCtx.createMediaStreamSource(this.mediaStream)
          this.workletNode = new AudioWorkletNode(this.inputCtx, 'recorder-processor')
          this.workletNode.port.onmessage = (e) => {
            if (!this.active) return
            const pcmBlob = VoiceModule.createPcmBlob(e.data)
            sessionPromise.then(s => s.sendRealtimeInput({ audio: pcmBlob })).catch(() => {})
          }
          source.connect(this.workletNode)
          this.workletNode.connect(this.inputCtx.destination)
        },
        onmessage: (msg) => {
          const ut = msg.serverContent?.inputTranscription
          const ot = msg.serverContent?.outputTranscription
          if (ut) document.getElementById('userTranscript').textContent = `You: ${ut.text}`
          if (ot) document.getElementById('spartaTranscript').textContent = `SPARTA: ${ot.text}`
          const b64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data
          if (b64) this.playAudioChunk(b64)
          if (msg.serverContent?.interrupted) this.stopAllSources()
        },
        onerror: (err) => { console.error('Live error:', err); this.stop() },
        onclose: () => { if (this.active) this.stop() }
      },
      config: {
        responseModalities: [window.Modality.AUDIO],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
        },
        systemInstruction: App.systemPrompt
      }
    })
    this.session = await sessionPromise
  },

  async startExternal() {
    const url = document.getElementById('externalVoiceUrl').value.trim()
    if (!url) throw new Error('External voice WebSocket URL is required')
    const ws = new WebSocket(url)
    await new Promise((resolve, reject) => {
      ws.onopen = resolve
      ws.onerror = () => reject(new Error('WebSocket connection failed'))
      setTimeout(() => reject(new Error('Connection timeout')), 10000)
    })
    this.externalWs = ws
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        document.getElementById('spartaTranscript').textContent = `SPARTA: ${data.text || data.transcript || '(audio)'}`
      } catch { /* binary audio data, ignore for transcript */ }
    }
  },

  playAudioChunk(base64) {
    const raw = this.base64ToBytes(base64)
    this.outputCtx.decodeAudioData(raw.buffer, (buf) => {
      const src = this.outputCtx.createBufferSource()
      src.buffer = buf
      src.connect(this.outputCtx.destination)
      this.nextStartTime = Math.max(this.nextStartTime, this.outputCtx.currentTime)
      src.start(this.nextStartTime)
      this.nextStartTime += buf.duration
      this.outputSources.add(src)
      src.onended = () => this.outputSources.delete(src)
    }, () => {})
  },

  stopAllSources() {
    for (const s of this.outputSources.values()) { try { s.stop() } catch {} }
    this.outputSources.clear()
    this.nextStartTime = 0
  },

  stop() {
    this.active = false
    this.stopAllSources()
    if (this.session) { try { this.session.close() } catch {} this.session = null }
    if (this.workletNode) { try { this.workletNode.disconnect() } catch {} this.workletNode = null }
    if (this.mediaStream) { this.mediaStream.getTracks().forEach(t => t.stop()); this.mediaStream = null }
    if (this.inputCtx) { try { this.inputCtx.close() } catch {} this.inputCtx = null }
    if (this.outputCtx) { try { this.outputCtx.close() } catch {} this.outputCtx = null }
    if (this.externalWs) { try { this.externalWs.close() } catch {} this.externalWs = null }
    const btn = document.getElementById('voiceBtn')
    btn.textContent = 'INITIALIZE LIVE COMMS'
    btn.className = 'btn btn-emerald'
    btn.disabled = false
    document.getElementById('voiceBadge').textContent = 'DISCONNECTED'
    document.getElementById('voiceBadge').className = 'badge'
    const vs = document.getElementById('voiceVisualizer')
    vs.querySelector('.voice-standby').classList.remove('hidden')
    document.getElementById('voiceTranscript').classList.add('hidden')
  },

  createPcmBlob(float32Data) {
    const int16 = new Int16Array(float32Data.length)
    for (let i = 0; i < float32Data.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Data[i]))
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }
    return new Blob([int16.buffer], { type: 'audio/L16;rate=16000' })
  },

  base64ToBytes(b64) {
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const sourceSelect = document.getElementById('voiceSource')
  const extOptions = document.getElementById('externalVoiceOptions')
  sourceSelect.addEventListener('change', () => {
    extOptions.classList.toggle('hidden', sourceSelect.value !== 'external')
  })
  document.getElementById('voiceBtn').addEventListener('click', () => VoiceModule.toggle())
})
