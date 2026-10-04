import { crazyGamesPortal } from './crazygames'
import { gameDistributionPortal } from './gamedistribution'
import { gameMonetizePortal } from './gamemonetize'
import { nonePortal } from './none'
import type { Portal, PortalId } from './types'

export type { AdHooks, Portal, PortalId } from './types'

declare const __PORTAL_ID__: string

function selectedId(): PortalId {
  const raw = __PORTAL_ID__
  if (raw === 'crazygames') return 'crazygames'
  if (raw === 'gamedistribution') return 'gamedistribution'
  if (raw === 'gamemonetize') return 'gamemonetize'
  return 'none'
}

const id = selectedId()

/**
 * Selected at build time. Other portal builds do not call the unused SDK.
 * The modules stay small: the real SDK script is injected into index.html
 * only for the matching zip.
 */
export const portal: Portal =
  id === 'crazygames'
    ? crazyGamesPortal
    : id === 'gamedistribution'
      ? gameDistributionPortal
      : id === 'gamemonetize'
        ? gameMonetizePortal
        : nonePortal
