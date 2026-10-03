/**
 * Portal SDK surface used by the game.
 *
 * Build with VITE_PORTAL=crazygames|gamedistribution|none.
 * Playgama, Y8, and GameMonetize can be added as another implementation of
 * this interface without touching gameplay code: they all pause, mute, and
 * resolve rewarded ads the same way.
 */
export type PortalId = 'crazygames' | 'gamedistribution' | 'none'

export type AdHooks = {
  /** Fired only when an ad actually starts. */
  onStart?: () => void
  /** Fired after onStart, when the ad ends or errors. */
  onEnd?: () => void
}

export interface Portal {
  readonly id: PortalId
  /** New players should enter a level with no title screen in the way. */
  readonly instantPlay: boolean
  /** False when this build has no ad network at all. */
  readonly supportsAds: boolean
  init(): Promise<void>
  loadingStart(): void
  loadingStop(): void
  gameplayStart(): void
  gameplayStop(): void
  /** Resolves true only when a rewarded ad was watched to completion. */
  requestRewarded(hooks?: AdHooks): Promise<boolean>
  /** Resolves when the break is over, including when no ad was available. */
  requestMidgame(hooks?: AdHooks): Promise<void>
  /**
   * Some SDKs pause the game themselves (preroll). The handler is not called
   * for ads this game requested.
   */
  setSuspendHandler(handler: ((suspended: boolean) => void) | null): void
}
