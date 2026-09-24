import Phaser from 'phaser'
import { skinById, type SkinId } from './skinData'

export function drawHole(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  r: number,
  skinId: SkinId,
  time: number,
) {
  const skin = skinById(skinId)
  g.clear()
  if (r < 4) return

  g.fillStyle(0x000000, 0.22)
  g.fillEllipse(x + 6, y + r * 0.22, r * 2.15, r * 0.72)

  g.fillStyle(skin.void, 1)
  g.fillCircle(x, y, r * 0.7)

  g.lineStyle(Math.max(7, r * 0.16), skin.rimHi, 1)
  g.strokeCircle(x, y, r * 0.94)
  g.lineStyle(Math.max(4, r * 0.07), skin.rim, 1)
  g.strokeCircle(x, y, r * 0.8)

  g.lineStyle(Math.max(2, r * 0.045), skin.swirl, 0.85)
  const turns = skinId === 'lava' ? 4 : 3
  for (let i = 0; i < turns; i++) {
    const a0 = time * (skinId === 'mint' ? 1.6 : 2.5) + (i * Math.PI * 2) / turns
    g.beginPath()
    g.arc(x, y, r * (0.34 + i * 0.08), a0, a0 + 1.15, false)
    g.strokePath()
  }

  g.lineStyle(Math.max(3, r * 0.08), 0xffffff, 0.28)
  g.beginPath()
  g.arc(x, y, r * 0.9, -2.4, -1.15, false)
  g.strokePath()

  if (skinId === 'galaxy') {
    for (let i = 0; i < 6; i++) {
      const a = time * 1.4 + i * 1.2
      const rr = r * (0.78 + (i % 2) * 0.16)
      g.fillStyle(i % 2 === 0 ? 0xffffff : 0xb7d7ff, 0.9)
      g.fillCircle(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.92, i % 3 === 0 ? 2.4 : 1.5)
    }
  } else if (skinId === 'lava') {
    for (let i = 0; i < 4; i++) {
      const a = -time * 2 + i * 1.5
      g.fillStyle(0xff9a3c, 0.9)
      g.fillCircle(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86, 3)
    }
  }
}
