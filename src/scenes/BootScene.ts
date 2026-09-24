import Phaser from 'phaser'
import { IMAGE_MANIFEST, asset } from '../game/assets'
import { audio } from '../game/audio'
import { loadSave } from '../game/save'
import { buildTextures } from '../game/textures'

export class BootScene extends Phaser.Scene {
  private started = false
  private failSafe = 0

  constructor() {
    super('boot')
  }

  init() {
    this.failSafe = window.setTimeout(() => this.enterTitle(), 4000)
  }

  preload() {
    this.load.xhr.timeout = 2500
    for (const [key, path] of Object.entries(IMAGE_MANIFEST)) {
      this.load.image(key, asset(path))
    }
  }

  create() {
    void this.finish()
  }

  private async finish() {
    buildTextures(this)
    paintMissingUi(this)
    await Promise.race([
      Promise.all([
        audio.load(),
        document.fonts.load('bold 48px "Noto Sans SC"').catch(() => undefined),
      ]),
      new Promise((resolve) => window.setTimeout(resolve, 2000)),
    ])
    this.enterTitle()
  }

  private enterTitle() {
    if (this.started) return
    this.started = true
    window.clearTimeout(this.failSafe)
    buildTextures(this)
    paintMissingUi(this)
    audio.apply(loadSave().settings)
    document.getElementById('boot')?.remove()
    if (!this.scene.isActive('title')) this.scene.start('title')
  }
}

const BTN: Record<string, string> = {
  green: '#3cbe6e',
  yellow: '#ffc44d',
  red: '#f05a4a',
  blue: '#4aa6ea',
  grey: '#d9c4b4',
}

function paintMissingUi(scene: Phaser.Scene) {
  for (const [tone, color] of Object.entries(BTN)) {
    paint(scene, `btn-${tone}`, 192, 64, (ctx) => {
      roundRect(ctx, 2, 2, 188, 60, 16, color, '#ffffff33')
    })
    paint(scene, `round-${tone}`, 128, 128, (ctx) => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(64, 64, 58, 0, Math.PI * 2)
      ctx.fill()
    })
  }
  paint(scene, 'star', 64, 64, (ctx) => star(ctx, '#ffc44d'))
  paint(scene, 'star-grey', 64, 64, (ctx) => star(ctx, '#c3b2a4'))
  paint(scene, 'star-outline', 64, 64, (ctx) => star(ctx, '#fff6ea'))
  paint(scene, 'check', 64, 64, (ctx) => {
    ctx.strokeStyle = '#1f9d55'
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(12, 34)
    ctx.lineTo(26, 48)
    ctx.lineTo(52, 16)
    ctx.stroke()
  })
  paint(scene, 'cross', 64, 64, (ctx) => {
    ctx.strokeStyle = '#e23b2f'
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(16, 16)
    ctx.lineTo(48, 48)
    ctx.moveTo(48, 16)
    ctx.lineTo(16, 48)
    ctx.stroke()
  })
  paint(scene, 'arrow-left', 64, 64, (ctx) => arrow(ctx, true))
  paint(scene, 'arrow-right', 64, 64, (ctx) => arrow(ctx, false))
  paint(scene, 'p-circle', 32, 32, (ctx) => {
    ctx.fillStyle = '#fff6ea'
    ctx.beginPath()
    ctx.arc(16, 16, 12, 0, Math.PI * 2)
    ctx.fill()
  })
  paint(scene, 'p-star', 32, 32, (ctx) => star(ctx, '#ffe08a', 16, 16, 12))
  paint(scene, 'p-spark', 32, 32, (ctx) => {
    ctx.strokeStyle = '#fff6ea'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(16, 2)
    ctx.lineTo(16, 30)
    ctx.moveTo(2, 16)
    ctx.lineTo(30, 16)
    ctx.stroke()
  })
  paint(scene, 'p-twirl', 32, 32, (ctx) => {
    ctx.strokeStyle = '#fff6ea'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(16, 16, 10, 0, Math.PI * 1.6)
    ctx.stroke()
  })
  paint(scene, 'p-magic', 32, 32, (ctx) => star(ctx, '#fff6ea', 16, 16, 10))
}

function paint(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
) {
  if (scene.textures.exists(key)) return
  const canvas = scene.textures.createCanvas(key, w, h)
  if (!canvas) return
  draw(canvas.getContext())
  canvas.refresh()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke: string,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth = 3
  ctx.stroke()
}

function star(ctx: CanvasRenderingContext2D, color: string, cx = 32, cy = 32, outer = 26) {
  const inner = outer * 0.45
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function arrow(ctx: CanvasRenderingContext2D, left: boolean) {
  ctx.fillStyle = '#fff6ea'
  ctx.beginPath()
  if (left) {
    ctx.moveTo(14, 32)
    ctx.lineTo(40, 12)
    ctx.lineTo(40, 52)
  } else {
    ctx.moveTo(50, 32)
    ctx.lineTo(24, 12)
    ctx.lineTo(24, 52)
  }
  ctx.closePath()
  ctx.fill()
}
