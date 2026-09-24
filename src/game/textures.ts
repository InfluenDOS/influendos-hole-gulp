import Phaser from 'phaser'
import { KINDS, TEX, objKey, paintKind } from './kinds'

export function buildTextures(scene: Phaser.Scene) {
  for (const kind of KINDS) {
    const canvas = document.createElement('canvas')
    canvas.width = TEX
    canvas.height = TEX
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    paintKind(ctx, kind)
    const key = objKey(kind)
    if (scene.textures.exists(key)) scene.textures.remove(key)
    scene.textures.addCanvas(key, canvas)
  }

  const bg = document.createElement('canvas')
  bg.width = 720
  bg.height = 1280
  const g = bg.getContext('2d')
  if (g) {
    const grad = g.createRadialGradient(360, 460, 40, 360, 700, 860)
    grad.addColorStop(0, '#6d4a34')
    grad.addColorStop(0.42, '#3a261c')
    grad.addColorStop(1, '#140e0c')
    g.fillStyle = grad
    g.fillRect(0, 0, 720, 1280)
    g.fillStyle = 'rgba(255, 214, 170, 0.05)'
    for (let i = 0; i < 28; i++) {
      const x = (i * 97) % 720
      const y = (i * 173) % 1280
      g.beginPath()
      g.arc(x, y, 1.6, 0, Math.PI * 2)
      g.fill()
    }
    if (scene.textures.exists('bg')) scene.textures.remove('bg')
    scene.textures.addCanvas('bg', bg)
  }

  const shadow = document.createElement('canvas')
  shadow.width = 128
  shadow.height = 64
  const s = shadow.getContext('2d')
  if (s) {
    const rg = s.createRadialGradient(64, 32, 8, 64, 32, 60)
    rg.addColorStop(0, 'rgba(40, 20, 10, 0.45)')
    rg.addColorStop(1, 'rgba(40, 20, 10, 0)')
    s.fillStyle = rg
    s.fillRect(0, 0, 128, 64)
    if (scene.textures.exists('shadow')) scene.textures.remove('shadow')
    scene.textures.addCanvas('shadow', shadow)
  }
}
