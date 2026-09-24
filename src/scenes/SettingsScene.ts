import Phaser from 'phaser'
import { audio } from '../game/audio'
import { loadSave, saveGame } from '../game/save'
import { fadeIn, fadeTo, label, makeButton } from '../game/ui'

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('settings')
  }

  create() {
    audio.setBed('menu')
    fadeIn(this)
    this.add.image(360, 640, 'bg')
    const save = loadSave()
    makeButton(this, 110, 70, 160, 70, '返回', 'grey', () => fadeTo(this, (this.registry.get('backScene') as string) || 'title'))
    label(this, 430, 70, '设置', 40, '#fff6ea').setOrigin(0.5)

    const rows: { title: string; detail: string; on: boolean; key: 'sfx' | 'music' | 'vibrate' }[] = [
      { title: '音效', detail: '吞噬、按钮和失败声', on: save.settings.sfx, key: 'sfx' },
      { title: '音乐', detail: '菜单和局内的轻音乐', on: save.settings.music, key: 'music' },
      { title: '震动', detail: '吞大和失败时短震一下', on: save.settings.vibrate, key: 'vibrate' },
    ]
    rows.forEach((row, index) => {
      const y = 240 + index * 170
      const card = this.add.graphics()
      card.fillStyle(0xfff6ea, 1)
      card.fillRoundedRect(48, y, 624, 140, 26)
      label(this, 84, y + 40, row.title, 32, '#3b2418')
      label(this, 84, y + 86, row.detail, 20, '#7a5344')
      makeButton(this, 540, y + 70, 160, 72, row.on ? '已开' : '已关', row.on ? 'green' : 'grey', () => {
        const data = loadSave()
        data.settings[row.key] = !data.settings[row.key]
        saveGame(data)
        audio.apply(data.settings)
        audio.play('toggle', 0.7)
        this.scene.restart()
      })
    })

    makeButton(this, 360, 820, 420, 84, '素材致谢', 'blue', () => {
      this.registry.set('backScene', 'settings')
      fadeTo(this, 'credits')
    })
    label(this, 360, 940, '进度、星级、皮肤和签到都保存在本地。', 22, '#f0d2b4', {
      align: 'center',
      wordWrap: { width: 560 },
    }).setOrigin(0.5, 0)
    label(this, 360, 1020, '清除浏览器网站数据会丢掉存档。', 22, '#f0d2b4', {
      align: 'center',
      wordWrap: { width: 560 },
    }).setOrigin(0.5, 0)
  }
}
