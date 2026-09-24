import { metrics } from './theme'

/** World width of the table. Height follows the portrait table aspect. */
export const WORLD_W = 14.6

export type TableWorld = {
  rows: number
  w: number
  d: number
  /** World units per design pixel. */
  s: number
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export function tableWorld(rows: number): TableWorld {
  const m = metrics(rows)
  const d = WORLD_W * (m.tableH / m.tableW)
  const s = WORLD_W / m.tableW
  return {
    rows,
    w: WORLD_W,
    d,
    s,
    minX: -WORLD_W / 2,
    maxX: WORLD_W / 2,
    minZ: -d / 2,
    maxZ: d / 2,
  }
}

export function pxToWorld(px: number, py: number, rows: number): { x: number; z: number } {
  const m = metrics(rows)
  const tw = tableWorld(rows)
  const nx = (px - m.tableX) / m.tableW
  const nz = (py - m.tableY) / m.tableH
  return {
    x: (nx - 0.5) * tw.w,
    z: (nz - 0.5) * tw.d,
  }
}

export function pxRadius(px: number, rows: number): number {
  return px * tableWorld(rows).s
}

/**
 * Keep the hole center this far inside the wood. Small on purpose: the mouth
 * has to reach snacks that sit near the rim. The disk may overhang; the
 * center must not.
 */
export const TABLE_INSET = 0.2

export function clampToTable(x: number, z: number, tw: TableWorld, inset = TABLE_INSET): { x: number; z: number } {
  return {
    x: Math.min(tw.maxX - inset, Math.max(tw.minX + inset, x)),
    z: Math.min(tw.maxZ - inset, Math.max(tw.minZ + inset, z)),
  }
}
