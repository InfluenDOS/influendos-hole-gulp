import type { AdHooks } from './types'

export type AdSettle = {
  started: () => void
  finished: () => void
  failed: () => void
}

/**
 * One ad request. `onStart` / `onEnd` run only if the ad actually starts, so a
 * blocked or missing placement does not mute the game. The promise is true
 * only for `finished`. A later callback cannot change the result.
 */
export function watchAd(options: {
  start: (settle: AdSettle) => void
  hooks?: AdHooks
  timeoutMs?: number
}): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false
    let didStart = false
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      globalThis.clearTimeout(timer)
      if (didStart) options.hooks?.onEnd?.()
      resolve(ok)
    }
    const timer = globalThis.setTimeout(() => finish(false), options.timeoutMs ?? 45000)
    const settle: AdSettle = {
      started: () => {
        if (settled || didStart) return
        didStart = true
        options.hooks?.onStart?.()
      },
      finished: () => finish(true),
      failed: () => finish(false),
    }
    try {
      options.start(settle)
    } catch {
      finish(false)
    }
  })
}
