import Phaser from 'phaser'
import { audio } from './audio'
import { FONT } from './theme'

export type BtnTone = 'green' | 'yellow' | 'red' | 'blue' | 'grey'

const TONE_KEY: Record<BtnTone, string> = {
  green: 'btn-green',
  yellow: 'btn-yellow',
  red: 'btn-red',
  blue: 'btn-blue',
  grey: 'btn-grey',
}

function labelColor(tone: BtnTone): string {
  return tone === 'yellow' || tone === 'grey' ? '#4a3018' : '#ffffff'
}

export type ButtonHandle = {
  root: Phaser.GameObjects.Container
  setLabel: (value: string) => void
  setEnabled: (on: boolean) => void
}

export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  tone: BtnTone,
  onClick: () => void,
): ButtonHandle {
  const key = TONE_KEY[tone]
  const slice = scene.add.nineslice(0, 0, key, undefined, w, h, 26, 26, 16, 24)
  const text = scene.add
    .text(0, -8, label, {
      fontFamily: FONT,
      fontSize: `${Math.max(22, Math.min(32, Math.floor(h * 0.34)))}px`,
      fontStyle: 'bold',
      color: labelColor(tone),
      resolution: 2,
    })
    .setOrigin(0.5)
  const root = scene.add.container(x, y, [slice, text])
  slice.setData('ui', true)
  let enabled = true
  const apply = (on: boolean) => {
    enabled = on
    slice.setTexture(on ? key : 'btn-grey')
    text.setColor(on ? labelColor(tone) : '#6b5648')
    if (on) slice.setInteractive({ useHandCursor: true })
    else slice.disableInteractive()
  }
  apply(true)
  slice.on('pointerdown', () => {
    if (enabled) root.setScale(0.97)
  })
  slice.on('pointerup', () => {
    root.setScale(1)
    if (!enabled) return
    audio.click()
    onClick()
  })
  slice.on('pointerout', () => root.setScale(1))
  slice.on('pointerupoutside', () => root.setScale(1))
  return {
    root,
    setLabel: (value) => text.setText(value),
    setEnabled: (on) => apply(on),
  }
}

export function makeRoundButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  tone: BtnTone,
  onClick: () => void,
  size = 92,
): ButtonHandle {
  const key = `round-${tone}`
  const img = scene.add.image(0, 0, key).setDisplaySize(size, size)
  const text = scene.add
    .text(0, -6, label, {
      fontFamily: FONT,
      fontSize: '28px',
      fontStyle: 'bold',
      color: labelColor(tone),
      resolution: 2,
    })
    .setOrigin(0.5)
  const root = scene.add.container(x, y, [img, text])
  img.setData('ui', true)
  img.setInteractive({ useHandCursor: true })
  img.on('pointerdown', () => root.setScale(0.96))
  img.on('pointerup', () => {
    root.setScale(1)
    audio.click()
    onClick()
  })
  img.on('pointerout', () => root.setScale(1))
  img.on('pointerupoutside', () => root.setScale(1))
  return {
    root,
    setLabel: (value) => text.setText(value),
    setEnabled: () => undefined,
  }
}

export function label(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  size: number,
  color: string,
  extra?: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, content, {
    fontFamily: FONT,
    fontSize: `${size}px`,
    fontStyle: 'bold',
    color,
    resolution: 2,
    ...extra,
  })
}

export function pointerHitsUi(scene: Phaser.Scene, pointer: Phaser.Input.Pointer): boolean {
  return scene.input.hitTestPointer(pointer).some((obj) => Boolean(obj.getData('ui')))
}

export function fadeIn(scene: Phaser.Scene) {
  scene.cameras.main.fadeIn(180, 20, 14, 12)
}

export function fadeTo(scene: Phaser.Scene, key: string) {
  if (scene.data.get('leaving')) return
  scene.data.set('leaving', true)
  scene.cameras.main.fadeOut(150, 20, 14, 12)
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    scene.scene.start(key)
  })
}

export type ModalButton = { label: string; tone: BtnTone; onClick: () => void }

export function openModal(
  scene: Phaser.Scene,
  opts: {
    title: string
    subtitle?: string
    lines?: string[]
    stars?: number
    buttons: ModalButton[]
  },
): { close: () => void } {
  const lines = opts.lines ?? []
  const buttonH = 90
  const gap = 12
  const starBlock = opts.stars === undefined ? 0 : 96
  const panelW = 620
  const panelH = 132 + (opts.subtitle ? 40 : 0) + lines.length * 34 + starBlock + opts.buttons.length * (buttonH + gap) + 28
  const panelX = 360
  const panelY = 640

  const root = scene.add.container(0, 0).setDepth(300)
  const dim = scene.add.graphics()
  dim.fillStyle(0x140e0c, 0.62)
  dim.fillRect(0, 0, 720, 1280)
  root.add(dim)

  const panel = scene.add.graphics()
  panel.fillStyle(0x000000, 0.16)
  panel.fillRoundedRect(panelX - panelW / 2 + 6, panelY - panelH / 2 + 12, panelW, panelH, 36)
  panel.fillStyle(0xfff6ea, 1)
  panel.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 36)
  panel.lineStyle(6, 0xe4c7a4, 1)
  panel.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 36)
  root.add(panel)

  let cursor = panelY - panelH / 2 + 58
  const title = label(scene, panelX, cursor, opts.title, 40, '#3b2418').setOrigin(0.5)
  root.add(title)
  cursor += 48
  if (opts.subtitle) {
    const sub = label(scene, panelX, cursor, opts.subtitle, 22, '#7a5344', {
      align: 'center',
      wordWrap: { width: 520 },
    }).setOrigin(0.5, 0)
    root.add(sub)
    cursor += 40
  }
  if (opts.stars !== undefined) {
    const earned = opts.stars
    for (let i = 0; i < 3; i++) {
      const star = scene.add.image(panelX - 70 + i * 70, cursor + 28, i < earned ? 'star' : 'star-grey')
      star.setDisplaySize(56, 52)
      star.setScale(0.01)
      root.add(star)
      scene.tweens.add({
        targets: star,
        scale: 56 / star.width,
        delay: 120 + i * 140,
        duration: 280,
        ease: 'Back.Out',
        onStart: () => {
          if (i < earned) audio.play('bell', 0.4)
        },
      })
    }
    cursor += starBlock
  }
  for (const line of lines) {
    const text = label(scene, panelX, cursor, line, 22, '#5c4032', {
      align: 'center',
      wordWrap: { width: 540 },
    }).setOrigin(0.5, 0)
    root.add(text)
    cursor += 34
  }
  cursor += 8
  for (const spec of opts.buttons) {
    const button = makeButton(scene, panelX, cursor + buttonH / 2, panelW - 80, buttonH, spec.label, spec.tone, () => {
      spec.onClick()
    })
    root.add(button.root)
    cursor += buttonH + gap
  }

  return {
    close: () => {
      root.destroy(true)
    },
  }
}
