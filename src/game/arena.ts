import { Body, Box, GSSolver, Plane, SAPBroadphase, Sphere, Vec3, World } from 'cannon-es'
import * as THREE from 'three'
import { audio } from './audio'
import { BOMB_RADIUS, BOMB_RATIO, GULP_RATIO, TIER_RADIUS, canEat, growAmount, type Tier } from './balance'
import { HoleView } from './holeView'
import { KIND_COLOR, KIND_NAME, type Kind } from './kinds'
import { followDrag, type DragKind } from './drag'
import { clampToTable, pxRadius, pxToWorld, tableWorld, type TableWorld } from './layout'
import { getLevel, levelRows, targetKinds, type LevelDef, type Role } from './levels'
import { Bursts, ContactShadows } from './particles'
import { propTemplate } from './props'
import { loadSave } from './save'
import { scatterFillers } from './scatter'
import { createTableMaterial } from './tableMat'
import { holeStart, itemXY, tableXY } from './theme'

const G_GROUND = 1
const G_WALL = 2
const G_ITEM = 4
const G_FALL = 8

export type FailReason = 'bomb' | 'decoy' | 'time'
export type PlayMode = 'play' | 'pause' | 'win' | 'fail' | 'ad'

type ActorRole = Role | 'filler'

type Actor = {
  kind: Kind
  role: ActorRole
  tier: Tier
  rPx: number
  worldR: number
  homeX: number
  homeZ: number
  wander: number
  phase: number
  spin: number
  body: Body
  mesh: THREE.InstancedMesh
  index: number
  falling: boolean
  gone: boolean
  bumpT: number
  rest: number
  rewarded: boolean
  mark: THREE.Mesh | null
  halo: THREE.Mesh | null
}

export type ChipState = { kind: Kind; name: string; have: number; need: number }

const FAIL_COPY: Record<FailReason, [string, string]> = {
  bomb: ['吞到炸弹了', '黑洞被炸得晕头转向'],
  decoy: ['这个不能吞', '辣椒和仙人掌不在菜单上'],
  time: ['时间到了', '再快一点点就吃完了'],
}

export function failCopy(reason: FailReason): [string, string] {
  return FAIL_COPY[reason]
}

export class Arena {
  readonly root = new THREE.Group()
  readonly level: LevelDef
  readonly tw: TableWorld
  mode: PlayMode = 'play'
  timeLeft = 30
  holeR: number
  boostersUsed = 0
  revived = false
  failReason: FailReason = 'time'
  private rows: number
  private world: World
  private actors: Actor[] = []
  private hole: HoleView
  private bursts: Bursts
  private tableMat: ReturnType<typeof createTableMaterial>
  private hx: number
  private hz: number
  private hvx = 0
  private hvz = 0
  private spawnX: number
  private spawnZ: number
  private punch = 1
  private magnetT = 0
  private invuln = 0
  private combo = 0
  private lastGulp = -10
  private clock = 0
  private lastTick = 99
  private gulpSound = 0
  private crumbGrow = 16
  private dragging = false
  private keySteer = false
  private dragKind: DragKind | null = null
  private dragTarget: { x: number; z: number } | null = null
  private keys = { x: 0, z: 0 }
  private solids: ({ kind: 'circle'; x: number; z: number; r: number } | { kind: 'rect'; x: number; z: number; hw: number; hd: number })[] = []
  private culprit: Actor | null = null
  private dummy = new THREE.Object3D()
  private markMat: {
    target: THREE.Material
    bomb: THREE.Material
    decoy: THREE.Material
    targetGlow: THREE.Material
    bombGlow: THREE.Material
    decoyGlow: THREE.Material
  } | null = null
  private shadows: ContactShadows | null = null
  private suckT = 0
  private reduce: boolean
  private acc = 0
  private ended = false
  private sealing = false
  private sealT = 0
  private waiting: Actor[] = []
  private markGeo: THREE.RingGeometry | null = null
  private ownedGeo: THREE.BufferGeometry[] = []
  private ownedMat: THREE.Material[] = []
  onFail: ((reason: FailReason) => void) | null = null
  onWin: (() => void) | null = null
  onFloat: ((text: string, color: string, x: number, y: number, z: number) => void) | null = null
  onShake: ((amp: number) => void) | null = null

  constructor(levelId: number, reduce: boolean) {
    this.reduce = reduce
    this.level = getLevel(levelId)
    this.rows = levelRows(this.level)
    this.tw = tableWorld(this.rows)
    this.holeR = this.level.startR
    this.timeLeft = this.level.time
    const spawn = holeStart(this.rows)
    const sw = pxToWorld(spawn.x, spawn.y, this.rows)
    this.spawnX = this.hx = sw.x
    this.spawnZ = this.hz = sw.z

    this.world = new World({ gravity: new Vec3(0, -14, 0), allowSleep: true })
    this.world.broadphase = new SAPBroadphase(this.world)
    this.world.defaultContactMaterial.friction = 0.32
    this.world.defaultContactMaterial.restitution = 0.01
    if (this.world.solver instanceof GSSolver) {
      this.world.solver.iterations = 4
      this.world.solver.tolerance = 0.01
    }

    const ground = new Body({ mass: 0, collisionFilterGroup: G_GROUND, collisionFilterMask: G_ITEM })
    ground.addShape(new Plane())
    ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    this.world.addBody(ground)

    this.tableMat = createTableMaterial()
    this.buildTable()
    this.buildWalls()
    this.buildObstacles()
    this.hole = new HoleView()
    this.hole.bindSurface(this.tableMat.uniforms)
    this.hole.setSkin(loadSave().skin)
    this.root.add(this.hole.group)
    this.bursts = new Bursts(this.root)
    this.markGeo = new THREE.RingGeometry(0.72, 1, 24)
    this.ownedGeo.push(this.markGeo)
    const mark = (color: number, opacity: number) => {
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      this.ownedMat.push(material)
      return material
    }
    const glow = (color: number, opacity: number) => {
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      this.ownedMat.push(material)
      return material
    }
    this.markMat = {
      target: mark(0xffe08a, 0.95),
      bomb: mark(0xff3b30, 0.98),
      decoy: mark(0xff8a3d, 0.92),
      targetGlow: glow(0xfff3c4, 0.55),
      bombGlow: glow(0xff5a48, 0.62),
      decoyGlow: glow(0xffb15a, 0.42),
    }
    this.spawnActors()
    this.syncHole()
  }

  get alive() {
    return !this.ended
  }

  dispose() {
    this.ended = true
    this.bursts.dispose()
    this.shadows?.dispose()
    this.hole.dispose()
    this.root.traverse((obj) => {
      if (obj instanceof THREE.InstancedMesh) obj.dispose()
    })
    for (const geo of this.ownedGeo) geo.dispose()
    for (const mat of this.ownedMat) mat.dispose()
    this.tableMat.dispose()
    this.root.clear()
  }

  setDrag(point: { x: number; z: number } | null, kind: DragKind | null) {
    if (this.mode !== 'play' || !point || !kind) {
      this.stopDrag()
      return
    }
    this.dragging = true
    this.dragKind = kind
    this.dragTarget = clampToTable(point.x, point.z, this.tw)
  }

  /** Pull the center back onto the wood. Safe to call every frame. */
  clampHole() {
    const next = clampToTable(this.hx, this.hz, this.tw)
    this.hx = next.x
    this.hz = next.z
    if (this.dragTarget) this.dragTarget = clampToTable(this.dragTarget.x, this.dragTarget.z, this.tw)
  }

  private stopDrag() {
    this.dragging = false
    this.dragKind = null
    this.dragTarget = null
  }

  setKeys(x: number, z: number) {
    this.keys.x = x
    this.keys.z = z
  }

  setMode(mode: PlayMode) {
    this.mode = mode
    if (mode !== 'play') this.stopDrag()
  }

  applyTime() {
    this.timeLeft += 15
    this.boostersUsed += 1
    this.float(this.hx, 0.8, this.hz, '+15 秒', '#fff6ea')
  }

  applyMagnet() {
    this.magnetT += 8
    this.boostersUsed += 1
    this.float(this.hx, 0.8, this.hz, '磁铁开启', '#bff6ff')
    audio.play('open', 0.7)
  }

  revive() {
    this.revived = true
    if (this.culprit && !this.culprit.gone) this.removeActor(this.culprit)
    this.hx = this.spawnX
    this.hz = this.spawnZ
    this.hvx = 0
    this.hvz = 0
    this.timeLeft += 12
    this.invuln = 1.8
    this.mode = 'play'
    this.float(this.hx, 0.9, this.hz, '复活 +12 秒', '#fff6ea')
  }

  chips(): ChipState[] {
    const kinds = targetKinds(this.level.items)
    const need = new Map<Kind, number>()
    const have = new Map<Kind, number>()
    for (const item of this.level.items) {
      if (item.role !== 'target') continue
      need.set(item.k, (need.get(item.k) ?? 0) + 1)
    }
    for (const actor of this.actors) {
      if (actor.role === 'target' && (actor.gone || actor.rewarded)) have.set(actor.kind, (have.get(actor.kind) ?? 0) + 1)
    }
    return kinds.map((kind) => ({
      kind,
      name: KIND_NAME[kind],
      have: have.get(kind) ?? 0,
      need: need.get(kind) ?? 0,
    }))
  }

  targetsLeft(): number {
    return this.actors.filter((actor) => actor.role === 'target' && !actor.gone && !actor.rewarded).length
  }

  get magnetLeft() {
    return this.magnetT
  }

  focus(): { x: number; z: number; holeWorld: number; tableW: number; tableD: number; dragging: boolean } {
    return {
      x: this.hx,
      z: this.hz,
      holeWorld: pxRadius(this.holeR, this.rows) * this.punch,
      tableW: this.tw.w,
      tableD: this.tw.d,
      dragging: this.dragging,
    }
  }

  update(dt: number) {
    if (this.ended) return
    this.clampHole()
    const clamped = Math.min(0.05, dt)
    this.clock += clamped
    if (this.mode === 'play') {
      this.timeLeft -= clamped
      this.magnetT = Math.max(0, this.magnetT - clamped)
      this.invuln = Math.max(0, this.invuln - clamped)
      if (this.timeLeft <= 0) {
        this.timeLeft = 0
        if (this.targetsLeft() === 0) this.timeLeft = 0.05
        else this.fail('time', null)
      } else {
        this.acc += clamped
        let steps = 0
        const step = 1 / 60
        while (this.acc >= step && steps < 3 && this.mode === 'play') {
          this.moveHole(step)
          this.influence(step)
          this.world.step(step)
          this.acc -= step
          steps += 1
        }
        if (steps === 3) this.acc = 0
        this.finishFalls()
        if (this.sealing) {
          this.sealT += clamped
          if (this.sealT > 1.1) {
            for (const actor of this.actors) {
              if (actor.role === 'target' && actor.falling && !actor.gone) this.finishActor(actor)
            }
          }
        }
        this.feedSnacks()
      }
      const sec = Math.ceil(this.timeLeft)
      if (sec <= 8 && sec !== this.lastTick && this.mode === 'play') {
        this.lastTick = sec
        audio.tick()
      }
    }
    this.punch += (1 - this.punch) * Math.min(1, clamped * 8)
    this.clampHole()
    this.syncMeshes()
    this.bursts.update(clamped)
    this.suckT = Math.max(0, this.suckT - clamped)
    this.hole.setSuck(this.reduce ? 0 : this.suckT / 0.45)
    this.hole.setMagnet(this.magnetT > 0, this.clock)
    this.hole.setAlpha(this.invuln > 0 && Math.sin(this.clock * 22) > 0 ? 0.35 : 1)
    this.hole.update(this.clock, this.reduce)
  }

  private syncHole() {
    const visual = pxRadius(this.holeR, this.rows) * this.punch
    this.hole.setRadius(visual)
    this.hole.setMouth(0.78)
    this.hole.setPosition(this.hx, this.hz)
    const tilt = this.reduce ? 0 : 0.012
    this.hole.group.rotation.z = THREE.MathUtils.clamp(-this.hvx * tilt, -0.18, 0.18)
    this.hole.group.rotation.x = THREE.MathUtils.clamp(this.hvz * tilt, -0.18, 0.18)
  }

  private moveHole(dt: number) {
    this.keySteer = false
    if (this.dragging && this.dragTarget && this.dragKind) {
      const target = clampToTable(this.dragTarget.x, this.dragTarget.z, this.tw)
      this.dragTarget = target
      const next = followDrag(this.hx, this.hz, target.x, target.z, dt, this.dragKind, this.tw.s)
      this.hx = next.x
      this.hz = next.z
    }
    if (this.keys.x !== 0 || this.keys.z !== 0) {
      this.keySteer = true
      const len = Math.hypot(this.keys.x, this.keys.z)
      this.hx += (this.keys.x / len) * 740 * this.tw.s * dt
      this.hz += (this.keys.z / len) * 740 * this.tw.s * dt
    }
    this.hx += this.hvx * dt
    this.hz += this.hvz * dt
    this.hvx *= Math.exp(-8 * dt)
    this.hvz *= Math.exp(-8 * dt)
    this.resolveSolids()
    this.clampHole()
  }

  private collisionR() {
    return pxRadius(Math.min(40, this.holeR * 0.45), this.rows)
  }

  private resolveSolids() {
    const cr = this.collisionR()
    for (let pass = 0; pass < 2; pass++) {
      for (const solid of this.solids) {
        if (solid.kind === 'circle') {
          const dx = this.hx - solid.x
          const dz = this.hz - solid.z
          const dist = Math.hypot(dx, dz) || 0.001
          const min = cr + solid.r
          if (dist < min) {
            this.hx = solid.x + (dx / dist) * min
            this.hz = solid.z + (dz / dist) * min
          }
        } else {
          const cx = Math.max(solid.x - solid.hw, Math.min(this.hx, solid.x + solid.hw))
          const cz = Math.max(solid.z - solid.hd, Math.min(this.hz, solid.z + solid.hd))
          let dx = this.hx - cx
          let dz = this.hz - cz
          let dist = Math.hypot(dx, dz)
          if (dist < cr) {
            if (dist < 0.001) {
              dx = 0
              dz = -1
              dist = 1
            }
            this.hx = cx + (dx / dist) * cr
            this.hz = cz + (dz / dist) * cr
          }
        }
      }
    }
  }

  private influence(dt: number) {
    const holeW = pxRadius(this.holeR, this.rows)
    const steering = this.dragging || this.keySteer
    for (const actor of this.actors) {
      if (actor.gone || this.mode !== 'play') continue
      const body = actor.body
      if (actor.rest > 0) {
        actor.rest = Math.max(0, actor.rest - dt)
        continue
      }
      if (actor.falling) {
        const dx = this.hx - body.position.x
        const dz = this.hz - body.position.z
        body.velocity.x += dx * 4.5 * dt
        body.velocity.z += dz * 4.5 * dt
        body.velocity.y -= 10 * dt
        body.angularVelocity.x += actor.spin * 8 * dt
        body.angularVelocity.z += actor.spin * 6 * dt
        if (!this.reduce && Math.random() < dt * 7) {
          this.bursts.sparkle(body.position.x, Math.max(0.06, body.position.y), body.position.z, KIND_COLOR[actor.kind], 1)
        }
        continue
      }
      const dx = body.position.x - this.hx
      const dz = body.position.z - this.hz
      const dist = Math.hypot(dx, dz) || 0.001
      const distPx = dist / this.tw.s
      const food = actor.role === 'snack' || actor.role === 'target' || actor.role === 'filler'
      const edible = canEat(actor.rPx, this.holeR)
      if (!this.sealing && this.invuln <= 0 && actor.role === 'bomb' && distPx < this.holeR * BOMB_RATIO) {
        this.fail('bomb', actor)
        return
      }
      if (!this.sealing && this.invuln <= 0 && actor.role === 'decoy' && edible && distPx < this.holeR * GULP_RATIO) {
        this.fail('decoy', actor)
        return
      }
      if (food && edible && distPx < this.holeR * GULP_RATIO) {
        this.beginFall(actor)
        continue
      }
      if (actor.wander > 0 && dist > holeW * 1.45) {
        const wx = Math.sin(this.clock * 1.25 + actor.phase) * actor.wander
        const wz = Math.cos(this.clock * 1.05 + actor.phase) * actor.wander * 0.7
        body.position.x = actor.homeX + wx
        body.position.z = actor.homeZ + wz
        body.position.y = actor.worldR
        body.velocity.set(0, 0, 0)
        continue
      }
      if (!edible && actor.role !== 'bomb' && distPx < this.holeR * 0.58 + actor.rPx * 0.2) {
        const nx = dx / dist
        const nz = dz / dist
        body.wakeUp()
        body.velocity.x += nx * 7 * dt * 8
        body.velocity.z += nz * 7 * dt * 8
        this.hvx -= nx * 2.2
        this.hvz -= nz * 2.2
        actor.bumpT -= dt
        if (actor.bumpT <= 0) {
          actor.bumpT = 0.55
          audio.bump()
          this.onShake?.(0.05)
          this.float(body.position.x, actor.worldR + 0.3, body.position.z, '太大了', '#fff6ea')
        }
        continue
      }
      actor.bumpT = Math.max(0, actor.bumpT - dt)
      let pull = 0
      let range = 0
      if (this.magnetT > 0 && edible && food) {
        pull = 7.6
        range = this.holeR * 2.45
      } else if (steering && edible && food) {
        pull = 4.4
        range = this.holeR * 1.32
      } else if (edible && food) {
        pull = 2.1
        range = this.holeR * 1.02
      }
      if (pull > 0 && distPx < range) {
        body.wakeUp()
        const ix = -dx / dist
        const iz = -dz / dist
        const tx = -dz / dist
        const tz = dx / dist
        const blend = 1 - Math.exp(-7 * dt)
        const swirl = pull * 0.62
        body.velocity.x += (ix * pull + tx * swirl - body.velocity.x) * blend
        body.velocity.z += (iz * pull + tz * swirl - body.velocity.z) * blend
        body.angularVelocity.x += actor.spin * 5.2 * dt
        body.angularVelocity.y += actor.spin * 3.4 * dt
        body.angularVelocity.z += actor.spin * 2.4 * dt
        body.position.y = Math.max(actor.worldR * 0.85, body.position.y)
      } else if (distPx > (this.magnetT > 0 ? this.holeR * 2.6 : this.holeR * 1.55) && body.velocity.lengthSquared() < 0.12) {
        body.position.x += (actor.homeX - body.position.x) * Math.min(1, dt * 2.2)
        body.position.z += (actor.homeZ - body.position.z) * Math.min(1, dt * 2.2)
        body.position.y = actor.worldR
        body.velocity.set(0, 0, 0)
        body.angularVelocity.set(0, 0, 0)
        if (body.sleepState !== Body.SLEEPING) body.sleep()
      }
    }
  }

  private beginFall(actor: Actor) {
    if (actor.falling || actor.rewarded) return
    actor.falling = true
    actor.rewarded = true
    const body = actor.body
    body.collisionFilterGroup = G_FALL
    body.collisionFilterMask = G_FALL
    body.wakeUp()
    const dx = this.hx - body.position.x
    const dz = this.hz - body.position.z
    const dist = Math.hypot(dx, dz) || 0.001
    body.velocity.x = (-dz / dist) * 2.4 + (dx / dist) * 1.6
    body.velocity.z = (dx / dist) * 2.4 + (dz / dist) * 1.6
    body.velocity.y = -2.8
    body.angularVelocity.set(actor.spin * 9, actor.spin * 5, (actor.phase % 2 ? 1 : -1) * 7)
    this.rewardGulp(actor)
    if (actor.role === 'target' && this.targetsLeft() === 0) {
      this.sealing = true
      this.sealT = 0
    }
  }

  private rewardGulp(actor: Actor) {
    const grow = actor.role === 'filler' ? Math.min(0.18, this.crumbGrow) : growAmount(actor.tier)
    if (actor.role === 'filler') this.crumbGrow = Math.max(0, this.crumbGrow - grow)
    this.holeR = Math.min(this.level.maxR, this.holeR + grow)
    this.punch = Math.min(1.18, this.punch + (actor.role === 'filler' ? 0.02 : 0.06 + actor.tier * 0.012))
    const pos = actor.body.position
    const tint = actor.role === 'target' ? 0xffe08a : KIND_COLOR[actor.kind]
    this.bursts.burst(pos.x, 0.28, pos.z, tint, actor.role === 'filler' ? 8 : 16 + actor.tier * 2, actor.role === 'filler' ? 2 : 3.1)
    this.bursts.lip(this.hx, this.hz, pxRadius(this.holeR, this.rows), tint)
    if (actor.role === 'target') {
      this.bursts.sparkle(pos.x, 0.45, pos.z, 0xfff6c8, 12)
      this.suckT = 0.45
    } else if (actor.role !== 'filler') {
      this.bursts.sparkle(pos.x, 0.35, pos.z, tint, 4)
      this.suckT = Math.max(this.suckT, 0.28)
    } else {
      this.suckT = Math.max(this.suckT, 0.12)
    }
    if (this.clock - this.gulpSound > 0.07 || actor.role !== 'filler') {
      this.gulpSound = this.clock
      audio.gulp(actor.tier >= 3 && actor.role !== 'filler')
    }
    if (actor.role !== 'filler') this.onShake?.(0.07 + actor.tier * 0.016)
    if (loadSave().settings.vibrate && actor.tier >= 3 && actor.role !== 'filler') navigator.vibrate?.(12)
    if (this.clock - this.lastGulp < 0.75) this.combo += 1
    else this.combo = 1
    this.lastGulp = this.clock
    if (actor.role !== 'filler' && (this.combo === 2 || (this.combo >= 5 && this.combo % 5 === 0))) {
      this.float(this.hx, 0.9, this.hz, `连吞 x${this.combo}`, '#ffe08a')
    }
  }

  private finishFalls() {
    for (const actor of this.actors) {
      if (!actor.falling || actor.gone) continue
      if (actor.body.position.y < -1.55) this.finishActor(actor)
    }
  }

  private finishActor(actor: Actor) {
    if (this.mode !== 'play' || actor.gone) return
    if (actor.role === 'filler') {
      this.parkFiller(actor)
      return
    }
    this.removeActor(actor)
    if (actor.role === 'target' && this.targetsLeft() === 0) this.win()
  }

  private parkFiller(actor: Actor) {
    actor.falling = false
    actor.gone = true
    actor.body.velocity.set(0, 0, 0)
    actor.body.angularVelocity.set(0, 0, 0)
    actor.body.position.set(actor.homeX, -8, actor.homeZ)
    actor.body.collisionFilterMask = 0
    actor.body.sleep()
    this.waiting.push(actor)
  }

  private feedSnacks() {
    if (!this.waiting.length || this.mode !== 'play') return
    const still: Actor[] = []
    let placed = 0
    for (const actor of this.waiting) {
      if (placed >= 2) {
        still.push(actor)
        continue
      }
      const spot = this.pickSnackSpot(actor.worldR)
      if (!spot) {
        still.push(actor)
        continue
      }
      this.dropSnack(actor, spot.x, spot.z)
      placed += 1
    }
    this.waiting = still
  }

  private dropSnack(actor: Actor, x: number, z: number) {
    actor.gone = false
    actor.falling = false
    actor.rewarded = false
    actor.rest = 0.4
    actor.homeX = x
    actor.homeZ = z
    const body = actor.body
    body.position.set(x, actor.worldR, z)
    body.velocity.set(0, 0, 0)
    body.angularVelocity.set(0, 0, 0)
    body.quaternion.setFromEuler((Math.random() - 0.5) * 0.4, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.4)
    body.collisionFilterGroup = G_ITEM
    body.collisionFilterMask = G_GROUND | G_WALL | G_ITEM
    body.wakeUp()
  }

  private pickSnackSpot(radius: number): { x: number; z: number } | null {
    const holeW = pxRadius(this.holeR, this.rows)
    for (let attempt = 0; attempt < 16; attempt++) {
      const ahead = attempt < 11
      const ang = ahead ? -Math.PI / 2 + (Math.random() - 0.5) * 1.8 : Math.random() * Math.PI * 2
      const dist = holeW * 2.15 + Math.random() * (ahead ? 4.4 : 6.2)
      const x = this.hx + Math.cos(ang) * dist
      const z = this.hz + Math.sin(ang) * dist
      if (x < this.tw.minX + radius + 0.18 || x > this.tw.maxX - radius - 0.18) continue
      if (z < this.tw.minZ + radius + 0.18 || z > this.tw.maxZ - radius - 0.18) continue
      if (this.spotBlocked(x, z, radius, holeW)) continue
      return { x, z }
    }
    return null
  }

  private spotBlocked(x: number, z: number, radius: number, holeW: number): boolean {
    if (Math.hypot(x - this.hx, z - this.hz) < holeW * 1.9 + radius) return true
    for (const solid of this.solids) {
      if (solid.kind === 'circle') {
        if (Math.hypot(x - solid.x, z - solid.z) < solid.r + radius + 0.14) return true
      } else {
        const cx = Math.max(solid.x - solid.hw, Math.min(x, solid.x + solid.hw))
        const cz = Math.max(solid.z - solid.hd, Math.min(z, solid.z + solid.hd))
        if (Math.hypot(x - cx, z - cz) < radius + 0.14) return true
      }
    }
    for (const other of this.actors) {
      if (other.gone || other.falling) continue
      const extra = other.role === 'bomb' || other.role === 'decoy' ? 0.55 : other.role === 'target' ? 0.16 : 0.05
      if (Math.hypot(x - other.body.position.x, z - other.body.position.z) < radius + other.worldR + extra) return true
    }
    return false
  }

  private removeActor(actor: Actor) {
    if (actor.gone) return
    actor.gone = true
    actor.falling = false
    this.world.removeBody(actor.body)
    this.dummy.position.set(0, -20, 0)
    this.dummy.scale.setScalar(0)
    this.dummy.updateMatrix()
    actor.mesh.setMatrixAt(actor.index, this.dummy.matrix)
    actor.mesh.instanceMatrix.needsUpdate = true
  }

  private fail(reason: FailReason, culprit: Actor | null) {
    if (this.mode !== 'play') return
    this.mode = 'fail'
    this.stopDrag()
    this.failReason = reason
    this.culprit = culprit
    this.onShake?.(0.16)
    audio.fail()
    if (loadSave().settings.vibrate) navigator.vibrate?.([36, 40, 36])
    this.onFail?.(reason)
  }

  private win() {
    if (this.mode !== 'play') return
    this.mode = 'win'
    this.stopDrag()
    audio.win()
    this.onShake?.(0.08)
    this.onWin?.()
  }

  private float(x: number, y: number, z: number, text: string, color: string) {
    this.onFloat?.(text, color, x, y, z)
  }

  private syncMeshes() {
    this.syncHole()
    const touched = new Set<THREE.InstancedMesh>()
    this.actors.forEach((actor, index) => {
      if (actor.gone) {
        if (actor.mark) actor.mark.visible = false
        if (actor.halo) actor.halo.visible = false
        this.shadows?.place(index, 0, 0, 0)
        this.dummy.position.set(0, -20, 0)
        this.dummy.scale.setScalar(0)
        this.dummy.updateMatrix()
        actor.mesh.setMatrixAt(actor.index, this.dummy.matrix)
        touched.add(actor.mesh)
        return
      }
      const body = actor.body
      const y = actor.falling ? body.position.y : Math.max(actor.worldR * 0.92, body.position.y)
      if (!actor.falling && body.position.y < actor.worldR) body.position.y = actor.worldR
      const sink = actor.falling ? Math.max(0.2, 1 + Math.min(0, y) * 0.46) : 1
      const pulse = actor.role === 'bomb' ? 1 + Math.sin(this.clock * 8 + actor.phase) * 0.08 : 1
      this.dummy.position.set(body.position.x, y, body.position.z)
      this.dummy.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w)
      this.dummy.scale.setScalar(actor.worldR * sink * pulse)
      this.dummy.updateMatrix()
      actor.mesh.setMatrixAt(actor.index, this.dummy.matrix)
      touched.add(actor.mesh)
      const shade = actor.falling ? Math.max(0.15, 1 + Math.min(0, body.position.y) * 0.35) : 1
      this.shadows?.place(index, body.position.x, body.position.z, actor.worldR * 1.45 * shade)
      if (actor.mark) {
        const show = !actor.falling
        actor.mark.visible = show
        if (actor.halo) actor.halo.visible = show
        if (show) {
          const ring = 1 + Math.sin(this.clock * (actor.role === 'bomb' ? 8 : 3.4) + actor.phase) * (actor.role === 'bomb' ? 0.16 : 0.07)
          const scale = Math.max(0.34, actor.worldR * 1.9) * ring
          actor.mark.position.set(body.position.x, 0.035, body.position.z)
          actor.mark.scale.setScalar(scale)
          if (actor.halo) {
            actor.halo.position.set(body.position.x, 0.03, body.position.z)
            actor.halo.scale.setScalar(scale * 1.42)
          }
        }
      }
    })
    for (const mesh of touched) mesh.instanceMatrix.needsUpdate = true
    this.shadows?.commit()
  }

  private buildTable() {
    this.tableMat.uniforms.uHalf.value.set(this.tw.w * 0.5, this.tw.d * 0.5)
    const top = new THREE.Mesh(new THREE.PlaneGeometry(this.tw.w, this.tw.d), this.tableMat)
    top.rotation.x = -Math.PI / 2
    top.position.y = 0
    this.root.add(top)
    this.ownedGeo.push(top.geometry)
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xb8743a, roughness: 0.7, flatShading: true })
    const roomMat = new THREE.MeshStandardMaterial({ color: 0x1a100c, roughness: 1 })
    this.ownedMat.push(edgeMat, roomMat)
    const h = 0.46
    const t = 0.28
    const beams: { geo: THREE.BoxGeometry; x: number; z: number }[] = [
      { geo: new THREE.BoxGeometry(this.tw.w + t * 2, h, t), x: 0, z: this.tw.minZ - t / 2 },
      { geo: new THREE.BoxGeometry(this.tw.w + t * 2, h, t), x: 0, z: this.tw.maxZ + t / 2 },
      { geo: new THREE.BoxGeometry(t, h, this.tw.d), x: this.tw.minX - t / 2, z: 0 },
      { geo: new THREE.BoxGeometry(t, h, this.tw.d), x: this.tw.maxX + t / 2, z: 0 },
    ]
    for (const beam of beams) {
      const mesh = new THREE.Mesh(beam.geo, edgeMat)
      mesh.position.set(beam.x, -h / 2, beam.z)
      this.root.add(mesh)
      this.ownedGeo.push(beam.geo)
    }
    const room = new THREE.Mesh(new THREE.CircleGeometry(Math.max(this.tw.w, this.tw.d) * 1.2, 40), roomMat)
    room.rotation.x = -Math.PI / 2
    room.position.y = -6.2
    this.root.add(room)
    this.ownedGeo.push(room.geometry)
  }

  private buildWalls() {
    const t = 0.45
    const h = 1.2
    const walls = [
      { x: 0, z: this.tw.minZ - t, sx: this.tw.w + t * 2, sz: t },
      { x: 0, z: this.tw.maxZ + t, sx: this.tw.w + t * 2, sz: t },
      { x: this.tw.minX - t, z: 0, sx: t, sz: this.tw.d },
      { x: this.tw.maxX + t, z: 0, sx: t, sz: this.tw.d },
    ]
    for (const wall of walls) {
      const body = new Body({ mass: 0, collisionFilterGroup: G_WALL, collisionFilterMask: G_ITEM | G_FALL })
      body.addShape(new Box(new Vec3(wall.sx / 2, h, wall.sz / 2)))
      body.position.set(wall.x, h, wall.z)
      this.world.addBody(body)
    }
  }

  private buildObstacles() {
    const wood = new THREE.MeshStandardMaterial({ color: 0xc9843e, roughness: 0.62, flatShading: true })
    const woodHi = new THREE.MeshStandardMaterial({ color: 0xe7b56a, roughness: 0.5, flatShading: true })
    const woodDark = new THREE.MeshStandardMaterial({ color: 0x8a5524, roughness: 0.7, flatShading: true })
    this.ownedMat.push(wood, woodHi, woodDark)
    for (const obstacle of this.level.obstacles) {
      const c = tableXY(obstacle.u, obstacle.v, this.rows)
      const w = pxToWorld(c.x, c.y, this.rows)
      if (obstacle.kind === 'rect') {
        const hw = pxRadius(obstacle.w / 2, this.rows)
        const hd = pxRadius(obstacle.h / 2, this.rows)
        const height = 0.78
        const plinth = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 * 1.08, 0.08, hd * 2 * 1.35), woodDark)
        plinth.position.set(w.x, 0.04, w.z)
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, height, hd * 2), wood)
        mesh.position.set(w.x, height / 2, w.z)
        const cap = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 * 0.92, 0.08, hd * 2 * 0.55), woodHi)
        cap.position.set(w.x, height - 0.02, w.z)
        this.root.add(plinth, mesh, cap)
        this.ownedGeo.push(plinth.geometry, mesh.geometry, cap.geometry)
        const body = new Body({ mass: 0, collisionFilterGroup: G_WALL, collisionFilterMask: G_ITEM | G_FALL })
        body.addShape(new Box(new Vec3(hw, height / 2 + 0.2, hd)))
        body.position.set(w.x, height / 2, w.z)
        this.world.addBody(body)
        this.solids.push({ kind: 'rect', x: w.x, z: w.z, hw, hd })
      } else {
        const r = pxRadius(obstacle.r, this.rows)
        const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.28, r * 1.28, 0.07, 14), wood)
        base.position.set(w.x, 0.035, w.z)
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.92, 0.78, 12), woodDark)
        mesh.position.set(w.x, 0.39, w.z)
        const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.72, r * 0.72, 0.12, 10), woodHi)
        top.position.set(w.x, 0.74, w.z)
        this.root.add(base, mesh, top)
        this.ownedGeo.push(base.geometry, mesh.geometry, top.geometry)
        const body = new Body({ mass: 0, collisionFilterGroup: G_WALL, collisionFilterMask: G_ITEM | G_FALL })
        body.addShape(new Sphere(r))
        body.position.set(w.x, r, w.z)
        this.world.addBody(body)
        this.solids.push({ kind: 'circle', x: w.x, z: w.z, r })
      }
    }
  }

  private spawnActors() {
    type Spec = {
      kind: Kind
      role: ActorRole
      tier: Tier
      x: number
      z: number
      rPx: number
      wander: number
    }
    const specs: Spec[] = []
    this.level.items.forEach((item) => {
      const p = itemXY(item.u, item.v, this.rows)
      const w = pxToWorld(p.x, p.y, this.rows)
      const rPx = item.role === 'bomb' ? BOMB_RADIUS : TIER_RADIUS[item.t]
      specs.push({ kind: item.k, role: item.role, tier: item.t, x: w.x, z: w.z, rPx, wander: pxRadius(item.wander, this.rows) })
    })
    for (const filler of scatterFillers(this.level)) {
      specs.push({ kind: filler.kind, role: 'filler', tier: 1, x: filler.x, z: filler.z, rPx: filler.rPx, wander: 0 })
    }
    const byKind = new Map<Kind, Spec[]>()
    for (const spec of specs) {
      const list = byKind.get(spec.kind) ?? []
      list.push(spec)
      byKind.set(spec.kind, list)
    }
    for (const [kind, list] of byKind) {
      const template = propTemplate(kind)
      const mesh = new THREE.InstancedMesh(template.geo, template.mat, list.length)
      mesh.frustumCulled = false
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      this.root.add(mesh)
      list.forEach((spec, index) => {
        const worldR = pxRadius(spec.rPx, this.rows)
        const body = new Body({
          mass: 0.45 + worldR * 1.4,
          shape: new Sphere(worldR),
          position: new Vec3(spec.x, worldR, spec.z),
          linearDamping: 0.45,
          angularDamping: 0.55,
          allowSleep: true,
          sleepSpeedLimit: 0.18,
          sleepTimeLimit: 0.35,
          collisionFilterGroup: G_ITEM,
          collisionFilterMask: G_GROUND | G_WALL | G_ITEM,
        })
        body.quaternion.setFromEuler((Math.random() - 0.5) * 0.35, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.35)
        body.sleep()
        this.world.addBody(body)
        const actor: Actor = {
          kind: spec.kind,
          role: spec.role,
          tier: spec.tier,
          rPx: spec.rPx,
          worldR,
          homeX: spec.x,
          homeZ: spec.z,
          wander: spec.wander,
          phase: index * 1.17 + specs.length,
          spin: Math.random() < 0.5 ? -1 : 1,
          body,
          mesh,
          index,
          falling: false,
          gone: false,
          bumpT: 0,
          rest: 0,
          rewarded: false,
          mark: null,
          halo: null,
        }
        if (spec.role === 'target' || spec.role === 'bomb' || spec.role === 'decoy') {
          const key = spec.role === 'target' ? 'target' : spec.role === 'bomb' ? 'bomb' : 'decoy'
          const glowKey = spec.role === 'target' ? 'targetGlow' : spec.role === 'bomb' ? 'bombGlow' : 'decoyGlow'
          const mat = this.markMat?.[key]
          const glowMat = this.markMat?.[glowKey]
          if (mat && this.markGeo) {
            const ring = new THREE.Mesh(this.markGeo, mat)
            ring.rotation.x = -Math.PI / 2
            ring.position.set(spec.x, 0.035, spec.z)
            ring.renderOrder = 2
            this.root.add(ring)
            actor.mark = ring
          }
          if (glowMat && this.markGeo) {
            const halo = new THREE.Mesh(this.markGeo, glowMat)
            halo.rotation.x = -Math.PI / 2
            halo.position.set(spec.x, 0.03, spec.z)
            halo.renderOrder = 2
            this.root.add(halo)
            actor.halo = halo
          }
        }
        this.actors.push(actor)
        this.dummy.position.set(spec.x, worldR, spec.z)
        this.dummy.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w)
        this.dummy.scale.setScalar(worldR)
        this.dummy.updateMatrix()
        mesh.setMatrixAt(index, this.dummy.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    }
    this.shadows = new ContactShadows(this.root, this.actors.length)
  }
}
