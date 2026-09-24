import { BOMB_RADIUS, TIER_RADIUS } from './balance'
import type { Kind } from './kinds'
import { levelRows, type LevelDef } from './levels'
import { pxRadius, pxToWorld, tableWorld } from './layout'
import { holeStart, itemXY, tableXY } from './theme'

const FILLERS: Kind[] = ['berry', 'coin', 'candy', 'star', 'cookie', 'orange', 'grape', 'gem', 'ice', 'apple']

function fillerKinds(level: LevelDef): Kind[] {
  const banned = new Set(level.items.filter((item) => item.role === 'target').map((item) => item.k))
  const pool = FILLERS.filter((kind) => !banned.has(kind))
  return pool.length >= 3 ? pool : FILLERS
}

export type ScatterSpec = {
  kind: Kind
  x: number
  z: number
  rPx: number
}

type Circ = { x: number; z: number; r: number }
type Aabb = { minX: number; maxX: number; minZ: number; maxZ: number }

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hits(x: number, z: number, r: number, circles: Circ[], boxes: Aabb[]): boolean {
  for (const c of circles) {
    if (Math.hypot(x - c.x, z - c.z) < r + c.r) return true
  }
  for (const b of boxes) {
    const cx = Math.max(b.minX, Math.min(x, b.maxX))
    const cz = Math.max(b.minZ, Math.min(z, b.maxZ))
    if (Math.hypot(x - cx, z - cz) < r) return true
  }
  return false
}

/** Extra small snacks packed around the authored layout. They are not checklist targets. */
export function scatterFillers(level: LevelDef): ScatterSpec[] {
  const rows = levelRows(level)
  const tw = tableWorld(rows)
  const rng = mulberry32(level.id * 9176 + 42)
  const circles: Circ[] = []
  const boxes: Aabb[] = []
  const margin = 0.12

  for (const item of level.items) {
    const p = itemXY(item.u, item.v, rows)
    const w = pxToWorld(p.x, p.y, rows)
    const rPx = item.role === 'bomb' ? BOMB_RADIUS : TIER_RADIUS[item.t]
    const extra = item.role === 'bomb' || item.role === 'decoy' ? 0.16 : 0.06
    circles.push({ x: w.x, z: w.z, r: pxRadius(rPx, rows) + extra })
  }
  for (const obstacle of level.obstacles) {
    const c = tableXY(obstacle.u, obstacle.v, rows)
    const w = pxToWorld(c.x, c.y, rows)
    if (obstacle.kind === 'circle') {
      circles.push({ x: w.x, z: w.z, r: pxRadius(obstacle.r, rows) + 0.08 })
    } else {
      const hw = pxRadius(obstacle.w / 2, rows) + 0.06
      const hd = pxRadius(obstacle.h / 2, rows) + 0.06
      boxes.push({ minX: w.x - hw, maxX: w.x + hw, minZ: w.z - hd, maxZ: w.z + hd })
    }
  }
  const spawnPx = holeStart(rows)
  const spawn = pxToWorld(spawnPx.x, spawnPx.y, rows)
  circles.push({ x: spawn.x, z: spawn.z, r: pxRadius(level.startR, rows) * 0.62 })

  const target = 108 + Math.min(36, level.id * 2)
  const kinds = fillerKinds(level)
  const out: ScatterSpec[] = []
  const place = (x: number, z: number) => {
    if (out.length >= target) return
    const rPx = TIER_RADIUS[1] * (0.52 + rng() * 0.36)
    const wr = pxRadius(rPx, rows)
    if (x < tw.minX + wr + margin || x > tw.maxX - wr - margin) return
    if (z < tw.minZ + wr + margin || z > tw.maxZ - wr - margin) return
    if (hits(x, z, wr + 0.01, circles, boxes)) return
    circles.push({ x, z, r: wr + 0.012 })
    out.push({ kind: kinds[Math.floor(rng() * kinds.length)], x, z, rPx })
  }

  const clusters = 11 + Math.floor(level.id / 4)
  for (let c = 0; c < clusters; c++) {
    let cx = 0
    let cz = 0
    let ok = false
    for (let attempt = 0; attempt < 28; attempt++) {
      const band = rng() < 0.7
      cx = band ? tw.minX + tw.w * (0.14 + rng() * 0.72) : tw.minX + margin + rng() * (tw.w - margin * 2)
      cz = band ? tw.minZ + tw.d * (0.16 + rng() * 0.68) : tw.minZ + margin + rng() * (tw.d - margin * 2)
      if (!hits(cx, cz, 0.36, circles, boxes)) {
        ok = true
        break
      }
    }
    if (!ok) continue
    const pile = 7 + Math.floor(rng() * 5)
    for (let i = 0; i < pile; i++) {
      const ang = rng() * Math.PI * 2
      const rad = 0.06 + rng() * 0.62
      place(cx + Math.cos(ang) * rad, cz + Math.sin(ang) * rad)
    }
  }
  for (let i = 0; i < 260 && out.length < target; i++) {
    const band = rng() < 0.62
    const x = band ? tw.minX + tw.w * (0.1 + rng() * 0.8) : tw.minX + rng() * tw.w
    const z = band ? tw.minZ + tw.d * (0.12 + rng() * 0.76) : tw.minZ + rng() * tw.d
    place(x, z)
  }
  return out
}
