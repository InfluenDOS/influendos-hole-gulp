import { watchAd } from './adSession'
import type { AdHooks, Portal } from './types'

type CrazyAdCallbacks = {
  adStarted?: () => void
  adFinished?: () => void
  adError?: (error: unknown, errorData?: { reason?: string }) => void
}

type CrazySDK = {
  init: () => Promise<void>
  user?: {
    /** Present after init. `locale` is a BCP 47 tag such as `en-US`. */
    systemInfo?: { locale?: string }
  }
  game: {
    loadingStart: () => void
    loadingStop: () => void
    gameplayStart: () => void
    gameplayStop: () => void
  }
  ad: {
    requestAd: (type: 'midgame' | 'rewarded', callbacks: CrazyAdCallbacks) => void
  }
}

declare global {
  interface Window {
    CrazyGames?: { SDK: CrazySDK }
    __portalSdk?: 'crazygames' | 'gamedistribution' | 'failed'
  }
}

function waitForSdk(timeoutMs: number): Promise<void> {
  if (window.__portalSdk === 'failed') return Promise.resolve()
  if (window.CrazyGames?.SDK) return Promise.resolve()
  return new Promise((resolve) => {
    const started = performance.now()
    const timer = window.setInterval(() => {
      if (window.__portalSdk === 'failed' || window.CrazyGames?.SDK || performance.now() - started >= timeoutMs) {
        window.clearInterval(timer)
        resolve()
      }
    }, 40)
  })
}

class CrazyGamesPortal implements Portal {
  readonly id = 'crazygames' as const
  readonly instantPlay = true
  readonly supportsAds = true
  private ready = false
  private playing = false
  private loading = false

  async init() {
    await waitForSdk(4000)
    const sdk = window.CrazyGames?.SDK
    if (!sdk) return
    try {
      await sdk.init()
      this.ready = true
    } catch {
      this.ready = false
    }
  }

  loadingStart() {
    if (!this.ready || this.loading) return
    this.loading = true
    try {
      window.CrazyGames?.SDK.game.loadingStart()
    } catch {
      this.loading = false
    }
  }

  loadingStop() {
    if (!this.ready || !this.loading) return
    this.loading = false
    try {
      window.CrazyGames?.SDK.game.loadingStop()
    } catch {
      /* loading already ended */
    }
  }

  gameplayStart() {
    if (!this.ready || this.playing) return
    this.playing = true
    try {
      window.CrazyGames?.SDK.game.gameplayStart()
    } catch {
      this.playing = false
    }
  }

  gameplayStop() {
    if (!this.ready || !this.playing) return
    this.playing = false
    try {
      window.CrazyGames?.SDK.game.gameplayStop()
    } catch {
      /* already stopped */
    }
  }

  requestRewarded(hooks?: AdHooks) {
    return this.request('rewarded', hooks)
  }

  requestMidgame(hooks?: AdHooks) {
    return this.request('midgame', hooks).then(() => undefined)
  }

  setSuspendHandler() {}

  localeTag(): string | null {
    if (!this.ready) return null
    const locale = window.CrazyGames?.SDK.user?.systemInfo?.locale
    if (typeof locale !== 'string') return null
    const tag = locale.trim()
    return tag || null
  }

  private request(type: 'midgame' | 'rewarded', hooks?: AdHooks): Promise<boolean> {
    const sdk = this.ready ? window.CrazyGames?.SDK : undefined
    if (!sdk) return Promise.resolve(false)
    return watchAd({
      hooks,
      start(settle) {
        try {
          sdk.ad.requestAd(type, {
            adStarted: () => settle.started(),
            adFinished: () => settle.finished(),
            adError: () => settle.failed(),
          })
        } catch {
          settle.failed()
        }
      },
    })
  }
}

export const crazyGamesPortal: Portal = new CrazyGamesPortal()
