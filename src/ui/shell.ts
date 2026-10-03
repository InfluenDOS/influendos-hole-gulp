import { checkinRewardText, levelName, pageTitle, skinBlurb, skinName, t } from '../i18n'
import { asset } from '../game/assets'
import { audio } from '../game/audio'
import { kindIcon } from '../game/icons'
import { LEVELS, LEVEL_COUNT } from '../game/levels'
import {
  CHECKIN_REWARDS,
  checkinView,
  claimCheckin,
  getStars,
  loadSave,
  refreshUnlocks,
  saveGame,
  totalStars,
} from '../game/save'
import { SKINS, type SkinId } from '../game/skinData'
import type { ChipState } from '../game/arena'

export type Tone = 'green' | 'yellow' | 'blue' | 'grey' | 'red'

type WinInfo = { stars: 1 | 2 | 3; coins: number; improved: boolean; timeLeft: number; clean: boolean; name: string; last: boolean }

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function button(label: string, tone: Tone, onClick: () => void, quiet = false): HTMLButtonElement {
  const node = el('button', `btn ${tone}`, label)
  node.type = 'button'
  node.addEventListener('click', (event) => {
    event.stopPropagation()
    if (!quiet) audio.click()
    onClick()
  })
  return node
}

function stars(count: number, total = 3): HTMLElement {
  const row = el('span', 'stars')
  for (let i = 0; i < total; i++) {
    const img = el('img')
    img.src = asset(i < count ? 'assets/kenney/ui/star.png' : 'assets/kenney/ui/star-grey.png')
    img.alt = ''
    img.draggable = false
    row.append(img)
  }
  return row
}

export class Shell {
  readonly ui: HTMLElement
  private modal: HTMLElement | null = null
  private play: HTMLElement | null = null
  private coach: HTMLElement | null = null
  private timer: HTMLElement | null = null
  private timeBtn: HTMLButtonElement | null = null
  private magnetBtn: HTMLButtonElement | null = null
  private chipSig = ''
  private floats: HTMLElement | null = null
  private toastTimer = 0
  private hintTimer = 0

  constructor(frame: HTMLElement) {
    this.ui = el('div', 'ui')
    frame.appendChild(this.ui)
  }

  get blocking() {
    return this.modal !== null
  }

  clear() {
    this.closeModal()
    this.ui.replaceChildren()
    this.play = null
    this.coach = null
    this.timer = null
    this.timeBtn = null
    this.magnetBtn = null
    this.floats = null
    this.chipSig = ''
    window.clearTimeout(this.hintTimer)
  }

  closeModal() {
    this.modal?.remove()
    this.modal = null
  }

  showTitle(actions: {
    onStart: () => void
    onMap: () => void
    onCheckin: () => void
    onSkins: () => void
    onSettings: () => void
    onHow: () => void
    onCredits: () => void
  }) {
    this.clear()
    const save = loadSave()
    const starsN = totalStars(save)
    const latest = Math.min(save.unlocked, LEVEL_COUNT)
    const clearedAll = save.unlocked > LEVEL_COUNT
    const primary = clearedAll ? t('replayFinal') : save.unlocked > 1 ? t('continue') : t('start')
    const root = el('div', 'screen title-screen')
    root.append(el('p', 'kicker', t('kicker')))
    const sign = el('div', 'sign')
    sign.append(el('h1', '', t('gameTitle')), el('p', '', t('tagline')))
    root.append(sign)
    const stack = el('div', 'stack')
    stack.append(
      button(primary, 'green', actions.onStart),
      button(t('levelMap'), 'blue', actions.onMap),
    )
    const row = el('div', 'row')
    const checkin = button(t('checkin'), 'yellow', actions.onCheckin)
    if (checkinView(save).canClaim) checkin.append(el('i', 'dot'))
    row.append(checkin, button(t('skins'), 'grey', actions.onSkins), button(t('settings'), 'grey', actions.onSettings))
    stack.append(row)
    root.append(stack)
    root.append(el('p', 'status', t('status', { level: latest, stars: starsN, coins: save.coins })))
    const foot = el('div', 'row')
    foot.append(button(t('how'), 'grey', actions.onHow), button(t('credits'), 'grey', actions.onCredits))
    root.append(foot)
    this.ui.append(root)
  }

  showHow(thenStart: boolean, onClose: () => void) {
    this.openModal(t('how'), '', [
      t('how1'),
      t('how2'),
      t('how3'),
      t('howStars'),
    ], [button(thenStart ? t('startGulp') : t('gotIt'), 'green', onClose)])
  }

  showMap(page: number, onBack: () => void, onPick: (id: number) => void, onPage: (page: number) => void) {
    this.clear()
    const save = loadSave()
    const pageCount = Math.ceil(LEVELS.length / 6)
    const root = el('div', 'screen map-screen')
    const head = el('div', 'topbar')
    head.append(button(t('back'), 'grey', onBack), el('div', 'top-copy'))
    const copy = head.querySelector('.top-copy') as HTMLElement
    copy.append(el('h2', '', t('levelMap')), el('p', '', `${pageTitle(page)} · ${totalStars(save)} / ${LEVELS.length * 3}`))
    root.append(head)
    const list = el('div', 'map-list')
    const slice = LEVELS.slice(page * 6, page * 6 + 6)
    slice.forEach((level) => {
      const open = level.id <= save.unlocked
      const earned = getStars(level.id, save)
      const current = level.id === Math.min(save.unlocked, LEVELS.length)
      const card = el('button', `map-card${open ? '' : ' locked'}${current ? ' current' : ''}`)
      card.type = 'button'
      card.append(el('b', '', String(level.id)), el('span', '', levelName(level.id)))
      if (open) card.append(stars(earned))
      else card.append(el('em', '', t('locked')))
      card.addEventListener('click', () => {
        if (!open) {
          this.toast(t('clearPrevious'))
          audio.play('error', 0.6)
          return
        }
        audio.click()
        onPick(level.id)
      })
      list.append(card)
    })
    root.append(list)
    const pager = el('div', 'pager')
    pager.append(
      button(t('prevPage'), page === 0 ? 'grey' : 'blue', () => page > 0 && onPage(page - 1)),
      el('span', '', `${page + 1} / ${pageCount}`),
      button(t('nextPage'), page >= pageCount - 1 ? 'grey' : 'blue', () => page < pageCount - 1 && onPage(page + 1)),
    )
    root.append(pager)
    this.ui.append(root)
  }

  showPlay(levelName: string, levelId: number, hint: string, onPause: () => void, onTime: () => void, onMagnet: () => void) {
    this.clear()
    const hud = el('div', 'hud')
    const head = el('header')
    head.append(button(t('pause'), 'grey', onPause))
    const titles = el('div', 'titles')
    titles.append(el('small', '', t('levelN', { n: levelId })), el('strong', '', levelName))
    head.append(titles)
    this.timer = el('div', 'timer', '0:00')
    head.append(this.timer)
    const chips = el('div', 'chips')
    const hintEl = el('p', 'hint', hint)
    this.coach = el('div', 'coach', t('dragCoach'))
    this.coach.hidden = levelId !== 1
    const foot = el('footer')
    this.timeBtn = button(t('timeAd'), 'yellow', onTime)
    this.magnetBtn = button(t('magnetAd'), 'blue', onMagnet)
    foot.append(this.timeBtn, this.magnetBtn)
    this.floats = el('div', 'floats')
    const banner = el('div', 'banner', `${t('levelN', { n: levelId })}  ${levelName}`)
    hud.append(head, chips, hintEl, this.coach, foot, this.floats, banner)
    window.setTimeout(() => banner.classList.add('hide'), 900)
    window.setTimeout(() => banner.remove(), 1400)
    window.clearTimeout(this.hintTimer)
    this.hintTimer = window.setTimeout(() => this.fadeHint(), 2400)
    this.play = hud
    this.ui.append(hud)
  }

  fadeHint() {
    this.play?.querySelector('.hint')?.classList.add('hide')
  }

  syncPlay(timeText: string, low: boolean, timeLabel: string, magnetLabel: string, chips: ChipState[]) {
    if (this.timer) {
      this.timer.textContent = timeText
      this.timer.classList.toggle('low', low)
    }
    if (this.timeBtn) this.timeBtn.textContent = timeLabel
    if (this.magnetBtn) this.magnetBtn.textContent = magnetLabel
    const sig = chips.map((chip) => `${chip.kind}:${chip.have}/${chip.need}`).join('|')
    if (sig === this.chipSig || !this.play) return
    this.chipSig = sig
    const box = this.play.querySelector('.chips')
    if (!box) return
    box.replaceChildren()
    for (const chip of chips) {
      const done = chip.have >= chip.need
      const node = el('div', `chip${done ? ' done' : ''}`)
      const img = el('img')
      img.src = kindIcon(chip.kind)
      img.alt = ''
      node.append(img, el('span', '', `${chip.name} ${chip.have}/${chip.need}`))
      if (done) {
        const mark = el('img', 'mark')
        mark.src = asset('assets/kenney/ui/check.png')
        mark.alt = ''
        node.append(mark)
      }
      box.append(node)
    }
  }

  placeCoach(x: number, y: number, show: boolean) {
    if (!this.coach) return
    this.coach.hidden = !show
    if (!show) return
    this.coach.style.left = `${x}px`
    this.coach.style.top = `${y}px`
  }

  clearCoach() {
    if (this.coach) this.coach.hidden = true
  }

  float(text: string, color: string, x: number, y: number) {
    if (!this.floats) return
    const node = el('span', 'float', text)
    node.style.color = color
    node.style.left = `${x}px`
    node.style.top = `${y}px`
    this.floats.append(node)
    window.setTimeout(() => node.remove(), 760)
  }

  showPause(hint: string, onResume: () => void, onRestart: () => void, onToggleSfx: () => void, onMap: () => void) {
    const save = loadSave()
    this.openModal(t('paused'), hint, [t('howStars')], [
      button(t('resume'), 'green', onResume),
      button(t('restart'), 'blue', onRestart),
      button(save.settings.sfx ? t('soundOn') : t('soundOff'), 'yellow', onToggleSfx),
      button(t('levelMap'), 'grey', onMap),
    ])
  }

  showFail(title: string, subtitle: string, left: number, revived: boolean, onRevive: (() => void) | null, onRestart: () => void, onMap: () => void) {
    const buttons = []
    if (onRevive) buttons.push(button(t('watchRevive'), 'yellow', onRevive))
    buttons.push(button(t('restart'), 'green', onRestart), button(t('backToMap'), 'blue', onMap))
    this.openModal(title, subtitle, [t('targetsLeft', { n: left }), revived ? t('revivedOnce') : t('reviveHelp')], buttons)
  }

  showWin(info: WinInfo, onNext: () => void, onAgain: () => void, onMap: () => void) {
    const title = info.stars === 3 ? t('winPerfect') : info.stars === 2 ? t('winNice') : t('winClear')
    const lines = [
      info.coins > 0 ? t('coinsGain', { n: info.coins }) : info.improved ? t('newRecord') : t('noImprove'),
      t('secondsLeft', { n: Math.ceil(info.timeLeft) }),
      info.clean ? t('cleanStar') : t('spentStar'),
    ]
    const buttons = [
      button(info.last ? t('replayFinal') : t('nextLevel'), 'green', info.last ? onAgain : onNext),
      button(t('playAgain'), 'blue', onAgain),
      button(t('levelMap'), 'grey', onMap),
    ]
    this.openModal(title, info.name, lines, buttons, info.stars)
  }

  showCheckin(onBack: () => void) {
    this.clear()
    const save = loadSave()
    const view = checkinView(save)
    const root = el('div', 'screen sheet')
    const head = el('div', 'topbar')
    head.append(button(t('back'), 'grey', onBack), el('h2', '', t('dailyTitle')))
    root.append(head, el('p', 'note', view.note), el('p', 'gold', t('coinsNow', { n: save.coins })))
    const list = el('div', 'check-list')
    CHECKIN_REWARDS.forEach((reward, index) => {
      const day = index + 1
      const today = day === view.today
      const claimed = day <= view.claimed
      const row = el('div', `check-row${today ? ' today' : ''}`)
      row.append(el('b', '', t('dayN', { n: day })), el('span', '', checkinRewardText(reward.coins, reward.magnet)))
      const state = claimed ? t('claimed') : today && view.canClaim ? t('today') : today ? t('claimed') : t('later')
      row.append(el('em', claimed || (today && !view.canClaim) ? 'ok' : '', state))
      list.append(row)
    })
    root.append(list)
    root.append(
      button(view.canClaim ? t('claimToday') : t('claimedToday'), view.canClaim ? 'yellow' : 'grey', () => {
        if (!view.canClaim) return
        const result = claimCheckin()
        if (!result.ok) {
          audio.play('error', 0.6)
          return
        }
        audio.confirm()
        this.showCheckin(onBack)
      }),
    )
    root.append(el('p', 'fine', t('checkinFine')))
    this.ui.append(root)
  }

  showSkins(onBack: () => void) {
    this.clear()
    const save = loadSave()
    refreshUnlocks(save)
    const root = el('div', 'screen sheet')
    const head = el('div', 'topbar')
    head.append(button(t('back'), 'grey', onBack))
    const copy = el('div', 'top-copy')
    copy.append(el('h2', '', t('skinsTitle')), el('p', '', t('skinStatus', { coins: save.coins, stars: totalStars(save) })))
    head.append(copy)
    root.append(head)
    const list = el('div', 'skin-list')
    for (const skin of SKINS) {
      const owned = save.owned.includes(skin.id)
      const equipped = save.skin === skin.id
      const card = el('article', equipped ? 'skin equipped' : 'skin')
      const preview = el('div', 'hole-preview')
      preview.style.setProperty('--rim', `#${skin.rimHi.toString(16).padStart(6, '0')}`)
      preview.style.setProperty('--void', `#${skin.void.toString(16).padStart(6, '0')}`)
      const text = el('div')
      text.append(el('h3', '', skinName(skin.id)), el('p', '', skinBlurb(skin.id)))
      const extra =
        skin.price <= 0
          ? t('skinFree')
          : owned
            ? t('skinOwned')
            : `${t('skinPrice', { price: skin.price })}${skin.freeLevel ? t('skinOrLevel', { n: skin.freeLevel }) : ''}${skin.freeStars ? t('skinOrStars', { n: skin.freeStars }) : ''}`
      text.append(el('small', '', extra))
      const tone: Tone = equipped ? 'grey' : owned ? 'green' : 'yellow'
      const label = equipped ? t('equipped') : owned ? t('useSkin') : t('unlock')
      card.append(preview, text, button(label, tone, () => this.pickSkin(skin.id, onBack), equipped))
      list.append(card)
    }
    root.append(list, el('p', 'fine', t('skinFine')))
    this.ui.append(root)
  }

  showSettings(onBack: () => void, onCredits: () => void) {
    this.clear()
    const save = loadSave()
    const root = el('div', 'screen sheet')
    const head = el('div', 'topbar')
    head.append(button(t('back'), 'grey', onBack), el('h2', '', t('settings')))
    root.append(head)
    const rows: { title: string; detail: string; key: 'sfx' | 'music' | 'vibrate' }[] = [
      { title: t('sfx'), detail: t('sfxDetail'), key: 'sfx' },
      { title: t('music'), detail: t('musicDetail'), key: 'music' },
      { title: t('vibrate'), detail: t('vibrateDetail'), key: 'vibrate' },
    ]
    for (const row of rows) {
      const on = save.settings[row.key]
      const card = el('article', 'setting')
      const text = el('div')
      text.append(el('h3', '', row.title), el('p', '', row.detail))
      card.append(
        text,
        button(on ? t('on') : t('off'), on ? 'green' : 'grey', () => {
          const data = loadSave()
          data.settings[row.key] = !data.settings[row.key]
          saveGame(data)
          audio.apply(data.settings)
          audio.play('toggle', 0.7)
          this.showSettings(onBack, onCredits)
        }, true),
      )
      root.append(card)
    }
    root.append(button(t('creditsTitle'), 'blue', onCredits))
    root.append(el('p', 'note', t('settingsNote1')))
    root.append(el('p', 'note', t('settingsNote2')))
    this.ui.append(root)
  }

  showCredits(onBack: () => void) {
    this.clear()
    const root = el('div', 'screen sheet')
    const card = el('article', 'credits')
    card.append(el('h2', '', t('creditsTitle')))
    const lines = [
      t('credit1'),
      t('credit2'),
      t('credit3'),
      t('credit4'),
      t('credit5'),
      t('credit6'),
      t('credit7'),
      t('credit8'),
      t('credit9'),
      t('credit10'),
    ]
    for (const line of lines) card.append(el('p', '', line))
    root.append(card, button(t('back'), 'green', onBack))
    this.ui.append(root)
  }

  toast(message: string) {
    this.ui.querySelector('.toast')?.remove()
    const node = el('div', 'toast', message)
    this.ui.append(node)
    window.clearTimeout(this.toastTimer)
    this.toastTimer = window.setTimeout(() => node.remove(), 900)
  }

  private pickSkin(id: SkinId, onBack: () => void) {
    const save = loadSave()
    const skin = SKINS.find((entry) => entry.id === id)
    if (!skin || save.skin === id) return
    if (!save.owned.includes(id)) {
      if (save.coins < skin.price || skin.price <= 0) {
        this.toast(t('notEnough'))
        audio.play('error', 0.6)
        return
      }
      save.coins -= skin.price
      save.owned.push(id)
    }
    save.skin = id
    saveGame(save)
    audio.confirm()
    this.showSkins(onBack)
  }

  private openModal(title: string, subtitle: string, lines: string[], buttons: HTMLButtonElement[], starCount?: number) {
    this.closeModal()
    const layer = el('div', 'modal-layer')
    const card = el('article', 'card')
    card.append(el('h2', '', title))
    if (subtitle) card.append(el('p', 'sub', subtitle))
    if (starCount) card.append(stars(starCount))
    for (const line of lines) card.append(el('p', 'line', line))
    const stack = el('div', 'stack')
    for (const node of buttons) stack.append(node)
    card.append(stack)
    layer.append(card)
    this.modal = layer
    this.ui.append(layer)
  }
}
