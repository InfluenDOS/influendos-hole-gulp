import type { AdHooks, Portal } from './types'

/** GitHub Pages and local play. No external SDK and no ad requests. */
export const nonePortal: Portal = {
  id: 'none',
  instantPlay: false,
  supportsAds: false,
  async init() {},
  loadingStart() {},
  loadingStop() {},
  gameplayStart() {},
  gameplayStop() {},
  requestRewarded(_hooks?: AdHooks) {
    return Promise.resolve(false)
  },
  requestMidgame(_hooks?: AdHooks) {
    return Promise.resolve()
  },
  setSuspendHandler() {},
  localeTag() {
    return null
  },
}
