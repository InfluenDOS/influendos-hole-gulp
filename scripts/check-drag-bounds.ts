/**
 * Headless playtest for the rim-stuck hole.
 * Run: npx vite-node scripts/check-drag-bounds.ts
 */
import { DRAG_GAIN_TOUCH, DRAG_SPEED_MOUSE, DRAG_SPEED_TOUCH } from '../src/game/balance'
import { dragTarget, dragTo, followDrag, type DragAnchor } from '../src/game/drag'
import { TABLE_INSET, tableWorld } from '../src/game/layout'

const memory = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
    removeItem: (key: string) => memory.delete(key),
  },
})

class FakeNode {
  style: Record<string, string> = {}
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  addEventListener(type: string, fn: () => void) {
    if (type === 'load') this.onload = fn
    if (type === 'error') this.onerror = fn
  }
  removeEventListener() {}
  set src(_value: string) {
    queueMicrotask(() => this.onerror?.())
  }
}
Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: {
    createElementNS: () => new FakeNode(),
    createElement: () => new FakeNode(),
  },
})

const { Arena } = await import('../src/game/arena')

const tw = tableWorld(1)
const limitX = tw.maxX - TABLE_INSET
const limitZ = tw.maxZ - TABLE_INSET
const px = 58

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message)
}

function inside(x: number, z: number) {
  return x >= tw.minX + TABLE_INSET - 1e-6 && x <= tw.maxX - TABLE_INSET + 1e-6 && z >= tw.minZ + TABLE_INSET - 1e-6 && z <= tw.maxZ - TABLE_INSET + 1e-6
}

assert(DRAG_GAIN_TOUCH === 0.82, 'touch gain must stay 0.82')
assert(DRAG_SPEED_TOUCH === 720 && DRAG_SPEED_MOUSE === 1280, 'speed cap must stay')

const touch = dragTarget(0, 0, 0, 0, 100, 0, 50, 50, 'touch')
assert(Math.abs(touch.x - 1.64) < 1e-9, `touch gain mapping, got ${touch.x}`)

const far = followDrag(0, 0, 40, 0, 1 / 60, 'mouse', tw.s)
assert(far.x < 2, `speed cap should block a fling, got ${far.x}`)
assert(far.x > 0.05, 'speed cap should still allow motion')

let anchor: DragAnchor = { x: 0, z: 0, screenX: 0, screenY: 0 }
let sx = 0
for (let i = 0; i < 25; i++) {
  sx += 40
  const placed = dragTo(anchor, sx, 0, px, px, 'mouse', tw)
  anchor = placed.anchor
  assert(inside(placed.point.x, placed.point.z), `target left the table at sx=${sx}`)
}
assert(Math.abs(anchor.x - limitX) < 1e-6, 'anchor should sit on the rim after a hard shove')
const rimScreen = anchor.screenX
const before = anchor.x
const back = dragTo(anchor, rimScreen - 24, 0, px, px, 'mouse', tw)
assert(back.point.x < before - 0.2, `small reverse should leave the rim immediately, got ${back.point.x} from ${before}`)
assert(inside(back.point.x, back.point.z), 'reverse target stayed outside')

const oldRaw = dragTarget(0, 0, 0, 0, rimScreen - 24, 0, px, px, 'mouse')
assert(oldRaw.x > limitX, 'the old absolute target would still be past the rim here')

{
  let pressed = anchor
  const along = dragTo(pressed, pressed.screenX + 40, 220, px, px, 'mouse', tw)
  assert(Math.abs(along.point.x - limitX) < 1e-6, `shove into the rim should stay pinned, x=${along.point.x}`)
  assert(along.point.z > 2, `shove into the rim should still slide, z=${along.point.z}`)
}

anchor = back.anchor
let sy = 0
let slide = back.point
for (let i = 0; i < 8; i++) {
  sy += 36
  const placed = dragTo(anchor, rimScreen - 24, sy, px, px, 'mouse', tw)
  anchor = placed.anchor
  slide = placed.point
  assert(inside(slide.x, slide.z), 'slide left the table')
}
assert(slide.z > back.point.z + 2, `edge scrub should slide, z=${slide.z}`)
assert(slide.x < limitX - 0.2, 'scrub should not pin the hole once it has stepped inward')

const centerish = dragTo(anchor, rimScreen - 24 - px * 4, sy, px, px, 'mouse', tw)
assert(centerish.point.x < anchor.x - 2, 'a longer drag toward center keeps moving')
assert(inside(centerish.point.x, centerish.point.z), 'centerward target left the table')

const arena = new Arena(1, true)
const secret = arena as unknown as { hx: number; hz: number; update: (dt: number) => void }
secret.hx = tw.maxX + 6
secret.hz = tw.minZ - 4
arena.update(1 / 60)
let focus = arena.focus()
assert(inside(focus.x, focus.z), `auto-clamp failed: ${focus.x}, ${focus.z}`)
assert(Math.abs(focus.x - limitX) < 1e-4, `outside +x should land on the rim, got ${focus.x}`)
assert(Math.abs(focus.z - (tw.minZ + TABLE_INSET)) < 1e-4, `outside -z should land on the rim, got ${focus.z}`)

secret.hx = tw.maxX + 3
secret.hz = 0
arena.clampHole()
focus = arena.focus()
anchor = { x: focus.x, z: focus.z, screenX: 200, screenY: 400 }
arena.setDrag(focus, 'touch')
const pulled = dragTo(anchor, 200 - 80, 400, px, px, 'touch', tw)
arena.setDrag(pulled.point, 'touch')
for (let i = 0; i < 20; i++) arena.update(1 / 60)
focus = arena.focus()
assert(inside(focus.x, focus.z), `drag-back left the table: ${focus.x}, ${focus.z}`)
assert(focus.x < limitX - 0.4, `drag toward center should leave the rim, got ${focus.x}`)

arena.setDrag(null, null)
secret.hx = 0
secret.hz = 0
arena.clampHole()
anchor = { x: 0, z: 0, screenX: 0, screenY: 0 }
sx = 0
for (let i = 0; i < 30; i++) {
  sx += 48
  const placed = dragTo(anchor, sx, 12, px, px, 'mouse', tw)
  anchor = placed.anchor
  arena.setDrag(placed.point, 'mouse')
  arena.update(1 / 60)
  focus = arena.focus()
  assert(inside(focus.x, focus.z), `live drag escaped: ${focus.x}, ${focus.z}`)
}
const stuckAtRim = focus.x
const recover = dragTo(anchor, anchor.screenX - 30, anchor.screenY, px, px, 'mouse', tw)
arena.setDrag(recover.point, 'mouse')
for (let i = 0; i < 12; i++) arena.update(1 / 60)
focus = arena.focus()
assert(focus.x < stuckAtRim - 0.25, `hole stayed stuck at ${stuckAtRim}, now ${focus.x}`)
assert(inside(focus.x, focus.z), 'recovered hole is outside')

arena.setDrag(null, null)
const free = dragTo({ x: focus.x, z: focus.z, screenX: 0, screenY: 0 }, -px * 2, px, px, px, 'mouse', tw)
arena.setDrag(free.point, 'mouse')
const beforeFree = arena.focus()
for (let i = 0; i < 15; i++) arena.update(1 / 60)
focus = arena.focus()
assert(focus.x < beforeFree.x - 0.3 && focus.z > beforeFree.z + 0.15, `free drag inside the table stalled: ${focus.x}, ${focus.z}`)
assert(inside(focus.x, focus.z), 'free drag left the table')

arena.dispose()
console.log('drag bounds ok')
