import { audio } from './audio'
import { portal, type AdHooks } from '../portal'

const adHooks = (): AdHooks => ({
  onStart: () => audio.muteForAd(),
  onEnd: () => audio.unmuteFromAd(),
})

/**
 * Rewarded placement. Resolves true only when the portal reports the ad was
 * watched through. A missing SDK, ad blocker, cooldown, or skip resolves false
 * and does not grant a reward. Callers keep the game playable either way.
 */
export async function openRewardedSlot(): Promise<boolean> {
  if (!portal.supportsAds) return false
  try {
    return await portal.requestRewarded(adHooks())
  } catch {
    return false
  }
}

/** Natural break between cleared levels. Never rejects. */
export async function showMidgameAd(): Promise<void> {
  if (!portal.supportsAds) return
  try {
    await portal.requestMidgame(adHooks())
  } catch {
    /* a broken ad call must not block the win screen */
  }
}
