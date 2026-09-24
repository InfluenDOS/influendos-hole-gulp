import { KINDS, TEX, paintKind, type Kind } from './kinds'

const cache = new Map<Kind, string>()

export function kindIcon(kind: Kind): string {
  const hit = cache.get(kind)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.scale(64 / TEX, 64 / TEX)
  paintKind(ctx, kind)
  const url = canvas.toDataURL('image/png')
  cache.set(kind, url)
  return url
}

export function warmIcons() {
  for (const kind of KINDS) kindIcon(kind)
}
