import Phaser from 'phaser'
import { audio } from '../game/audio'
import { drawHole } from '../game/hole'
import { objKey, type Kind } from '../game/kinds'
import { LEVEL_COUNT } from '../game/levels'
import { checkinView, loadSave, saveGame, totalStars } from '../game/save'
import { fadeIn, fadeTo, label, makeButton, openModal } from '../game/ui'

const DEMO: Kind[] = ['berry', 'cookie', 'gem', 'orange', 'star']

export class TitleScene extends Phaser.Scene {
  private clock = 0
  private holeG!: Phaser.GameObjects.Graphics
  private demo: { img: Phaser.GameObjects.Image; ang: number; gulp: number; kind: Kind }[] = []
  private nextGulp = 0.8
  private modal: { close: () => void } | null = null

  constructor() {
    super('title')
  }

  create() {
    audio.setBed('menu')
    fadeIn(this)
    this.add.image(360, 640, 'bg')
    const save = loadSave()
    const stars = totalStars(save)
    const latest = Math.min(save.unlocked, LEVEL_COUNT)
    const clearedAll = save.unlocked > LEVEL_COUNT

    label(this, 360, 78, '超休闲 · 竖屏一口吞', 20, '#f0d2b4').setOrigin(0.5)

    const sign = this.add.graphics()
    sign.fillStyle(0xfff6ea, 1)
    sign.fillRoundedRect(70, 112, 580, 132, 28)
    sign.lineStyle(5, 0xe4c7a4, 1)
    sign.strokeRoundedRect(70, 112, 580, 132, 28)
    label(this, 360, 158, '黑洞一口吞', 64, '#3b2418').setOrigin(0.5)
    label(this, 360, 214, '拖动黑洞，把桌子吃干净', 24, '#7a5344').setOrigin(0.5)

    const dish = this.add.graphics()
    dish.fillStyle(0x5a3a28, 1)
    dish.fillCircle(360, 470, 168)
    dish.fillStyle(0xf3d2a8, 1)
    dish.fillCircle(360, 466, 156)
    dish.lineStyle(8, 0xd7b188, 1)
    dish.strokeCircle(360, 466, 148)

    this.holeG = this.add.graphics().setDepth(5)
    this.demo = DEMO.map((kind, index) => {
      const img = this.add.image(360, 470, objKey(kind)).setDisplaySize(72, 72).setDepth(3)
      return { img, ang: (index / DEMO.length) * Math.PI * 2, gulp: -1, kind }
    })

    const primary = clearedAll ? '再挑战终关' : save.unlocked > 1 ? '继续闯关' : '开始游戏'
    makeButton(this, 360, 760, 500, 96, primary, 'green', () => this.startRun(latest))
    makeButton(this, 360, 868, 500, 80, '关卡地图', 'blue', () => {
      this.registry.set('mapPage', Math.floor((latest - 1) / 6))
      fadeTo(this, 'map')
    })

    const actions: { label: string; scene: string; dot: boolean }[] = [
      { label: '签到', scene: 'checkin', dot: checkinView(save).canClaim },
      { label: '皮肤', scene: 'skins', dot: false },
      { label: '设置', scene: 'settings', dot: false },
    ]
    actions.forEach((action, index) => {
      const x = 150 + index * 210
      const button = makeButton(this, x, 990, 190, 78, action.label, index === 0 ? 'yellow' : 'grey', () => {
        this.registry.set('backScene', 'title')
        fadeTo(this, action.scene)
      })
      if (action.dot) {
        const dot = this.add.circle(x + 70, 958, 8, 0xff4d3a).setStrokeStyle(3, 0xfff6ea)
        dot.setDepth(button.root.depth + 1)
      }
    })

    label(this, 360, 1108, `第 ${latest} 关可玩 · ${stars} 星 · ${save.coins} 金币`, 22, '#f0d2b4').setOrigin(0.5)
    makeButton(this, 200, 1196, 220, 70, '怎么玩', 'grey', () => this.showHow(false))
    makeButton(this, 520, 1196, 220, 70, '致谢', 'grey', () => {
      this.registry.set('backScene', 'title')
      fadeTo(this, 'credits')
    })

  }

  update(_time: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000)
    this.clock += dt
    const save = loadSave()
    drawHole(this.holeG, 360, 470, 78, save.skin, this.clock)
    this.nextGulp -= dt
    if (this.nextGulp <= 0) {
      const idle = this.demo.find((bit) => bit.gulp < 0)
      if (idle) idle.gulp = 0.0001
      this.nextGulp = 1.35
    }
    for (const bit of this.demo) {
      if (bit.gulp < 0) {
        bit.ang += dt * 0.65
        bit.img.setPosition(360 + Math.cos(bit.ang) * 150, 470 + Math.sin(bit.ang) * 78)
        bit.img.setScale(72 / bit.img.width)
        bit.img.setAlpha(1)
      } else {
        bit.gulp += dt
        const k = Math.min(1, bit.gulp / 0.32)
        bit.img.x += (360 - bit.img.x) * Math.min(1, dt * 8)
        bit.img.y += (470 - bit.img.y) * Math.min(1, dt * 8)
        bit.img.setScale((72 / bit.img.width) * (1 - k))
        bit.img.rotation += dt * 8
        if (bit.gulp > 0.34) {
          bit.gulp = -1
          bit.ang = Math.random() * Math.PI * 2
          bit.img.rotation = 0
        }
      }
    }
  }

  private startRun(levelId: number) {
    const go = () => {
      this.registry.set('levelId', levelId)
      audio.setBed('play')
      fadeTo(this, 'play')
    }
    if (!loadSave().seenHow) {
      this.showHow(true, go)
      return
    }
    go()
  }

  private showHow(thenStart: boolean, go?: () => void) {
    this.modal?.close()
    this.modal = openModal(this, {
      title: '怎么玩',
      lines: [
        '1. 按住桌面，拖动黑洞',
        '2. 先吞小的，洞才会变大',
        '3. 炸弹、辣椒、仙人掌会失败',
        '三星：剩余时间过半，且不用道具和复活',
      ],
      buttons: [
        {
          label: thenStart ? '开始吞噬' : '知道了',
          tone: 'green',
          onClick: () => {
            const save = loadSave()
            save.seenHow = true
            saveGame(save)
            this.modal?.close()
            this.modal = null
            go?.()
          },
        },
      ],
    })
  }
}
