import Phaser from 'phaser'
import { label, makeButton } from './ui'

/**
 * Mock rewarded placement. Resolves true after the countdown is claimed.
 * Replace this function when a real ad SDK is wired up; callers only need the boolean.
 */
export function openRewardedSlot(scene: Phaser.Scene, rewardLabel: string): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false
    const root = scene.add.container(0, 0).setDepth(400)
    const dim = scene.add.graphics()
    dim.fillStyle(0x100c0a, 0.78)
    dim.fillRect(0, 0, 720, 1280)
    root.add(dim)

    const card = scene.add.graphics()
    card.fillStyle(0xfff6ea, 1)
    card.fillRoundedRect(70, 360, 580, 520, 32)
    card.lineStyle(6, 0xe4c7a4, 1)
    card.strokeRoundedRect(70, 360, 580, 520, 32)
    root.add(card)

    root.add(label(scene, 360, 420, '激励视频', 40, '#3b2418').setOrigin(0.5))
    root.add(label(scene, 360, 470, '试投占位 · 不会请求真实广告', 20, '#7a5344').setOrigin(0.5))
    root.add(label(scene, 360, 530, `看完即可获得：${rewardLabel}`, 24, '#3b2418').setOrigin(0.5))

    const bar = scene.add.graphics()
    root.add(bar)
    const barX = 140
    const barY = 590

    let elapsed = 0
    let ready = false
    const claim = makeButton(scene, 360, 700, 420, 88, '播放中…', 'yellow', () => finish(true))
    claim.setEnabled(false)
    root.add(claim.root)
    const skip = makeButton(scene, 360, 800, 420, 80, '放弃奖励', 'grey', () => finish(false))
    root.add(skip.root)

    const drawBar = (p: number) => {
      bar.clear()
      bar.fillStyle(0xead8c4, 1)
      bar.fillRoundedRect(barX, barY, 440, 18, 9)
      bar.fillStyle(0x3cba6a, 1)
      bar.fillRoundedRect(barX, barY, Math.max(18, 440 * p), 18, 9)
    }
    drawBar(0)

    const onUpdate = (_time: number, delta: number) => {
      if (ready) return
      elapsed += delta / 1000
      const p = Math.min(1, elapsed / 3.2)
      drawBar(p)
      if (p >= 1) {
        ready = true
        claim.setEnabled(true)
        claim.setLabel('领取奖励')
      }
    }
    scene.events.on('update', onUpdate)

    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      scene.events.off('update', onUpdate)
      claim.root.destroy()
      skip.root.destroy()
      root.destroy()
      resolve(ok)
    }
    scene.events.once('shutdown', () => finish(false))
  })
}
