export const GAME_W = 720
export const GAME_H = 1280

export const FONT = '"Noto Sans SC", "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif'

export const COL = {
  page: 0x140e0c,
  ink: 0x3b2418,
  inkSoft: 0x7a5344,
  cream: 0xfff6ea,
  table: 0xf3d2a8,
  tableEdge: 0xd7b188,
  wood: 0xc9843e,
  woodDark: 0x8a5524,
  danger: 0xe23b2f,
  good: 0x1f9d55,
}

export function checklistRows(kindCount: number): number {
  return Math.max(1, Math.ceil(kindCount / 3))
}

export type TableMetrics = {
  tableX: number
  tableY: number
  tableW: number
  tableH: number
  tableBottom: number
  hintY: number
  pad: number
}

export function metrics(rows: number): TableMetrics {
  const tableX = 26
  const tableW = 668
  const hintY = 108 + rows * 50
  const tableY = hintY + 36
  const tableBottom = 1110
  return {
    tableX,
    tableY,
    tableW,
    tableH: tableBottom - tableY,
    tableBottom,
    hintY,
    pad: 42,
  }
}

export function itemXY(u: number, v: number, rows: number): { x: number; y: number } {
  const m = metrics(rows)
  const w = m.tableW - m.pad * 2
  const h = m.tableH - m.pad * 2
  return {
    x: m.tableX + m.pad + u * w,
    y: m.tableY + m.pad + v * h,
  }
}

export function tableXY(u: number, v: number, rows: number): { x: number; y: number } {
  const m = metrics(rows)
  return {
    x: m.tableX + u * m.tableW,
    y: m.tableY + v * m.tableH,
  }
}

export function holeStart(rows: number): { x: number; y: number } {
  return itemXY(0.5, 0.5, rows)
}
