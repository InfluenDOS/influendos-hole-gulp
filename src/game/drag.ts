import {
  DRAG_GAIN_MOUSE,
  DRAG_GAIN_TOUCH,
  DRAG_RESPONSE_MOUSE,
  DRAG_RESPONSE_TOUCH,
  DRAG_SPEED_MOUSE,
  DRAG_SPEED_TOUCH,
} from './balance'
import { clampToTable, type TableWorld } from './layout'

export type DragKind = 'touch' | 'mouse'

export type DragAnchor = {
  x: number
  z: number
  screenX: number
  screenY: number
}

/**
 * Map a finger/cursor move onto the table without raycasting.
 *
 * The play camera follows the hole. Re-raycasting the ground plane on each
 * move feeds that follow back into the target, so a short swipe runs away
 * from the finger and the hole sprints across the table. Holding the scale
 * measured at the hole when the drag starts keeps screen travel and hole
 * travel matched for the whole gesture.
 */
export function dragTarget(
  grabHoleX: number,
  grabHoleZ: number,
  grabScreenX: number,
  grabScreenY: number,
  screenX: number,
  screenY: number,
  pxPerWorldX: number,
  pxPerWorldZ: number,
  kind: DragKind,
): { x: number; z: number } {
  const gain = kind === 'touch' ? DRAG_GAIN_TOUCH : DRAG_GAIN_MOUSE
  return {
    x: grabHoleX + ((screenX - grabScreenX) / pxPerWorldX) * gain,
    z: grabHoleZ + ((screenY - grabScreenY) / pxPerWorldZ) * gain,
  }
}

/**
 * Turn a pointer move into a table point the hole is allowed to chase.
 *
 * The raw point uses the gesture anchor, so camera follow cannot amplify it.
 * If that point lands past the wood, it is clamped and the anchor is moved
 * to the contact point. Later motion is measured from the rim, so dragging
 * back toward the table moves immediately. Leaving the anchor outside would
 * store the whole overshoot, and a short reverse drag would never re-enter.
 */
export function dragTo(
  anchor: DragAnchor,
  screenX: number,
  screenY: number,
  pxPerWorldX: number,
  pxPerWorldZ: number,
  kind: DragKind,
  table: TableWorld,
): { point: { x: number; z: number }; anchor: DragAnchor } {
  const raw = dragTarget(
    anchor.x,
    anchor.z,
    anchor.screenX,
    anchor.screenY,
    screenX,
    screenY,
    pxPerWorldX,
    pxPerWorldZ,
    kind,
  )
  const point = clampToTable(raw.x, raw.z, table)
  const pressedOut = Math.abs(point.x - raw.x) > 1e-4 || Math.abs(point.z - raw.z) > 1e-4
  return {
    point,
    anchor: pressedOut ? { x: point.x, z: point.z, screenX, screenY } : anchor,
  }
}

/** Ease the hole toward a drag target, clamped to a max distance this frame. */
export function followDrag(
  holeX: number,
  holeZ: number,
  targetX: number,
  targetZ: number,
  dt: number,
  kind: DragKind,
  worldPerDesignPx: number,
): { x: number; z: number } {
  const speed = (kind === 'touch' ? DRAG_SPEED_TOUCH : DRAG_SPEED_MOUSE) * worldPerDesignPx
  const response = kind === 'touch' ? DRAG_RESPONSE_TOUCH : DRAG_RESPONSE_MOUSE
  const dx = targetX - holeX
  const dz = targetZ - holeZ
  const dist = Math.hypot(dx, dz)
  if (dist <= 0.0001) return { x: targetX, z: targetZ }
  const step = Math.min(speed * dt, dist * (1 - Math.exp(-response * dt)))
  const scale = step / dist
  return { x: holeX + dx * scale, z: holeZ + dz * scale }
}
