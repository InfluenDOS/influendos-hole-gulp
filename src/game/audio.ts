import { asset } from './assets'
import type { Settings } from './save'

const FILES: Record<string, string> = {
  click: 'assets/kenney/audio/click.mp3',
  confirm: 'assets/kenney/audio/confirm.mp3',
  confirm2: 'assets/kenney/audio/confirm2.mp3',
  error: 'assets/kenney/audio/error.mp3',
  open: 'assets/kenney/audio/open.mp3',
  toggle: 'assets/kenney/audio/toggle.mp3',
  tick: 'assets/kenney/audio/tick.mp3',
  drop: 'assets/kenney/audio/drop.mp3',
  plate: 'assets/kenney/audio/plate.mp3',
  plate2: 'assets/kenney/audio/plate2.mp3',
  pop1: 'assets/kenney/audio/pop1.mp3',
  pop2: 'assets/kenney/audio/pop2.mp3',
  pop3: 'assets/kenney/audio/pop3.mp3',
  thud: 'assets/kenney/audio/thud.mp3',
  glass: 'assets/kenney/audio/glass.mp3',
  bell: 'assets/kenney/audio/bell.mp3',
  bump: 'assets/kenney/audio/bump.mp3',
  wood: 'assets/kenney/audio/wood.mp3',
}

const POPS = ['pop1', 'pop2', 'pop3', 'plate', 'plate2', 'glass', 'drop']
const PENT = [196, 220, 247, 262, 294, 330, 392, 440]
const MELODY = [0, 2, 4, 2, 3, 2, 4, 3, 0, 1, 2, 4, 3, 2, 1, 0]

class AudioBus {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private raw = new Map<string, ArrayBuffer>()
  private buffers = new Map<string, AudioBuffer>()
  private sfxOn = true
  private musicOn = true
  private bed: 'menu' | 'play' = 'menu'
  private clockOn = false
  private step = 0
  private nextNote = 0
  private noise: AudioBuffer | null = null

  async load() {
    await Promise.all(
      Object.entries(FILES).map(async ([name, path]) => {
        try {
          const res = await fetch(asset(path), { signal: AbortSignal.timeout(2500) })
          if (!res.ok) return
          this.raw.set(name, await res.arrayBuffer())
        } catch {
          /* missing file or slow response: procedural sounds still play */
        }
      }),
    )
  }

  apply(settings: Settings) {
    this.sfxOn = settings.sfx
    this.musicOn = settings.music
  }

  setBed(bed: 'menu' | 'play') {
    this.bed = bed
  }

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.9
      this.master.connect(this.ctx.destination)
      this.noise = this.makeNoise()
      for (const [name, raw] of this.raw) {
        void this.ctx.decodeAudioData(raw.slice(0)).then((buf) => {
          this.buffers.set(name, buf)
        }).catch(() => undefined)
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    this.startClock()
  }

  play(name: string, volume = 0.8) {
    if (!this.sfxOn || !this.ctx || !this.master) return
    const buf = this.buffers.get(name)
    if (!buf) return
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const gain = this.ctx.createGain()
    gain.gain.value = volume
    src.connect(gain)
    gain.connect(this.master)
    src.start()
  }

  click() {
    this.play('click', 0.7)
  }

  confirm() {
    this.play('confirm', 0.75)
  }

  gulp(big: boolean) {
    const name = POPS[Math.floor(Math.random() * POPS.length)]
    this.play(name, big ? 0.85 : 0.62)
    if (big) this.play('bell', 0.35)
    this.whoosh(big)
  }

  bump() {
    this.play(Math.random() < 0.5 ? 'bump' : 'wood', 0.55)
  }

  fail() {
    this.play('thud', 0.9)
    this.play('error', 0.55)
    this.buzz()
  }

  win() {
    this.play('confirm2', 0.7)
    this.jingle()
  }

  tick() {
    this.play('tick', 0.45)
  }

  private startClock() {
    if (this.clockOn || !this.ctx) return
    this.clockOn = true
    this.nextNote = this.ctx.currentTime + 0.2
    const loop = () => {
      this.advanceMusic()
      window.setTimeout(loop, 80)
    }
    loop()
  }

  private advanceMusic() {
    if (!this.ctx || !this.musicOn) return
    const now = this.ctx.currentTime
    while (this.nextNote < now + 0.12) {
      const degree = MELODY[this.step % MELODY.length]
      this.tone(PENT[degree], this.nextNote, 0.36, this.bed === 'play' ? 0.018 : 0.04)
      this.step += 1
      this.nextNote += 0.46
    }
  }

  private tone(freq: number, when: number, dur: number, volume: number) {
    if (!this.ctx || !this.master) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()
    osc.type = 'triangle'
    osc.frequency.value = freq
    filter.type = 'lowpass'
    filter.frequency.value = 1400
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    osc.start(when)
    osc.stop(when + dur + 0.02)
  }

  private whoosh(big: boolean) {
    if (!this.sfxOn || !this.ctx || !this.master || !this.noise) return
    const t = this.ctx.currentTime
    const src = this.ctx.createBufferSource()
    src.buffer = this.noise
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(big ? 2200 : 1600, t)
    filter.frequency.exponentialRampToValueAtTime(180, t + 0.18)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(big ? 0.28 : 0.18, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    src.start(t)
    src.stop(t + 0.22)
    const osc = this.ctx.createOscillator()
    const og = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(big ? 620 : 480, t)
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.14)
    og.gain.setValueAtTime(0.0001, t)
    og.gain.exponentialRampToValueAtTime(0.12, t + 0.015)
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
    osc.connect(og)
    og.connect(this.master)
    osc.start(t)
    osc.stop(t + 0.16)
  }

  private buzz() {
    if (!this.sfxOn || !this.ctx || !this.master) return
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const osc2 = this.ctx.createOscillator()
    const filter = this.ctx.createBiquadFilter()
    const gain = this.ctx.createGain()
    osc.type = 'sawtooth'
    osc2.type = 'square'
    osc.frequency.setValueAtTime(90, t)
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.38)
    osc2.frequency.setValueAtTime(55, t)
    filter.type = 'lowpass'
    filter.frequency.value = 240
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42)
    osc.connect(filter)
    osc2.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    osc.start(t)
    osc2.start(t)
    osc.stop(t + 0.44)
    osc2.stop(t + 0.44)
  }

  private jingle() {
    if (!this.sfxOn || !this.ctx) return
    const start = this.ctx.currentTime + 0.02
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => this.tone(freq, start + i * 0.09, 0.22, 0.07))
  }

  private makeNoise(): AudioBuffer | null {
    if (!this.ctx) return null
    const length = Math.floor(this.ctx.sampleRate * 0.25)
    const buf = this.ctx.createBuffer(1, length, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
    return buf
  }
}

export const audio = new AudioBus()
