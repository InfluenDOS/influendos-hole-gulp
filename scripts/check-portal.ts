/**
 * Locale detection, ad settlement, and fixed-step parity.
 * Run: npx vite-node scripts/check-portal.ts
 */
import { watchAd } from '../src/portal/adSession'
import { planSteps, type StepClock } from '../src/game/fixedStep'
import { localeFromTags } from '../src/i18n'

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message)
}

assert(localeFromTags(['zh-CN', 'en-US'], null) === 'zh', 'Chinese preference')
assert(localeFromTags(['en-US', 'zh-CN'], null) === 'en', 'English preference wins over a later Chinese tag')
assert(localeFromTags(['fr-FR', 'zh-Hans'], null) === 'zh', 'first supported tag')
assert(localeFromTags(['fr-FR'], null) === 'en', 'unknown language defaults to English')
assert(localeFromTags(['zh-CN'], 'en') === 'en', 'query overrides the browser')
assert(localeFromTags(['en-US'], 'zh-Hans') === 'zh', 'query can force Chinese')

const blocked = await watchAd({
  start(settle) {
    settle.failed()
  },
})
assert(blocked === false, 'a failed ad grants nothing')

let mutes = 0
const watched = await watchAd({
  hooks: {
    onStart: () => {
      mutes += 1
    },
    onEnd: () => {
      mutes -= 1
    },
  },
  start(settle) {
    settle.started()
    settle.finished()
    settle.failed()
  },
})
assert(watched === true, 'finished wins, a later error does not revoke it')
assert(mutes === 0, 'mute is released when the ad ends')

let started = 0
const skipped = await watchAd({
  hooks: {
    onStart: () => {
      started += 1
    },
  },
  start(settle) {
    settle.failed()
  },
})
assert(skipped === false && started === 0, 'an ad that never starts does not mute')

function stepsFor(hz: number, seconds: number): number {
  let clock: StepClock = { elapsed: 0, simSteps: 0 }
  const frame = 1 / hz
  const frames = Math.round(seconds * hz)
  let total = 0
  for (let i = 0; i < frames; i++) {
    const planned = planSteps(clock, frame, true)
    clock = planned.clock
    total += planned.steps
  }
  return total
}

for (const seconds of [1, 2, 10]) {
  const a = stepsFor(60, seconds)
  const b = stepsFor(120, seconds)
  const c = stepsFor(144, seconds)
  assert(a === b && b === c, `${seconds}s steps differ: 60=${a} 120=${b} 144=${c}`)
  assert(a === seconds * 60, `${seconds}s expected ${seconds * 60} steps, got ${a}`)
}

let paused: StepClock = { elapsed: 0, simSteps: 0 }
paused = planSteps(paused, 1 / 60, true).clock
const held = planSteps(paused, 5, false)
assert(held.steps === 0, 'pause runs no slices')
assert(held.clock.simSteps === paused.simSteps, 'pause does not bank time')
const resumed = planSteps(held.clock, 1 / 60, true)
assert(resumed.steps === 1, 'resume continues from the next slice')

console.log('portal checks ok')
