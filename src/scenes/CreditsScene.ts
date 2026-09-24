import Phaser from 'phaser'
import { audio } from '../game/audio'
import { fadeIn, fadeTo, label, makeButton } from '../game/ui'

const LINES = [
  '黑洞、食物、炸弹和桌面为原创扁平绘制。',
  '界面按钮、星星、箭头来自 Kenney UI Pack。',
  '吞噬碎屑来自 Kenney Particle Pack。',
  '按钮与撞击声来自 Kenney Interface Sounds、Impact Sounds。',
  '以上 Kenney 素材均为 CC0 1.0，可商用，署名非强制。',
  '作者 Kenney · kenney.nl',
  '中文界面字体为 Noto Sans CJK SC 子集。',
  '字体许可：SIL Open Font License 1.1。',
  '吞噬 whoosh、失败嗡声、过关旋律和背景音乐为原创合成。',
  '激励视频是试投占位，不会请求广告网络。',
]

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('credits')
  }

  create() {
    audio.setBed('menu')
    fadeIn(this)
    this.add.image(360, 640, 'bg')
    const card = this.add.graphics()
    card.fillStyle(0xfff6ea, 0.96)
    card.fillRoundedRect(40, 150, 640, 900, 28)
    label(this, 360, 190, '素材致谢', 36, '#3b2418').setOrigin(0.5)
    LINES.forEach((line, index) => {
      label(this, 80, 260 + index * 64, line, 22, '#3b2418', { wordWrap: { width: 560 } })
    })
    makeButton(this, 360, 1160, 320, 80, '返回', 'green', () => {
      fadeTo(this, (this.registry.get('backScene') as string) || 'title')
    })
  }
}
