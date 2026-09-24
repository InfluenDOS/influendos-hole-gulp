import Phaser from 'phaser'
import { audio } from '../game/audio'
import { LEVELS, PAGE_TITLES } from '../game/levels'
import { getStars, loadSave, totalStars } from '../game/save'
import { fadeIn, fadeTo, label, makeButton } from '../game/ui'

export class MapScene extends Phaser.Scene {
  private ring!: Phaser.GameObjects.Graphics
  private pulse: { x: number; y: number } | null = null
  private toastText?: Phaser.GameObjects.Text

  constructor() {
    super('map')
  }

  create() {
    audio.setBed('menu')
    fadeIn(this)
    this.add.image(360, 640, 'bg')
    const save = loadSave()
    const pageCount = Math.ceil(LEVELS.length / 6)
    const stored = Number(this.registry.get('mapPage') ?? 0)
    const page = Phaser.Math.Clamp(stored, 0, pageCount - 1)
    this.registry.set('mapPage', page)

    makeButton(this, 110, 70, 160, 70, '返回', 'grey', () => fadeTo(this, 'title'))
    label(this, 400, 52, '关卡地图', 36, '#fff6ea').setOrigin(0.5, 0)
    label(this, 400, 96, `${PAGE_TITLES[page] ?? ''} · ${totalStars(save)} / ${LEVELS.length * 3} 星`, 20, '#f0d2b4').setOrigin(0.5, 0)

    const slice = LEVELS.slice(page * 6, page * 6 + 6)
    const points = slice.map((_, index) => ({
      x: index % 2 === 0 ? 230 : 490,
      y: 250 + index * 145,
    }))
    const path = this.add.graphics()
    if (points.length > 1) {
      path.lineStyle(10, 0xf0d2b0, 1)
      path.beginPath()
      path.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) path.lineTo(points[i].x, points[i].y)
      path.strokePath()
    }

    this.pulse = null
    slice.forEach((level, index) => {
      const { x, y } = points[index]
      const open = level.id <= save.unlocked
      const stars = getStars(level.id, save)
      const current = level.id === Math.min(save.unlocked, LEVELS.length)
      const g = this.add.graphics()
      g.fillStyle(open ? 0xfff6ea : 0xcbb5a4, 1)
      g.fillCircle(x, y, 46)
      g.lineStyle(5, current ? 0xff8a3d : stars > 0 ? 0x1f9d55 : 0xe4c7a4, 1)
      g.strokeCircle(x, y, 46)
      label(this, x, y - 2, String(level.id), 28, open ? '#3b2418' : '#7a6558').setOrigin(0.5)
      label(this, x, y + 62, level.name, 18, '#fff6ea').setOrigin(0.5)
      if (open) {
        for (let s = 0; s < 3; s++) {
          const star = this.add.image(x - 28 + s * 28, y + 86, s < stars ? 'star' : 'star-grey')
          star.setDisplaySize(24, 22)
        }
      } else {
        label(this, x, y + 86, '未解锁', 16, '#e7d3c4').setOrigin(0.5)
      }
      if (current) this.pulse = { x, y }
      const zone = this.add.zone(x, y, 120, 150).setInteractive({ useHandCursor: open })
      zone.on('pointerup', () => {
        if (!open) {
          this.toast('先通过上一关')
          audio.play('error', 0.6)
          return
        }
        this.registry.set('levelId', level.id)
        audio.setBed('play')
        fadeTo(this, 'play')
      })
    })

    this.ring = this.add.graphics().setDepth(4)
    makeButton(this, 180, 1188, 200, 74, '上一页', page === 0 ? 'grey' : 'blue', () => {
      if (page === 0) return
      this.registry.set('mapPage', page - 1)
      this.scene.restart()
    })
    makeButton(this, 540, 1188, 200, 74, '下一页', page >= pageCount - 1 ? 'grey' : 'blue', () => {
      if (page >= pageCount - 1) return
      this.registry.set('mapPage', page + 1)
      this.scene.restart()
    })
    label(this, 360, 1188, `${page + 1} / ${pageCount}`, 22, '#fff6ea').setOrigin(0.5)
  }

  update() {
    this.ring.clear()
    if (!this.pulse) return
    const alpha = 0.35 + Math.sin(this.time.now / 200) * 0.35
    this.ring.lineStyle(6, 0xff8a3d, alpha)
    this.ring.strokeCircle(this.pulse.x, this.pulse.y, 56)
  }

  private toast(message: string) {
    this.toastText?.destroy()
    this.toastText = label(this, 360, 1090, message, 22, '#fff6ea').setOrigin(0.5)
    this.tweens.add({
      targets: this.toastText,
      alpha: 0,
      delay: 700,
      duration: 300,
      onComplete: () => this.toastText?.destroy(),
    })
  }
}
