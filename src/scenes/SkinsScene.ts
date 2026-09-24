import Phaser from 'phaser'
import { audio } from '../game/audio'
import { drawHole } from '../game/hole'
import { SKINS, type SkinId } from '../game/skinData'
import { loadSave, refreshUnlocks, saveGame, totalStars } from '../game/save'
import { fadeIn, fadeTo, label, makeButton } from '../game/ui'

export class SkinsScene extends Phaser.Scene {
  private clock = 0
  private previews: { g: Phaser.GameObjects.Graphics; x: number; y: number; id: SkinId }[] = []
  private toastText?: Phaser.GameObjects.Text

  constructor() {
    super('skins')
  }

  create() {
    audio.setBed('menu')
    fadeIn(this)
    this.add.image(360, 640, 'bg')
    const save = loadSave()
    refreshUnlocks(save)
    makeButton(this, 110, 64, 160, 68, '返回', 'grey', () => this.back())
    label(this, 430, 52, '黑洞皮肤', 34, '#fff6ea').setOrigin(0.5)
    label(this, 430, 90, `${save.coins} 金币 · ${totalStars(save)} 星`, 18, '#f0d2b4').setOrigin(0.5)

    this.previews = []
    SKINS.forEach((skin, index) => {
      const y = 150 + index * 210
      const card = this.add.graphics()
      card.fillStyle(0xfff6ea, 1)
      card.fillRoundedRect(36, y, 648, 192, 26)
      card.lineStyle(4, save.skin === skin.id ? 0xff8a3d : 0xe4c7a4, 1)
      card.strokeRoundedRect(36, y, 648, 192, 26)
      const g = this.add.graphics()
      this.previews.push({ g, x: 130, y: y + 96, id: skin.id })
      label(this, 210, y + 36, skin.name, 30, '#3b2418')
      label(this, 210, y + 78, skin.desc, 20, '#7a5344')
      const owned = save.owned.includes(skin.id)
      const extra =
        skin.price <= 0
          ? '默认拥有'
          : owned
            ? '已解锁'
            : `${skin.price} 金币${skin.freeLevel ? ` · 或通关第 ${skin.freeLevel} 关` : ''}${skin.freeStars ? ` · 或 ${skin.freeStars} 星` : ''}`
      label(this, 210, y + 112, extra, 18, '#8a5340', { wordWrap: { width: 280 } })
      const equipped = save.skin === skin.id
      const tone = equipped ? 'grey' : owned ? 'green' : 'yellow'
      const text = equipped ? '使用中' : owned ? '使用' : '解锁'
      makeButton(this, 560, y + 130, 180, 72, text, tone, () => this.pick(skin.id))
    })

    label(this, 360, 1224, '通关或攒星也会免费解锁，不必只靠金币', 18, '#e7d3c4').setOrigin(0.5)
  }

  update(_time: number, delta: number) {
    this.clock += Math.min(0.033, delta / 1000)
    for (const preview of this.previews) drawHole(preview.g, preview.x, preview.y, 52, preview.id, this.clock)
  }

  private pick(id: SkinId) {
    const save = loadSave()
    const skin = SKINS.find((entry) => entry.id === id)
    if (!skin) return
    if (save.skin === id) return
    if (!save.owned.includes(id)) {
      if (save.coins < skin.price || skin.price <= 0) {
        this.toast('金币不够')
        audio.play('error', 0.6)
        return
      }
      save.coins -= skin.price
      save.owned.push(id)
    }
    save.skin = id
    saveGame(save)
    audio.confirm()
    this.scene.restart()
  }

  private toast(message: string) {
    this.toastText?.destroy()
    this.toastText = label(this, 360, 1168, message, 22, '#fff6ea').setOrigin(0.5).setDepth(20)
    this.tweens.add({
      targets: this.toastText,
      alpha: 0,
      delay: 700,
      duration: 280,
      onComplete: () => this.toastText?.destroy(),
    })
  }

  private back() {
    fadeTo(this, (this.registry.get('backScene') as string) || 'title')
  }
}
