import { rateStars } from './balance'
import { SKINS, type SkinId } from './skinData'

const KEY = 'influendos-hole-gulp-v1'

export type Settings = {
  sfx: boolean
  music: boolean
  vibrate: boolean
}

export type SaveData = {
  v: 1
  unlocked: number
  stars: Record<string, number>
  coins: number
  timeBoosters: number
  magnetBoosters: number
  skin: SkinId
  owned: SkinId[]
  settings: Settings
  checkin: { last: string | null; streak: number }
  seenHow: boolean
}

export const CHECKIN_REWARDS: { coins: number; magnet: number; label: string }[] = [
  { coins: 20, magnet: 0, label: '20 金币' },
  { coins: 30, magnet: 0, label: '30 金币' },
  { coins: 40, magnet: 0, label: '40 金币' },
  { coins: 50, magnet: 0, label: '50 金币' },
  { coins: 70, magnet: 0, label: '70 金币' },
  { coins: 90, magnet: 0, label: '90 金币' },
  { coins: 120, magnet: 1, label: '120 金币 + 磁铁' },
]

function fresh(): SaveData {
  return {
    v: 1,
    unlocked: 1,
    stars: {},
    coins: 0,
    timeBoosters: 2,
    magnetBoosters: 2,
    skin: 'classic',
    owned: ['classic'],
    settings: { sfx: true, music: true, vibrate: true },
    checkin: { last: null, streak: 0 },
    seenHow: false,
  }
}

let cache: SaveData | null = null

export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function yesterdayKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return todayKey(d)
}

function normalize(raw: Partial<SaveData> | null): SaveData {
  const base = fresh()
  if (!raw || raw.v !== 1) return base
  const owned = Array.isArray(raw.owned) ? raw.owned.filter((id): id is SkinId => SKINS.some((s) => s.id === id)) : base.owned
  if (!owned.includes('classic')) owned.unshift('classic')
  const skin = owned.includes(raw.skin as SkinId) ? (raw.skin as SkinId) : 'classic'
  return {
    ...base,
    ...raw,
    v: 1,
    unlocked: Math.max(1, Math.floor(raw.unlocked ?? 1)),
    stars: raw.stars && typeof raw.stars === 'object' ? raw.stars : {},
    coins: Math.max(0, Math.floor(raw.coins ?? 0)),
    timeBoosters: Math.max(0, Math.floor(raw.timeBoosters ?? base.timeBoosters)),
    magnetBoosters: Math.max(0, Math.floor(raw.magnetBoosters ?? base.magnetBoosters)),
    skin,
    owned,
    settings: {
      sfx: raw.settings?.sfx !== false,
      music: raw.settings?.music !== false,
      vibrate: raw.settings?.vibrate !== false,
    },
    checkin: {
      last: raw.checkin?.last ?? null,
      streak: Math.max(0, Math.floor(raw.checkin?.streak ?? 0)),
    },
    seenHow: Boolean(raw.seenHow),
  }
}

export function loadSave(): SaveData {
  if (cache) return cache
  try {
    const text = localStorage.getItem(KEY)
    cache = normalize(text ? (JSON.parse(text) as Partial<SaveData>) : null)
  } catch {
    cache = fresh()
  }
  refreshUnlocks(cache)
  return cache
}

export function saveGame(data: SaveData = loadSave()) {
  cache = data
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* private mode or full storage: keep the in-memory save */
  }
}

export function getStars(levelId: number, data = loadSave()): number {
  return data.stars[String(levelId)] ?? 0
}

export function totalStars(data = loadSave()): number {
  return Object.values(data.stars).reduce((sum, n) => sum + (n || 0), 0)
}

export function refreshUnlocks(data = loadSave()): boolean {
  let changed = false
  for (const skin of SKINS) {
    if (data.owned.includes(skin.id)) continue
    const byLevel = skin.freeLevel > 0 && data.unlocked > skin.freeLevel
    const byStars = skin.freeStars > 0 && totalStars(data) >= skin.freeStars
    if (byLevel || byStars) {
      data.owned.push(skin.id)
      changed = true
    }
  }
  if (changed) saveGame(data)
  return changed
}

export function grantLevelClear(
  levelId: number,
  levelCount: number,
  timeLeft: number,
  timeLimit: number,
  boostersUsed: number,
  revived: boolean,
): { stars: 1 | 2 | 3; coins: number; improved: boolean } {
  const data = loadSave()
  const stars = rateStars(timeLeft, timeLimit, boostersUsed, revived)
  const prev = getStars(levelId, data)
  const improved = stars > prev
  const coins = improved ? (stars - prev) * 20 : 0
  if (improved) data.stars[String(levelId)] = stars
  data.coins += coins
  data.unlocked = Math.max(data.unlocked, Math.min(levelCount + 1, levelId + 1))
  refreshUnlocks(data)
  saveGame(data)
  return { stars, coins, improved }
}

export type CheckinView = {
  claimed: number
  today: number
  canClaim: boolean
  note: string
}

export function checkinView(data = loadSave()): CheckinView {
  const last = data.checkin.last
  const streak = data.checkin.streak
  const today = todayKey()
  const yday = yesterdayKey()
  if (last === today) {
    return { claimed: streak, today: streak, canClaim: false, note: `已连续签到 ${streak} 天` }
  }
  if (last === yday && streak > 0 && streak < 7) {
    return {
      claimed: streak,
      today: streak + 1,
      canClaim: true,
      note: `已连续 ${streak} 天，今天是第 ${streak + 1} 天`,
    }
  }
  if (last === yday && streak >= 7) {
    return { claimed: 0, today: 1, canClaim: true, note: '上一轮签满了，新的一轮从今天开始' }
  }
  if (last) {
    return { claimed: 0, today: 1, canClaim: true, note: '中间断过，从第 1 天重新开始' }
  }
  return { claimed: 0, today: 1, canClaim: true, note: '第一天签到，领一份见面金币' }
}

export function claimCheckin(): { ok: boolean; label: string } {
  const data = loadSave()
  const view = checkinView(data)
  if (!view.canClaim) return { ok: false, label: '今天已经领过了' }
  const reward = CHECKIN_REWARDS[view.today - 1]
  data.checkin.last = todayKey()
  data.checkin.streak = view.today
  data.coins += reward.coins
  data.magnetBoosters += reward.magnet
  saveGame(data)
  return { ok: true, label: reward.label }
}
