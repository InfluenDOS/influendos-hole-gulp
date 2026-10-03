import { watchAd } from './adSession'
import type { AdHooks, Portal } from './types'

type GdEvent = { name: string }
type GdListener = (event: GdEvent) => void

type GdSdk = {
  showAd: (type?: 'rewarded' | 'interstitial') => Promise<unknown> | void
  preloadAd?: (type: 'rewarded' | 'interstitial') => Promise<unknown> | void
}

declare global {
  interface Window {
    gdsdk?: GdSdk
    GD_OPTIONS?: { gameId: string; onEvent?: (event: GdEvent) => void }
    __gdOnEvent?: (event: GdEvent) => void
  }
}

function waitForGd(timeoutMs: number): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.__portalSdk === 'failed') return Promise.resolve()
  if (window.gdsdk?.showAd) return Promise.resolve()
  return new Promise((resolve) => {
    const started = performance.now()
    const timer = window.setInterval(() => {
      if (window.__portalSdk === 'failed' || window.gdsdk?.showAd || performance.now() - started >= timeoutMs) {
        window.clearInterval(timer)
        resolve()
      }
    }, 40)
  })
}

class GameDistributionPortal implements Portal {
  readonly id = 'gamedistribution' as const
  readonly instantPlay = true
  readonly supportsAds = true
  private ready = false
  private listeners = new Set<GdListener>()
  private suspendHandler: ((suspended: boolean) => void) | null = null
  private inRequest = false

  constructor() {
    if (typeof window === 'undefined') return
    window.__gdOnEvent = (event) => this.onEvent(event)
  }

  async init() {
    await waitForGd(4000)
    this.ready = Boolean(window.gdsdk?.showAd)
    try {
      await window.gdsdk?.preloadAd?.('rewarded')
    } catch {
      /* a later click can still request a rewarded ad */
    }
  }

  loadingStart() {}

  loadingStop() {}

  gameplayStart() {}

  gameplayStop() {}

  requestRewarded(hooks?: AdHooks) {
    return this.show('rewarded', hooks)
  }

  requestMidgame(hooks?: AdHooks) {
    return this.show('interstitial', hooks).then(() => undefined)
  }

  setSuspendHandler(handler: ((suspended: boolean) => void) | null) {
    this.suspendHandler = handler
  }

  private onEvent(event: GdEvent) {
    for (const listener of this.listeners) listener(event)
    if (this.inRequest) return
    if (event.name === 'SDK_GAME_PAUSE') this.suspendHandler?.(true)
    if (event.name === 'SDK_GAME_START') this.suspendHandler?.(false)
  }

  private show(type: 'rewarded' | 'interstitial', hooks?: AdHooks): Promise<boolean> {
    const sdk = this.ready ? window.gdsdk : undefined
    if (!sdk?.showAd) return Promise.resolve(false)
    const rewarded = type === 'rewarded'
    let earned = false
    this.inRequest = true
    return watchAd({
      hooks,
      start: (settle) => {
        const onEvent = (event: GdEvent) => {
          if (event.name === 'SDK_GAME_PAUSE') settle.started()
          if (event.name === 'SDK_REWARDED_WATCH_COMPLETE') earned = true
          if (event.name === 'SDK_GAME_START') {
            this.listeners.delete(onEvent)
            if (!rewarded || earned) settle.finished()
            else settle.failed()
          }
          if (event.name === 'SDK_ERROR') {
            this.listeners.delete(onEvent)
            settle.failed()
          }
        }
        this.listeners.add(onEvent)
        const finishFromPromise = () => {
          this.listeners.delete(onEvent)
          if (!rewarded || earned) settle.finished()
          else settle.failed()
        }
        try {
          const call = rewarded ? sdk.showAd('rewarded') : sdk.showAd()
          if (call && typeof (call as Promise<unknown>).then === 'function') {
            void (call as Promise<unknown>).then(finishFromPromise).catch(() => {
              this.listeners.delete(onEvent)
              settle.failed()
            })
          }
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

export const gameDistributionPortal: Portal = new GameDistributionPortal()
