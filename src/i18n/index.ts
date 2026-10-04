import type { Kind } from '../game/kinds'
import { LEVELS } from '../game/levels'
import type { SkinId } from '../game/skinData'

export type Locale = 'en' | 'zh'

const en = {
  gameTitle: 'Table Gulp',
  metaDescription: 'Table Gulp: drag a hole across the table and swallow the snacks.',
  kicker: 'Hypercasual · one-bite portrait',
  tagline: 'Drag the hole. Clear the table.',
  start: 'Start game',
  continue: 'Continue',
  replayFinal: 'Replay final level',
  levelMap: 'Level map',
  checkin: 'Daily',
  skins: 'Skins',
  settings: 'Settings',
  how: 'How to play',
  credits: 'Credits',
  status: 'Level {level} open · {stars} stars · {coins} coins',
  how1: '1. Hold the table and drag the hole',
  how2: '2. Small snacks tumble in, and the hole grows',
  how3: '3. Bombs, chili, and cacti fail the level',
  howStars: 'Three stars: more than half the time left, and no boosters or revive',
  startGulp: 'Start gulping',
  gotIt: 'Got it',
  back: 'Back',
  locked: 'Locked',
  clearPrevious: 'Clear the previous level first',
  prevPage: 'Previous',
  nextPage: 'Next',
  pause: 'Pause',
  levelN: 'Level {n}',
  dragCoach: 'Hold and drag',
  paused: 'Paused',
  resume: 'Resume',
  restart: 'Restart',
  soundOn: 'Sound: On',
  soundOff: 'Sound: Off',
  watchRevive: 'Watch ad to revive',
  backToMap: 'Back to map',
  targetsLeft: '{n} targets left',
  revivedOnce: 'Already revived this round',
  reviveHelp: 'Revive adds 12 seconds and a short shield',
  winPerfect: 'Perfect gulp',
  winNice: 'Nice',
  winClear: 'Cleared',
  coinsGain: 'Coins +{n}',
  newRecord: 'New record',
  noImprove: 'No star improvement',
  secondsLeft: '{n} seconds left',
  cleanStar: 'A clean clear can earn 3 stars',
  spentStar: 'Boosters or a revive cap you at 2 stars',
  nextLevel: 'Next level',
  playAgain: 'Play again',
  dailyTitle: 'Daily check-in',
  coinsNow: 'Coins {n}',
  dayN: 'Day {n}',
  claimed: 'Claimed',
  today: 'Today',
  later: 'Later',
  claimToday: "Claim today's reward",
  claimedToday: 'Already claimed today',
  checkinFine: 'Check-in is stored on this device. A missed day restarts at day 1.',
  skinsTitle: 'Hole skins',
  skinStatus: '{coins} coins · {stars} stars',
  skinFree: 'Owned by default',
  skinOwned: 'Unlocked',
  skinPrice: '{price} coins',
  skinOrLevel: ' · or clear level {n}',
  skinOrStars: ' · or {n} stars',
  equipped: 'Equipped',
  useSkin: 'Use',
  unlock: 'Unlock',
  skinFine: 'Clearing levels or earning stars also unlocks skins for free',
  notEnough: 'Not enough coins',
  sfx: 'Sound effects',
  sfxDetail: 'Gulps, buttons, and fail stingers',
  music: 'Music',
  musicDetail: 'Light music on the menu and in a level',
  vibrate: 'Vibration',
  vibrateDetail: 'A short buzz on big gulps and fails',
  on: 'On',
  off: 'Off',
  creditsTitle: 'Credits',
  settingsNote1: 'Progress, stars, skins, and check-in are stored on this device.',
  settingsNote2: 'Clearing site data deletes the save.',
  credit1: 'Food, bombs, blocks, and the hole are simple shapes made for this game.',
  credit2: 'Buttons, stars, and arrows are from the Kenney UI Pack.',
  credit3: 'Gulp bits are from the Kenney Particle Pack.',
  credit4: 'Button and impact sounds are from Kenney Interface Sounds and Impact Sounds.',
  credit5: 'Those Kenney packs are CC0 1.0. Credit is not required.',
  credit6: 'Author: Kenney.',
  credit7: 'The Chinese UI uses a subset of Noto Sans CJK SC.',
  credit8: 'Font license: SIL Open Font License 1.1.',
  credit9: 'The gulp, fail buzz, win jingle, and background music are original.',
  credit10: 'On game portals, rewarded videos can grant a booster. If an ad is blocked, play continues and nothing is granted.',
  adNoReward: 'No reward this time. You can keep playing.',
  timeCount: '+Time · {n}',
  timeAd: '+Time · Ad',
  magnetLeft: 'Magnet {n}s',
  magnetCount: 'Magnet · {n}',
  magnetAd: 'Magnet · Ad',
  plusTime: '+15s',
  magnetOn: 'Magnet on',
  reviveFloat: 'Revive +12s',
  tooBig: 'Too big',
  combo: 'Combo x{n}',
  failBombTitle: 'You swallowed a bomb',
  failBombSub: 'The hole is spinning',
  failDecoyTitle: "Can't swallow that",
  failDecoySub: 'Chili and cacti are not on the menu',
  failTimeTitle: "Time's up",
  failTimeSub: 'Almost cleared the table',
  checkinStreak: 'Checked in {n} days in a row',
  checkinNext: '{streak} days in a row. Today is day {day}',
  checkinReset: 'The last round is full. A new one starts today',
  checkinBroken: 'A day was missed. Starting again at day 1',
  checkinFirst: 'Day 1 check-in. Here are a few coins',
  checkinAlready: 'Already claimed today',
  coinsWord: '{n} coins',
  coinsMagnet: '{n} coins + magnet',
  page0: 'Warm-up table',
  page1: 'Careful table',
  page2: 'Challenge table',
  page3: 'Master table',
  kind_berry: 'strawberry',
  kind_orange: 'orange',
  kind_grape: 'grape',
  kind_apple: 'apple',
  kind_cookie: 'cookie',
  kind_candy: 'candy',
  kind_donut: 'donut',
  kind_gem: 'gem',
  kind_coin: 'coin',
  kind_ball: 'ball',
  kind_star: 'star candy',
  kind_cupcake: 'cupcake',
  kind_ice: 'ice',
  kind_melon: 'melon',
  kind_cheese: 'cheese',
  kind_bomb: 'bomb',
  kind_chili: 'chili',
  kind_cactus: 'cactus',
  skin_classic: 'Classic hole',
  skin_classic_desc: 'The basic hole that wants a bite of everything',
  skin_galaxy: 'Star swirl',
  skin_galaxy_desc: 'Fine stardust in the vortex',
  skin_lava: 'Lava hole',
  skin_lava_desc: 'A rim that just came out of the oven',
  skin_mint: 'Mint candy',
  skin_mint_desc: 'A cool pale swirl',
} as const

const zh: { [K in keyof typeof en]: string } = {
  gameTitle: '黑洞一口吞',
  metaDescription: '黑洞一口吞：拖动地面上的黑洞，把立体食物吞进洞里。',
  kicker: '超休闲 · 竖屏一口吞',
  tagline: '拖动黑洞，把桌子吃干净',
  start: '开始游戏',
  continue: '继续闯关',
  replayFinal: '再挑战终关',
  levelMap: '关卡地图',
  checkin: '签到',
  skins: '皮肤',
  settings: '设置',
  how: '怎么玩',
  credits: '致谢',
  status: '第 {level} 关可玩 · {stars} 星 · {coins} 金币',
  how1: '1. 按住地面，拖动黑洞',
  how2: '2. 小的会翻滚掉进洞里，洞才会变大',
  how3: '3. 炸弹、辣椒、仙人掌会失败',
  howStars: '三星：剩余时间过半，且不用道具和复活',
  startGulp: '开始吞噬',
  gotIt: '知道了',
  back: '返回',
  locked: '未解锁',
  clearPrevious: '先通过上一关',
  prevPage: '上一页',
  nextPage: '下一页',
  pause: '暂停',
  levelN: '第 {n} 关',
  dragCoach: '按住拖动',
  paused: '暂停',
  resume: '继续',
  restart: '重新开始',
  soundOn: '音效：开',
  soundOff: '音效：关',
  watchRevive: '看视频复活',
  backToMap: '返回地图',
  targetsLeft: '还差 {n} 个目标',
  revivedOnce: '本局已经复活过一次',
  reviveHelp: '复活后加 12 秒，并短暂无敌',
  winPerfect: '完美一口',
  winNice: '漂亮',
  winClear: '过关',
  coinsGain: '金币 +{n}',
  newRecord: '新纪录',
  noImprove: '星级没有超过上次',
  secondsLeft: '剩余 {n} 秒',
  cleanStar: '干净通关可以拿到三星',
  spentStar: '用了道具或复活，最多两星',
  nextLevel: '下一关',
  playAgain: '再玩一次',
  dailyTitle: '每日签到',
  coinsNow: '当前金币 {n}',
  dayN: '第{n}天',
  claimed: '已领取',
  today: '今天',
  later: '未到',
  claimToday: '领取今日奖励',
  claimedToday: '今天已经领过',
  checkinFine: '签到存在这台设备上，断签会从第 1 天重来',
  skinsTitle: '黑洞皮肤',
  skinStatus: '{coins} 金币 · {stars} 星',
  skinFree: '默认拥有',
  skinOwned: '已解锁',
  skinPrice: '{price} 金币',
  skinOrLevel: ' · 或通关第 {n} 关',
  skinOrStars: ' · 或 {n} 星',
  equipped: '使用中',
  useSkin: '使用',
  unlock: '解锁',
  skinFine: '通关或攒星也会免费解锁，不必只靠金币',
  notEnough: '金币不够',
  sfx: '音效',
  sfxDetail: '吞噬、按钮和失败声',
  music: '音乐',
  musicDetail: '菜单和局内的轻音乐',
  vibrate: '震动',
  vibrateDetail: '吞大和失败时短震一下',
  on: '已开',
  off: '已关',
  creditsTitle: '素材致谢',
  settingsNote1: '进度、星级、皮肤和签到都保存在本地。',
  settingsNote2: '清除浏览器网站数据会丢掉存档。',
  credit1: '三维食物、炸弹、木块和黑洞用简单几何体搭建，是本项目原创。',
  credit2: '界面按钮、星星、箭头来自 Kenney UI Pack。',
  credit3: '吞噬碎屑来自 Kenney Particle Pack。',
  credit4: '按钮与撞击声来自 Kenney Interface Sounds、Impact Sounds。',
  credit5: '以上 Kenney 素材均为 CC0 1.0，可商用，署名非强制。',
  credit6: '作者 Kenney。',
  credit7: '中文界面字体为 Noto Sans CJK SC 子集。',
  credit8: '字体许可：SIL Open Font License 1.1。',
  credit9: '吞噬 whoosh、失败嗡声、过关旋律和背景音乐为原创合成。',
  credit10: '门户版会播放激励视频。广告被拦截时游戏仍可继续，只是拿不到奖励。',
  adNoReward: '这次没有奖励，可以继续玩。',
  timeCount: '加时 · {n}',
  timeAd: '加时 · 广告',
  magnetLeft: '磁铁 {n}秒',
  magnetCount: '磁铁 · {n}',
  magnetAd: '磁铁 · 广告',
  plusTime: '+15 秒',
  magnetOn: '磁铁开启',
  reviveFloat: '复活 +12 秒',
  tooBig: '太大了',
  combo: '连吞 x{n}',
  failBombTitle: '吞到炸弹了',
  failBombSub: '黑洞被炸得晕头转向',
  failDecoyTitle: '这个不能吞',
  failDecoySub: '辣椒和仙人掌不在菜单上',
  failTimeTitle: '时间到了',
  failTimeSub: '再快一点点就吃完了',
  checkinStreak: '已连续签到 {n} 天',
  checkinNext: '已连续 {streak} 天，今天是第 {day} 天',
  checkinReset: '上一轮签满了，新的一轮从今天开始',
  checkinBroken: '中间断过，从第 1 天重新开始',
  checkinFirst: '第一天签到，领一份见面金币',
  checkinAlready: '今天已经领过了',
  coinsWord: '{n} 金币',
  coinsMagnet: '{n} 金币 + 磁铁',
  page0: '热身桌',
  page1: '小心桌',
  page2: '挑战桌',
  page3: '大师桌',
  kind_berry: '草莓',
  kind_orange: '橙子',
  kind_grape: '葡萄',
  kind_apple: '苹果',
  kind_cookie: '饼干',
  kind_candy: '糖果',
  kind_donut: '甜甜圈',
  kind_gem: '宝石',
  kind_coin: '金币',
  kind_ball: '皮球',
  kind_star: '星星糖',
  kind_cupcake: '纸杯',
  kind_ice: '冰块',
  kind_melon: '西瓜',
  kind_cheese: '芝士',
  kind_bomb: '炸弹',
  kind_chili: '辣椒',
  kind_cactus: '仙人掌',
  skin_classic: '经典黑洞',
  skin_classic_desc: '什么都想吞一口的基础款',
  skin_galaxy: '星旋紫洞',
  skin_galaxy_desc: '漩涡里飘着细碎星尘',
  skin_lava: '熔岩赤洞',
  skin_lava_desc: '边缘像刚从炉子里掏出来',
  skin_mint: '薄荷糖洞',
  skin_mint_desc: '清凉的浅色旋，看着就想吞',
}

export type MessageKey = keyof typeof en

const EN_LEVELS: Record<number, { name: string; hint: string }> = {
  1: { name: 'A Strawberry Bite', hint: 'Hold the table and drag the hole onto the strawberry' },
  2: { name: 'Orange Next', hint: 'Swallow the small strawberry first, then the orange' },
  3: { name: 'Cookie Time', hint: 'Eat the cookies and candy, starting with the strawberry' },
  4: { name: 'Bombs Arrive', hint: 'Touch a red bomb and the level ends' },
  5: { name: 'Skip the Chili', hint: 'Grapes are the target. Chili knocks you out' },
  6: { name: 'Coin Path', hint: 'Collect coins to grow the hole, then swallow the gem' },
  7: { name: 'Two-Tone Plate', hint: 'Melon and cheese are both on the list' },
  8: { name: 'Wooden Lane', hint: 'Go around the blocks and stay off the bomb' },
  9: { name: 'Donut', hint: 'The donut is big. Eat the small candy first' },
  10: { name: 'Ice and Fire', hint: 'Swallow only the ice. Chili and bombs fail you' },
  11: { name: 'Quick Clear', hint: 'Time is short. Move fast' },
  12: { name: 'Cupcake Maze', hint: 'Go around the blocks and eat the three cupcakes' },
  13: { name: 'Gem Ladder', hint: 'Each gem is bigger. Coins grow the hole' },
  14: { name: 'Party Table', hint: 'Eat everything on the list. Not the cactus' },
  15: { name: 'Bomb Garden', hint: 'A bigger hole pulls bombs in. Keep your distance' },
  16: { name: 'Giant Melon', hint: 'Eat the small snacks before the giant melon' },
  17: { name: 'One Second Short', hint: 'Very little time. Chili is a trap' },
  18: { name: 'Wobbly Ball', hint: 'The ball wobbles. Line the hole up before you swallow' },
  19: { name: 'Corner Crisis', hint: 'Bombs sit in the four corners. Eat from the middle' },
  20: { name: 'Full Feast', hint: 'Follow the list and swallow every target' },
  21: { name: 'Master Trial', hint: 'Dodge the blocks, bombs, and the wrong snacks' },
  22: { name: 'Final Gulp', hint: 'Final level: eat from small to large, then the last gem' },
}

/** First matching supported language wins. Unknown languages fall through to English. */
export function localeFromTags(tags: readonly string[], query: string | null): Locale {
  if (query) {
    const forced = query.toLowerCase()
    if (forced.startsWith('zh')) return 'zh'
    if (forced.startsWith('en')) return 'en'
  }
  for (const tag of tags) {
    const base = tag.toLowerCase().split('-')[0]
    if (base === 'zh') return 'zh'
    if (base === 'en') return 'en'
  }
  return 'en'
}

export type LocaleSource = {
  portal: 'none' | 'crazygames' | 'gamedistribution' | 'gamemonetize'
  /** Used only when portal is `none`. */
  navigatorTags: readonly string[]
  /** CrazyGames `SDK.user.systemInfo.locale`. Ignored for other builds. */
  sdkLocale: string | null
  query: string | null
}

/**
 * Non-portal builds follow navigator language tags.
 * Portal builds ignore those tags. CrazyGames uses the SDK locale; any other
 * portal stays on English unless the QA query overrides it.
 */
export function localeForBuild(source: LocaleSource): Locale {
  if (source.portal === 'none') return localeFromTags(source.navigatorTags, source.query)
  const tags = source.portal === 'crazygames' && source.sdkLocale ? [source.sdkLocale] : []
  return localeFromTags(tags, source.query)
}

function browserTags(): readonly string[] {
  if (globalThis.navigator?.languages && globalThis.navigator.languages.length > 0) {
    return globalThis.navigator.languages
  }
  return [globalThis.navigator?.language || 'en']
}

export function refreshLocale(portalId: LocaleSource['portal'], sdkLocale: string | null): void {
  const params = new URLSearchParams(globalThis.location?.search ?? '')
  const query = params.get('lang') ?? params.get('locale')
  current = localeForBuild({
    portal: portalId,
    navigatorTags: portalId === 'none' ? browserTags() : [],
    sdkLocale,
    query,
  })
}

let current: Locale = 'en'

export function getLocale(): Locale {
  return current
}

export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  const table = current === 'zh' ? zh : en
  let text: string = table[key]
  if (!vars) return text
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value))
  }
  return text
}

export function applyDocumentLocale() {
  const root = globalThis.document?.documentElement
  if (!root) return
  root.lang = current === 'zh' ? 'zh-CN' : 'en'
  document.title = t('gameTitle')
  const meta = document.querySelector('meta[name="description"]')
  if (meta) meta.setAttribute('content', t('metaDescription'))
}

export function levelName(id: number): string {
  const level = LEVELS[id - 1]
  if (current === 'zh') return level?.name ?? ''
  return EN_LEVELS[id]?.name ?? level?.name ?? ''
}

export function levelHint(id: number): string {
  const level = LEVELS[id - 1]
  if (current === 'zh') return level?.hint ?? ''
  return EN_LEVELS[id]?.hint ?? level?.hint ?? ''
}

export function pageTitle(index: number): string {
  const key = `page${index}` as MessageKey
  if (key in en) return t(key)
  return ''
}

export function kindName(kind: Kind): string {
  return t(`kind_${kind}` as MessageKey)
}

export function skinName(id: SkinId): string {
  return t(`skin_${id}` as MessageKey)
}

export function skinBlurb(id: SkinId): string {
  return t(`skin_${id}_desc` as MessageKey)
}

export function checkinRewardText(coins: number, magnet: number): string {
  return magnet > 0 ? t('coinsMagnet', { n: coins }) : t('coinsWord', { n: coins })
}

export function failCopy(reason: 'bomb' | 'decoy' | 'time'): [string, string] {
  if (reason === 'bomb') return [t('failBombTitle'), t('failBombSub')]
  if (reason === 'decoy') return [t('failDecoyTitle'), t('failDecoySub')]
  return [t('failTimeTitle'), t('failTimeSub')]
}
