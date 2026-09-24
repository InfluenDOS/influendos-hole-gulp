import Phaser from 'phaser'
import { audio } from '../game/audio'
import { CHECKIN_REWARDS, checkinView, claimCheckin, loadSave } from '../game/save'
import { fadeIn, fadeTo, label, makeButton } from '../game/ui'

export class CheckinScene extends Phaser.Scene {
  constructor() {
    super('checkin')
  }

  create() {
    audio.setBed('menu')
    fadeIn(this)
    this.add.image(360, 640, 'bg')
    const save = loadSave()
    const view = checkinView(save)
    makeButton(this, 110, 70, 160, 70, '返回', 'grey', () => this.back())
    label(this, 430, 58, '每日签到', 36, '#fff6ea').setOrigin(0.5)
    label(this, 360, 130, view.note, 22, '#f0d2b4', { align: 'center', wordWrap: { width: 640 } }).setOrigin(0.5)
    label(this, 360, 172, `当前金币 ${save.coins}`, 20, '#ffe08a').setOrigin(0.5)

    CHECKIN_REWARDS.forEach((reward, index) => {
      const day = index + 1
      const y = 220 + index * 92
      const today = day === view.today
      const claimed = day <= view.claimed
      const g = this.add.graphics()
      g.fillStyle(0xfff6ea, 1)
      g.fillRoundedRect(48, y, 624, 80, 22)
      if (today) {
        g.lineStyle(5, 0xff8a3d, 1)
        g.strokeRoundedRect(48, y, 624, 80, 22)
      }
      label(this, 92, y + 40, `第${day}天`, 24, '#3b2418').setOrigin(0, 0.5)
      label(this, 230, y + 40, reward.label, 24, '#7a5344').setOrigin(0, 0.5)
      const state = claimed ? '已领取' : today && view.canClaim ? '今天' : today ? '已领取' : '未到'
      label(this, 620, y + 40, state, 22, claimed || (today && !view.canClaim) ? '#1f9d55' : '#c47a3a').setOrigin(1, 0.5)
    })

    makeButton(this, 360, 1120, 480, 90, view.canClaim ? '领取今日奖励' : '今天已经领过', view.canClaim ? 'yellow' : 'grey', () => {
      if (!view.canClaim) return
      const result = claimCheckin()
      if (!result.ok) {
        audio.play('error', 0.6)
        return
      }
      audio.confirm()
      this.scene.restart()
    })
    label(this, 360, 1208, '签到存在这台设备上，断签会从第 1 天重来', 18, '#e7d3c4').setOrigin(0.5)
  }

  private back() {
    const target = (this.registry.get('backScene') as string) || 'title'
    fadeTo(this, target)
  }
}
