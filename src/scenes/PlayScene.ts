import Phaser from 'phaser'
import { openRewardedSlot } from '../game/ads'
import { audio } from '../game/audio'
import { BOMB_RADIUS, BOMB_RATIO, GULP_RATIO, TIER_RADIUS, canEat, growAmount, type Tier } from '../game/balance'
import { drawHole } from '../game/hole'
import { KIND_COLOR, KIND_NAME, TEX, type Kind, objKey } from '../game/kinds'
import { LEVEL_COUNT, getLevel, levelRows, targetKinds, type LevelDef, type Obstacle, type Role } from '../game/levels'
import { grantLevelClear, loadSave, saveGame } from '../game/save'
import { COL, holeStart, itemXY, metrics, tableXY, type TableMetrics } from '../game/theme'
import { fadeIn, fadeTo, label, makeButton, openModal, pointerHitsUi, type ButtonHandle } from '../game/ui'

type FailReason = 'bomb' | 'decoy' | 'time'
type Mode = 'play' | 'pause' | 'win' | 'fail' | 'ad'

type Actor = {
  k: Kind
  role: Role
  tier: Tier
  r: number
  bx: number
  by: number
  ox: number
  oy: number
  wander: number
  phase: number
  sprite: Phaser.GameObjects.Image
  shadow: Phaser.GameObjects.Image
  gulp: number
  gone: boolean
  bumpT: number
  baseScale: number
}

type Chip = {
  k: Kind
  need: number
  have: number
  text: Phaser.GameObjects.Text
  mark: Phaser.GameObjects.Image
}

type Bit = {
  img: Phaser.GameObjects.Image
  vx: number
  vy: number
  life: number
  max: number
  spin: number
  grav: number
}

type Solid =
  | { kind: 'rect'; x: number; y: number; w: number; h: number }
  | { kind: 'circle'; x: number; y: number; r: number }

type KeyMap = {
  W: Phaser.Input.Keyboard.Key
  A: Phaser.Input.Keyboard.Key
  S: Phaser.Input.Keyboard.Key
  D: Phaser.Input.Keyboard.Key
  UP: Phaser.Input.Keyboard.Key
  DOWN: Phaser.Input.Keyboard.Key
  LEFT: Phaser.Input.Keyboard.Key
  RIGHT: Phaser.Input.Keyboard.Key
  ESC: Phaser.Input.Keyboard.Key
}

const FAIL_COPY: Record<FailReason, [string, string]> = {
  bomb: ['吞到炸弹了', '黑洞被炸得晕头转向'],
  decoy: ['这个不能吞', '辣椒和仙人掌不在菜单上'],
  time: ['时间到了', '再快一点点就吃完了'],
}

function fmt(timeLeft: number): string {
  const s = Math.max(0, Math.ceil(timeLeft))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export class PlayScene extends Phaser.Scene {
  private level!: LevelDef
  private rows = 1
  private m!: TableMetrics
  private mode: Mode = 'play'
  private clock = 0
  private hx = 0
  private hy = 0
  private hvx = 0
  private hvy = 0
  private holeR = 48
  private punch = 1
  private spawn = { x: 0, y: 0 }
  private dragging = false
  private keySteering = false
  private timeLeft = 30
  private magnetT = 0
  private invuln = 0
  private boostersUsed = 0
  private revived = false
  private combo = 0
  private lastGulp = -10
  private lastTick = 99
  private life = 0
  private culprit: Actor | null = null
  private failReason: FailReason = 'time'
  private actors: Actor[] = []
  private chips: Chip[] = []
  private solids: Solid[] = []
  private bits: Bit[] = []
  private keys?: KeyMap
  private holeG!: Phaser.GameObjects.Graphics
  private danger!: Phaser.GameObjects.Graphics
  private timerText!: Phaser.GameObjects.Text
  private timeBtn!: ButtonHandle
  private magnetBtn!: ButtonHandle
  private coach?: Phaser.GameObjects.Text
  private modal: { close: () => void } | null = null
  private reduce = false

  constructor() {
    super('play')
  }

  // This Scene object is reused after restart, while shutdown destroys its labels.
  // Clearing the round here stops the next suck from updating a dead checklist and halting the game loop.
  init() {
    this.life += 1
    this.mode = 'play'
    this.clock = 0
    this.hvx = 0
    this.hvy = 0
    this.punch = 1
    this.dragging = false
    this.keySteering = false
    this.magnetT = 0
    this.invuln = 0
    this.boostersUsed = 0
    this.revived = false
    this.combo = 0
    this.lastGulp = -10
    this.lastTick = 99
    this.culprit = null
    this.failReason = 'time'
    this.actors = []
    this.chips = []
    this.solids = []
    this.bits = []
    this.coach = undefined
    this.modal = null
  }

  create() {
    audio.setBed('play')
    fadeIn(this)
    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = Number(this.registry.get('levelId') ?? 1)
    this.level = getLevel(Math.min(LEVEL_COUNT, Math.max(1, id || 1)))
    this.rows = levelRows(this.level)
    this.m = metrics(this.rows)
    this.spawn = holeStart(this.rows)
    this.hx = this.spawn.x
    this.hy = this.spawn.y
    this.holeR = this.level.startR
    this.timeLeft = this.level.time
    this.mode = 'play'
    this.add.image(360, 640, 'bg').setDepth(0)
    this.drawTable()
    this.level.obstacles.forEach((obstacle) => this.drawObstacle(obstacle))
    this.danger = this.add.graphics().setDepth(6)
    this.holeG = this.add.graphics().setDepth(8)
    this.spawnActors()
    this.buildChecklist()
    this.buildHud()
    this.bits = Array.from({ length: 72 }, () => {
      const img = this.add.image(0, 0, 'p-circle').setVisible(false).setDepth(12)
      return { img, vx: 0, vy: 0, life: 0, max: 1, spin: 0, grav: 0 }
    })
    if (this.input.keyboard) {
      this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,ESC') as KeyMap
    }
    this.input.on('pointerdown', this.onDown, this)
    this.input.on('pointerup', this.onUp, this)
    this.input.on('pointerupoutside', this.onUp, this)
    document.addEventListener('visibilitychange', this.onHide)
    this.events.once('shutdown', () => {
      audio.setBed('menu')
      document.removeEventListener('visibilitychange', this.onHide)
    })
    const banner = label(this, 360, this.m.tableY + 70, `第 ${this.level.id} 关  ${this.level.name}`, 36, '#3b2418').setOrigin(0.5).setDepth(25)
    banner.setScale(0.86)
    this.tweens.add({
      targets: banner,
      scale: 1,
      duration: 220,
      ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: banner,
          alpha: 0,
          delay: 650,
          duration: 280,
          onComplete: () => banner.destroy(),
        })
      },
    })
    if (this.level.id === 1) {
      this.coach = label(this, this.hx, this.hy + this.holeR + 28, '按住拖动', 26, '#fff6ea').setOrigin(0.5).setDepth(30)
    }
  }

  update(_time: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000)
    this.clock += dt
    if (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      if (this.mode === 'play') this.showPause()
      else if (this.mode === 'pause') this.resume()
    }
    if (this.mode === 'play') {
      this.timeLeft -= dt
      this.magnetT = Math.max(0, this.magnetT - dt)
      this.invuln = Math.max(0, this.invuln - dt)
      if (this.timeLeft <= 0) {
        this.timeLeft = 0
        this.fail('time', null)
      } else {
        this.followPointer(dt)
        this.steer(dt)
        this.hx += this.hvx * dt
        this.hy += this.hvy * dt
        this.hvx *= Math.exp(-8 * dt)
        this.hvy *= Math.exp(-8 * dt)
        this.resolveSolids()
        this.clampHole()
        this.updateActors(dt)
      }
      const sec = Math.ceil(this.timeLeft)
      if (sec <= 8 && sec !== this.lastTick && this.mode === 'play') {
        this.lastTick = sec
        audio.tick()
      }
    }
    this.punch += (1 - this.punch) * Math.min(1, dt * 8)
    this.redrawHole()
    this.updateBits(dt)
    this.timerText.setText(fmt(this.timeLeft))
    this.timerText.setColor(this.timeLeft <= 8 ? '#ff4d3a' : '#3b2418')
    this.refreshBoosters()
  }

  private onDown(pointer: Phaser.Input.Pointer) {
    if (this.mode !== 'play') return
    if (pointerHitsUi(this, pointer)) return
    const m = this.m
    if (pointer.x < m.tableX || pointer.x > m.tableX + m.tableW || pointer.y < m.tableY || pointer.y > m.tableBottom) return
    this.dragging = true
    this.clearCoach()
  }

  private onUp() {
    this.dragging = false
  }

  private onHide = () => {
    if (document.hidden && this.mode === 'play') this.showPause()
  }

  private clearCoach() {
    if (!this.coach) return
    this.coach.destroy()
    this.coach = undefined
  }

  private followPointer(dt: number) {
    if (!this.dragging) return
    const m = this.m
    const tx = Phaser.Math.Clamp(this.input.activePointer.x, m.tableX + 18, m.tableX + m.tableW - 18)
    const ty = Phaser.Math.Clamp(this.input.activePointer.y, m.tableY + 18, m.tableBottom - 18)
    const dx = tx - this.hx
    const dy = ty - this.hy
    const dist = Math.hypot(dx, dy)
    const step = 1080 * dt
    if (dist <= step || dist < 0.001) {
      this.hx = tx
      this.hy = ty
    } else {
      this.hx += (dx / dist) * step
      this.hy += (dy / dist) * step
    }
  }

  private steer(dt: number) {
    this.keySteering = false
    if (!this.keys) return
    let ax = 0
    let ay = 0
    if (this.keys.A.isDown || this.keys.LEFT.isDown) ax -= 1
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) ax += 1
    if (this.keys.W.isDown || this.keys.UP.isDown) ay -= 1
    if (this.keys.S.isDown || this.keys.DOWN.isDown) ay += 1
    if (ax === 0 && ay === 0) return
    this.keySteering = true
    const len = Math.hypot(ax, ay)
    this.hx += (ax / len) * 740 * dt
    this.hy += (ay / len) * 740 * dt
    this.clearCoach()
  }

  private collisionR() {
    return Math.min(40, this.holeR * 0.45)
  }

  private resolveSolids() {
    const cr = this.collisionR()
    for (let pass = 0; pass < 2; pass++) {
      for (const solid of this.solids) {
        if (solid.kind === 'circle') {
          const dx = this.hx - solid.x
          const dy = this.hy - solid.y
          const dist = Math.hypot(dx, dy) || 0.001
          const min = cr + solid.r
          if (dist < min) {
            this.hx = solid.x + (dx / dist) * min
            this.hy = solid.y + (dy / dist) * min
          }
        } else {
          const cx = Math.max(solid.x, Math.min(this.hx, solid.x + solid.w))
          const cy = Math.max(solid.y, Math.min(this.hy, solid.y + solid.h))
          let dx = this.hx - cx
          let dy = this.hy - cy
          let dist = Math.hypot(dx, dy)
          if (dist < cr) {
            if (dist < 0.001) {
              dx = 0
              dy = -1
              dist = 1
            }
            this.hx = cx + (dx / dist) * cr
            this.hy = cy + (dy / dist) * cr
          }
        }
      }
    }
  }

  private clampHole() {
    const m = this.m
    this.hx = Phaser.Math.Clamp(this.hx, m.tableX + 18, m.tableX + m.tableW - 18)
    this.hy = Phaser.Math.Clamp(this.hy, m.tableY + 18, m.tableBottom - 18)
  }

  private updateActors(dt: number) {
    this.danger.clear()
    for (const actor of this.actors) {
      if (actor.gone) continue
      if (this.mode !== 'play') return
      if (actor.gulp > 0) {
        this.stepGulp(actor, dt)
        continue
      }
      actor.bumpT = Math.max(0, actor.bumpT - dt)
      actor.ox *= Math.exp(-1.15 * dt)
      actor.oy *= Math.exp(-1.15 * dt)
      const pos = this.position(actor)
      let x = pos.x
      let y = pos.y
      const dx = this.hx - x
      const dy = this.hy - y
      const dist = Math.hypot(dx, dy) || 0.001
      const edible = canEat(actor.r, this.holeR)
      if (this.invuln <= 0 && actor.role === 'bomb' && dist < this.holeR * BOMB_RATIO) {
        this.fail('bomb', actor)
        return
      }
      if (this.invuln <= 0 && actor.role === 'decoy' && edible && dist < this.holeR * GULP_RATIO) {
        this.fail('decoy', actor)
        return
      }
      if ((actor.role === 'snack' || actor.role === 'target') && edible && dist < this.holeR * GULP_RATIO) {
        this.beginGulp(actor, x, y)
        continue
      }
      const food = actor.role === 'snack' || actor.role === 'target'
      const steering = this.dragging || this.magnetT > 0 || this.keySteering
      if (this.magnetT > 0 && edible && food && dist < this.holeR * 2.45) {
        actor.ox += (dx / dist) * 320 * dt
        actor.oy += (dy / dist) * 320 * dt
      } else if (steering && edible && food && dist < this.holeR * 1.25) {
        actor.ox += (dx / dist) * 160 * dt
        actor.oy += (dy / dist) * 160 * dt
      }
      if (!edible && actor.role !== 'bomb' && dist < this.holeR * 0.58 + actor.r * 0.2) {
        const nx = (x - this.hx) / dist
        const ny = (y - this.hy) / dist
        actor.ox += nx * 150 * dt
        actor.oy += ny * 150 * dt
        this.hvx -= nx * 110
        this.hvy -= ny * 110
        if (actor.bumpT <= 0) {
          actor.bumpT = 0.55
          audio.bump()
          this.shake(0.003)
          this.floatText(x, y - actor.r, '太大了', '#fff6ea')
        }
      }
      this.clampActor(actor)
      const placed = this.position(actor)
      x = placed.x
      y = placed.y
      const pulse = actor.role === 'bomb' ? 1 + Math.sin(this.clock * 6 + actor.phase) * 0.07 : 1
      actor.sprite.setPosition(x, y)
      actor.sprite.setScale(actor.baseScale * pulse)
      actor.shadow.setPosition(x, y + actor.r * 0.42)
      if (actor.role === 'bomb') {
        const alpha = 0.35 + Math.sin(this.clock * 5 + actor.phase) * 0.2
        this.danger.lineStyle(3, 0xff4d3a, alpha)
        this.danger.strokeCircle(x, y, actor.r + 8)
      }
    }
  }

  private position(actor: Actor) {
    const wander = actor.gulp > 0 ? 0 : actor.wander
    return {
      x: actor.bx + actor.ox + Math.sin(this.clock * 1.25 + actor.phase) * wander,
      y: actor.by + actor.oy + Math.cos(this.clock * 1.05 + actor.phase) * wander * 0.7,
    }
  }

  private clampActor(actor: Actor) {
    const m = this.m
    const pos = this.position(actor)
    const minX = m.tableX + actor.r
    const maxX = m.tableX + m.tableW - actor.r
    const minY = m.tableY + actor.r
    const maxY = m.tableBottom - actor.r
    if (pos.x < minX) actor.ox += minX - pos.x
    if (pos.x > maxX) actor.ox += maxX - pos.x
    if (pos.y < minY) actor.oy += minY - pos.y
    if (pos.y > maxY) actor.oy += maxY - pos.y
  }

  private beginGulp(actor: Actor, x: number, y: number) {
    actor.bx = x
    actor.by = y
    actor.ox = 0
    actor.oy = 0
    actor.wander = 0
    actor.gulp = 0.0001
    actor.sprite.setDepth(6)
  }

  private stepGulp(actor: Actor, dt: number) {
    actor.gulp += dt
    actor.bx += (this.hx - actor.bx) * Math.min(1, dt * 10)
    actor.by += (this.hy - actor.by) * Math.min(1, dt * 10)
    const scale = Math.max(0.04, 1 - actor.gulp / 0.26)
    actor.sprite.setPosition(actor.bx, actor.by)
    actor.sprite.setScale(actor.baseScale * scale)
    actor.sprite.rotation += dt * 14
    actor.shadow.setPosition(actor.bx, actor.by + 8)
    actor.shadow.setAlpha(0.3 * scale)
    if (actor.gulp >= 0.26) this.consume(actor)
  }

  private consume(actor: Actor) {
    if (actor.gone) return
    actor.gone = true
    actor.sprite.setVisible(false)
    actor.shadow.setVisible(false)
    if (this.mode !== 'play') return
    this.holeR = Math.min(this.level.maxR, this.holeR + growAmount(actor.tier))
    this.punch = Math.min(1.18, this.punch + 0.05 + actor.tier * 0.01)
    this.burst(actor.bx, actor.by, KIND_COLOR[actor.k], 8 + actor.tier * 2, 80 + actor.tier * 24)
    audio.gulp(actor.tier >= 3)
    this.shake(0.0022 + actor.tier * 0.0007)
    if (loadSave().settings.vibrate && actor.tier >= 3) navigator.vibrate?.(12)
    if (this.clock - this.lastGulp < 0.75) this.combo += 1
    else this.combo = 1
    this.lastGulp = this.clock
    if (this.combo >= 2) this.floatText(this.hx, this.hy - this.holeR - 16, `连吞 x${this.combo}`, '#ffe08a')
    if (actor.role === 'target') {
      const chip = this.chips.find((entry) => entry.k === actor.k && entry.text.scene)
      if (chip) {
        chip.have += 1
        chip.text.setText(`${KIND_NAME[chip.k]} ${chip.have}/${chip.need}`)
        if (chip.have >= chip.need) {
          chip.text.setColor('#1f9d55')
          chip.mark.setVisible(true)
        }
      }
      if (this.actors.every((entry) => entry.role !== 'target' || entry.gone)) this.win()
    }
  }

  private redrawHole() {
    const save = loadSave()
    const visual = this.holeR * this.punch
    drawHole(this.holeG, this.hx, this.hy, visual, save.skin, this.clock)
    if (this.magnetT > 0) {
      this.holeG.lineStyle(4, 0x7ef0ff, 0.35 + Math.sin(this.clock * 9) * 0.25)
      this.holeG.strokeCircle(this.hx, this.hy, visual * 1.32)
    }
    this.holeG.setAlpha(this.invuln > 0 && Math.sin(this.clock * 22) > 0 ? 0.45 : 1)
  }

  private drawTable() {
    const m = this.m
    const g = this.add.graphics().setDepth(1)
    g.fillStyle(0x5a3a28, 1)
    g.fillRoundedRect(m.tableX - 10, m.tableY - 10, m.tableW + 20, m.tableH + 20, 40)
    g.fillStyle(COL.table, 1)
    g.fillRoundedRect(m.tableX, m.tableY, m.tableW, m.tableH, 34)
    g.lineStyle(8, COL.tableEdge, 1)
    g.strokeRoundedRect(m.tableX + 8, m.tableY + 8, m.tableW - 16, m.tableH - 16, 28)
    g.lineStyle(2, 0xffffff, 0.18)
    for (let i = 0; i < 7; i++) {
      const y = m.tableY + 40 + i * (m.tableH / 8)
      g.beginPath()
      g.moveTo(m.tableX + 36, y)
      g.lineTo(m.tableX + m.tableW - 36, y + 8)
      g.strokePath()
    }
  }

  private drawObstacle(obstacle: Obstacle) {
    const c = tableXY(obstacle.u, obstacle.v, this.rows)
    const g = this.add.graphics().setDepth(3)
    if (obstacle.kind === 'rect') {
      const x = c.x - obstacle.w / 2
      const y = c.y - obstacle.h / 2
      g.fillStyle(COL.wood, 1)
      g.fillRoundedRect(x, y, obstacle.w, obstacle.h, 12)
      g.fillStyle(0xe7b56a, 0.95)
      g.fillRoundedRect(x + 5, y + 4, Math.max(8, obstacle.w - 10), 8, 4)
      g.lineStyle(4, COL.woodDark, 1)
      g.strokeRoundedRect(x, y, obstacle.w, obstacle.h, 12)
      this.solids.push({ kind: 'rect', x, y, w: obstacle.w, h: obstacle.h })
    } else {
      g.fillStyle(COL.woodDark, 1)
      g.fillCircle(c.x, c.y, obstacle.r)
      g.fillStyle(COL.wood, 1)
      g.fillCircle(c.x - 2, c.y - 3, Math.max(4, obstacle.r - 6))
      this.solids.push({ kind: 'circle', x: c.x, y: c.y, r: obstacle.r })
    }
  }

  private spawnActors() {
    this.level.items.forEach((item, index) => {
      const pos = itemXY(item.u, item.v, this.rows)
      const tier = item.t
      const r = item.role === 'bomb' ? BOMB_RADIUS : TIER_RADIUS[tier]
      const sprite = this.add.image(pos.x, pos.y, objKey(item.k)).setDepth(5)
      const display = r * 2.25
      const baseScale = display / TEX
      sprite.setScale(baseScale)
      const shadow = this.add.image(pos.x, pos.y + r * 0.42, 'shadow').setDepth(4).setAlpha(0.75)
      shadow.setDisplaySize(r * 2.5, r * 1.1)
      this.actors.push({
        k: item.k,
        role: item.role,
        tier,
        r,
        bx: pos.x,
        by: pos.y,
        ox: 0,
        oy: 0,
        wander: item.wander,
        phase: index * 1.3,
        sprite,
        shadow,
        gulp: 0,
        gone: false,
        bumpT: 0,
        baseScale,
      })
    })
  }

  private buildChecklist() {
    const kinds = targetKinds(this.level.items)
    const counts = new Map<Kind, number>()
    for (const item of this.level.items) {
      if (item.role === 'target') counts.set(item.k, (counts.get(item.k) ?? 0) + 1)
    }
    kinds.forEach((kind, index) => {
      const row = Math.floor(index / 3)
      const col = index % 3
      const inRow = Math.min(3, kinds.length - row * 3)
      const chipW = 200
      const gap = 12
      const total = inRow * chipW + (inRow - 1) * gap
      const x = (720 - total) / 2 + col * (chipW + gap)
      const y = 104 + row * 50
      const g = this.add.graphics().setDepth(20)
      g.fillStyle(0xfff6ea, 1)
      g.fillRoundedRect(x, y, chipW, 44, 22)
      this.add.image(x + 26, y + 22, objKey(kind)).setDisplaySize(32, 32).setDepth(21)
      const need = counts.get(kind) ?? 0
      const text = label(this, x + 48, y + 22, `${KIND_NAME[kind]} 0/${need}`, 20, '#3b2418').setOrigin(0, 0.5).setDepth(21)
      const mark = this.add.image(x + chipW - 18, y + 22, 'check').setDisplaySize(18, 16).setVisible(false).setDepth(21)
      this.chips.push({ k: kind, need, have: 0, text, mark })
    })
    label(this, 360, this.m.hintY, this.level.hint, 20, '#fff1df').setOrigin(0.5).setDepth(20)
  }

  private buildHud() {
    makeRoundButtonSafe(this, 62, 58, () => this.showPause())
    label(this, 360, 36, `第 ${this.level.id} 关`, 18, '#f0d2b4').setOrigin(0.5).setDepth(20)
    label(this, 360, 68, this.level.name, 30, '#fff6ea').setOrigin(0.5).setDepth(20)
    const pill = this.add.graphics().setDepth(20)
    pill.fillStyle(0xfff6ea, 1)
    pill.fillRoundedRect(560, 34, 132, 52, 26)
    this.timerText = label(this, 626, 60, fmt(this.timeLeft), 28, '#3b2418').setOrigin(0.5).setDepth(21)
    this.timeBtn = makeButton(this, 200, 1196, 280, 84, '加时', 'yellow', () => this.useTime())
    this.magnetBtn = makeButton(this, 520, 1196, 280, 84, '磁铁', 'blue', () => this.useMagnet())
    this.timeBtn.root.setDepth(30)
    this.magnetBtn.root.setDepth(30)
    this.refreshBoosters()
  }

  private refreshBoosters() {
    const save = loadSave()
    this.timeBtn.setLabel(save.timeBoosters > 0 ? `加时 · ${save.timeBoosters}` : '加时 · 广告')
    if (this.magnetT > 0) this.magnetBtn.setLabel(`磁铁 ${Math.ceil(this.magnetT)}秒`)
    else this.magnetBtn.setLabel(save.magnetBoosters > 0 ? `磁铁 · ${save.magnetBoosters}` : '磁铁 · 广告')
  }

  private useTime() {
    if (this.mode !== 'play') return
    const save = loadSave()
    if (save.timeBoosters > 0) {
      save.timeBoosters -= 1
      saveGame(save)
      this.applyTime()
      audio.confirm()
      return
    }
    void this.watchAd('加时 15 秒', () => this.applyTime())
  }

  private useMagnet() {
    if (this.mode !== 'play') return
    const save = loadSave()
    if (save.magnetBoosters > 0) {
      save.magnetBoosters -= 1
      saveGame(save)
      this.applyMagnet()
      audio.confirm()
      return
    }
    void this.watchAd('磁铁 8 秒', () => this.applyMagnet())
  }

  private applyTime() {
    this.timeLeft += 15
    this.boostersUsed += 1
    this.floatText(this.hx, this.hy - 36, '+15 秒', '#fff6ea')
    this.refreshBoosters()
  }

  private applyMagnet() {
    this.magnetT += 8
    this.boostersUsed += 1
    this.floatText(this.hx, this.hy - 36, '磁铁开启', '#bff6ff')
    audio.play('open', 0.7)
    this.refreshBoosters()
  }

  private async watchAd(reward: string, apply: () => void) {
    if (this.mode === 'ad' || this.mode === 'win') return
    const prev = this.mode
    this.mode = 'ad'
    this.dragging = false
    this.closeModal()
    const token = ++this.life
    const ok = await openRewardedSlot(this, reward)
    if (!this.sys.isActive() || token !== this.life) return
    if (!ok) {
      if (prev === 'fail') {
        this.mode = 'fail'
        this.showFail()
      } else if (prev === 'pause') {
        this.showPause()
      } else this.mode = 'play'
      return
    }
    this.mode = 'play'
    audio.confirm()
    apply()
  }

  private fail(reason: FailReason, culprit: Actor | null) {
    if (this.mode !== 'play') return
    this.mode = 'fail'
    this.dragging = false
    this.failReason = reason
    this.culprit = culprit
    this.shake(0.012)
    this.cameras.main.flash(160, 160, 32, 24)
    audio.fail()
    if (loadSave().settings.vibrate) navigator.vibrate?.([36, 40, 36])
    this.showFail()
  }

  private showFail() {
    this.closeModal()
    const [title, subtitle] = FAIL_COPY[this.failReason]
    const left = this.actors.filter((actor) => actor.role === 'target' && !actor.gone).length
    const buttons: { label: string; tone: 'green' | 'yellow' | 'blue'; onClick: () => void }[] = []
    if (!this.revived) {
      buttons.push({ label: '看视频复活', tone: 'yellow', onClick: () => void this.watchAd('复活并加时', () => this.doRevive()) })
    }
    buttons.push({ label: '重新开始', tone: 'green', onClick: () => this.scene.restart() })
    buttons.push({ label: '返回地图', tone: 'blue', onClick: () => this.toMap() })
    this.modal = openModal(this, {
      title,
      subtitle,
      lines: [`还差 ${left} 个目标`, this.revived ? '本局已经复活过一次' : '复活后加 12 秒，并短暂无敌'],
      buttons,
    })
  }

  private doRevive() {
    this.revived = true
    if (this.culprit && !this.culprit.gone) {
      this.culprit.gone = true
      this.culprit.sprite.setVisible(false)
      this.culprit.shadow.setVisible(false)
    }
    this.hx = this.spawn.x
    this.hy = this.spawn.y
    this.hvx = 0
    this.hvy = 0
    this.timeLeft += 12
    this.invuln = 1.8
    this.floatText(this.hx, this.hy - 48, '复活 +12 秒', '#fff6ea')
  }

  private win() {
    if (this.mode !== 'play') return
    this.mode = 'win'
    this.dragging = false
    const result = grantLevelClear(this.level.id, LEVEL_COUNT, this.timeLeft, this.level.time, this.boostersUsed, this.revived)
    audio.win()
    this.shake(0.006)
    this.cameras.main.flash(180, 255, 244, 220)
    for (let i = 0; i < 5; i++) this.burst(120 + i * 120, 180, 0xffc42e, 8, 160)
    const lines = [
      result.coins > 0 ? `金币 +${result.coins}` : result.improved ? '新纪录' : '星级没有超过上次',
      `剩余 ${Math.ceil(this.timeLeft)} 秒`,
      this.boostersUsed > 0 || this.revived ? '用了道具或复活，最多两星' : '干净通关可以拿到三星',
    ]
    const buttons: { label: string; tone: 'green' | 'blue' | 'grey'; onClick: () => void }[] = []
    if (this.level.id < LEVEL_COUNT) {
      buttons.push({
        label: '下一关',
        tone: 'green',
        onClick: () => {
          this.registry.set('levelId', this.level.id + 1)
          this.scene.restart()
        },
      })
    } else {
      buttons.push({ label: '再挑战终关', tone: 'green', onClick: () => this.scene.restart() })
    }
    buttons.push({ label: '再玩一次', tone: 'blue', onClick: () => this.scene.restart() })
    buttons.push({ label: '关卡地图', tone: 'grey', onClick: () => this.toMap() })
    this.modal = openModal(this, {
      title: result.stars === 3 ? '完美一口' : result.stars === 2 ? '漂亮' : '过关',
      subtitle: this.level.name,
      stars: result.stars,
      lines,
      buttons,
    })
  }

  private showPause() {
    if (this.mode !== 'play' && this.mode !== 'pause') return
    this.mode = 'pause'
    this.dragging = false
    this.closeModal()
    const save = loadSave()
    this.modal = openModal(this, {
      title: '暂停',
      subtitle: this.level.hint,
      lines: ['三星：剩余时间过半，且没用道具或复活'],
      buttons: [
        { label: '继续', tone: 'green', onClick: () => this.resume() },
        { label: '重新开始', tone: 'blue', onClick: () => this.scene.restart() },
        {
          label: `音效：${save.settings.sfx ? '开' : '关'}`,
          tone: 'yellow',
          onClick: () => {
            const data = loadSave()
            data.settings.sfx = !data.settings.sfx
            saveGame(data)
            audio.apply(data.settings)
            this.showPause()
          },
        },
        { label: '关卡地图', tone: 'grey', onClick: () => this.toMap() },
      ],
    })
  }

  private resume() {
    this.closeModal()
    this.mode = 'play'
  }

  private toMap() {
    this.registry.set('mapPage', Math.floor((this.level.id - 1) / 6))
    audio.setBed('menu')
    fadeTo(this, 'map')
  }

  private closeModal() {
    this.modal?.close()
    this.modal = null
  }

  private shake(intensity: number) {
    if (this.reduce) return
    this.cameras.main.shake(120, intensity)
  }

  private floatText(x: number, y: number, message: string, color: string) {
    const text = label(this, x, y, message, 26, color).setOrigin(0.5).setDepth(40)
    this.tweens.add({
      targets: text,
      y: y - 48,
      alpha: 0,
      duration: 720,
      onComplete: () => text.destroy(),
    })
  }

  private burst(x: number, y: number, tint: number, count: number, speed: number) {
    let spawned = 0
    for (const bit of this.bits) {
      if (bit.life > 0) continue
      const ang = Math.random() * Math.PI * 2
      const vel = speed * (0.45 + Math.random() * 0.7)
      bit.life = bit.max = 0.32 + Math.random() * 0.28
      bit.vx = Math.cos(ang) * vel
      bit.vy = Math.sin(ang) * vel - 30
      bit.spin = (Math.random() - 0.5) * 7
      bit.grav = 240
      bit.img.setTexture(spawned % 3 === 0 ? 'p-star' : spawned % 3 === 1 ? 'p-spark' : 'p-circle')
      bit.img.setPosition(x, y)
      bit.img.setVisible(true)
      bit.img.setTint(tint)
      bit.img.setAlpha(1)
      bit.img.setScale(0.05 + Math.random() * 0.1)
      bit.img.setDepth(12)
      spawned += 1
      if (spawned >= count) break
    }
  }

  private updateBits(dt: number) {
    for (const bit of this.bits) {
      if (bit.life <= 0) continue
      bit.life -= dt
      bit.vy += bit.grav * dt
      bit.img.x += bit.vx * dt
      bit.img.y += bit.vy * dt
      bit.img.rotation += bit.spin * dt
      bit.img.setAlpha(Math.max(0, bit.life / bit.max))
      if (bit.life <= 0) bit.img.setVisible(false)
    }
  }
}

function makeRoundButtonSafe(scene: Phaser.Scene, x: number, y: number, onClick: () => void) {
  const root = makeButton(scene, x, y, 112, 72, '暂停', 'grey', onClick)
  root.root.setDepth(30)
}
