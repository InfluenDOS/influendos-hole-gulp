/** Fixed simulation step. Gameplay advances in these slices, not per display frame. */
export const FIXED_STEP = 1 / 60

/** How many slices one frame may run before leftover hitch time is dropped. */
export const MAX_CATCHUP_STEPS = 5

const MAX_FRAME_SECONDS = 0.25

export type StepClock = {
  elapsed: number
  simSteps: number
}

/**
 * Decide how many fixed slices a frame should run.
 *
 * The target count is `round(elapsed / FIXED_STEP)`, so a 60Hz, 120Hz, and
 * 144Hz display that cover the same wall time run the same slices. While the
 * sim is paused, elapsed snaps back to the last slice so unpausing does not
 * replay the pause.
 */
export function planSteps(clock: StepClock, frameSeconds: number, playing: boolean): { clock: StepClock; steps: number } {
  if (!playing) {
    return {
      clock: { elapsed: clock.simSteps * FIXED_STEP, simSteps: clock.simSteps },
      steps: 0,
    }
  }
  const frame = Number.isFinite(frameSeconds) ? Math.min(MAX_FRAME_SECONDS, Math.max(0, frameSeconds)) : 0
  const elapsed = clock.elapsed + frame
  const target = Math.max(clock.simSteps, Math.round(elapsed / FIXED_STEP))
  let steps = 0
  let simSteps = clock.simSteps
  while (simSteps < target && steps < MAX_CATCHUP_STEPS) {
    simSteps += 1
    steps += 1
  }
  if (simSteps < target) {
    return { clock: { elapsed: target * FIXED_STEP, simSteps: target }, steps }
  }
  return { clock: { elapsed, simSteps }, steps }
}
