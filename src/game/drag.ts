import {
  DRAG_GAIN_MOUSE,
  DRAG_GAIN_TOUCH,
  DRAG_RESPONSE_MOUSE,
  DRAG_RESPONSE_TOUCH,
  DRAG_SPEED_MOUSE,
  DRAG_SPEED_TOUCH,
} from './balance'

export type DragKind = 'touch' | 'mouse'

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
