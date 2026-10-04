import { watchAd } from './adSession'
import type { AdHooks, Portal } from './types'

type GmEvent = { name: string }

type GmSdk = {
  showBanner: () => void
}

declare global {
  interface Window {
    sdk?: GmSdk
    SDK_OPTIONS?: { gameId: string; onEvent?: (event: GmEvent) => void }
    __gmOnEvent?: (event: GmEvent) => void
  }
}

/**
 * GameMonetize only documents `sdk.showBanner()`. `SDK_GAME_START` also fires
 * when the call is rejected (cooldown, disabled ads, no fill), and that event
 * is reported as success. A reward needs a preceding `SDK_GAME_PAUSE`, the
 * same way GameDistribution needs `SDK_REWARDED_WATCH_COMPLETE` before
 * `SDK_GAME_START` counts.
 */
export function gmBreakResult(eventName: string, sawPause: boolean): 'playing' | 'done' | 'empty' | 'error' | 'ignore' {
  if (eventName === 'SDK_GAME_PAUSE') return 'playing'
  if (eventName === 'SDK_GAME_START') return sawPause ? 'done' : 'empty'
  if (eventName === 'SDK_ERROR') return 'error'
  return 'ignore'
}

function configuredGameId(): string {
  if (typeof window === 'undefined') return ''
  const id = window.SDK_OPTIONS?.gameId
  return typeof id === 'string' ? id.trim() : ''
}

function waitForGm(timeoutMs: number): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.__portalSdk === 'failed') return Promise.resolve()
  if (typeof window.sdk?.showBanner === 'function') return Promise.resolve()
  return new Promise((resolve) => {
    const started = performance.now()
    const timer = window.setInterval(() => {
      if (
        window.__portalSdk === 'failed' ||
        typeof window.sdk?.showBanner === 'function' ||
        performance.now() - started >= timeoutMs
      ) {
        window.clearInterval(timer)
        resolve()
      }
    }, 40)
  })
}

class GameMonetizePortal implements Portal {
  readonly id = 'gamemonetize' as const
  readonly instantPlay = true
  readonly supportsAds = true
  private ready = false
  private listeners = new Set<(event: GmEvent) => void>()
  private suspendHandler: ((suspended: boolean) => void) | null = null
  private inRequest = false

  constructor() {
    if (typeof window === 'undefined') return
    window.__gmOnEvent = (event) => this.onEvent(event)
  }

  async init() {
    await waitForGm(4000)
    this.ready = typeof window.sdk?.showBanner === 'function'
  }

  loadingStart() {}

  loadingStop() {}

  gameplayStart() {}

  gameplayStop() {}

  requestRewarded(hooks?: AdHooks) {
    return this.show(true, hooks)
  }

  requestMidgame(hooks?: AdHooks) {
    return this.show(false, hooks).then(() => undefined)
  }

  setSuspendHandler(handler: ((suspended: boolean) => void) | null) {
    this.suspendHandler = handler
  }

  localeTag() {
    return null
  }

  private onEvent(event: GmEvent) {
    for (const listener of this.listeners) listener(event)
    if (this.inRequest) return
    if (event.name === 'SDK_GAME_PAUSE') this.suspendHandler?.(true)
    if (event.name === 'SDK_GAME_START') this.suspendHandler?.(false)
  }

  private show(rewarded: boolean, hooks?: AdHooks): Promise<boolean> {
    const sdk = this.ready ? window.sdk : undefined
    if (!configuredGameId() || typeof sdk?.showBanner !== 'function') return Promise.resolve(false)
    let sawPause = false
    this.inRequest = true
    return watchAd({
      hooks,
      start: (settle) => {
        const onEvent = (event: GmEvent) => {
          const step = gmBreakResult(event.name, sawPause)
          if (step === 'playing') {
            sawPause = true
            settle.started()
            return
          }
          if (step === 'ignore') return
          this.listeners.delete(onEvent)
          if (step === 'done' || (step === 'empty' && !rewarded)) settle.finished()
          else settle.failed()
        }
        this.listeners.add(onEvent)
        try {
          sdk.showBanner()
        } catch {
          this.listeners.delete(onEvent)
          settle.failed()
        }
      },
    }).finally(() => {
      this.inRequest = false
    })
  }
}

export const gameMonetizePortal: Portal = new GameMonetizePortal()
