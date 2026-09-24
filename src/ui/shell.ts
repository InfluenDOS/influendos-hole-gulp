import { asset } from '../game/assets'
import { audio } from '../game/audio'
import { kindIcon } from '../game/icons'
import { LEVELS, LEVEL_COUNT, PAGE_TITLES } from '../game/levels'
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
    const primary = clearedAll ? '再挑战终关' : save.unlocked > 1 ? '继续闯关' : '开始游戏'
    const root = el('div', 'screen title-screen')
    root.append(el('p', 'kicker', '超休闲 · 竖屏一口吞'))
    const sign = el('div', 'sign')
    sign.append(el('h1', '', '黑洞一口吞'), el('p', '', '拖动黑洞，把桌子吃干净'))
    root.append(sign)
    const stack = el('div', 'stack')
    stack.append(
      button(primary, 'green', actions.onStart),
      button('关卡地图', 'blue', actions.onMap),
    )
    const row = el('div', 'row')
    const checkin = button('签到', 'yellow', actions.onCheckin)
    if (checkinView(save).canClaim) checkin.append(el('i', 'dot'))
    row.append(checkin, button('皮肤', 'grey', actions.onSkins), button('设置', 'grey', actions.onSettings))
    stack.append(row)
    root.append(stack)
    root.append(el('p', 'status', `第 ${latest} 关可玩 · ${starsN} 星 · ${save.coins} 金币`))
    const foot = el('div', 'row')
    foot.append(button('怎么玩', 'grey', actions.onHow), button('致谢', 'grey', actions.onCredits))
    root.append(foot)
    this.ui.append(root)
  }

  showHow(thenStart: boolean, onClose: () => void) {
    this.openModal('怎么玩', '', [
      '1. 按住地面，拖动黑洞',
      '2. 小的会翻滚掉进洞里，洞才会变大',
      '3. 炸弹、辣椒、仙人掌会失败',
      '三星：剩余时间过半，且不用道具和复活',
    ], [button(thenStart ? '开始吞噬' : '知道了', 'green', onClose)])
  }

  showMap(page: number, onBack: () => void, onPick: (id: number) => void, onPage: (page: number) => void) {
    this.clear()
    const save = loadSave()
    const pageCount = Math.ceil(LEVELS.length / 6)
    const root = el('div', 'screen map-screen')
    const head = el('div', 'topbar')
    head.append(button('返回', 'grey', onBack), el('div', 'top-copy'))
    const copy = head.querySelector('.top-copy') as HTMLElement
    copy.append(el('h2', '', '关卡地图'), el('p', '', `${PAGE_TITLES[page] ?? ''} · ${totalStars(save)} / ${LEVELS.length * 3} 星`))
    root.append(head)
    const list = el('div', 'map-list')
    const slice = LEVELS.slice(page * 6, page * 6 + 6)
    slice.forEach((level) => {
      const open = level.id <= save.unlocked
      const earned = getStars(level.id, save)
      const current = level.id === Math.min(save.unlocked, LEVELS.length)
      const card = el('button', `map-card${open ? '' : ' locked'}${current ? ' current' : ''}`)
      card.type = 'button'
      card.append(el('b', '', String(level.id)), el('span', '', level.name))
      if (open) card.append(stars(earned))
      else card.append(el('em', '', '未解锁'))
      card.addEventListener('click', () => {
        if (!open) {
          this.toast('先通过上一关')
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
      button('上一页', page === 0 ? 'grey' : 'blue', () => page > 0 && onPage(page - 1)),
      el('span', '', `${page + 1} / ${pageCount}`),
      button('下一页', page >= pageCount - 1 ? 'grey' : 'blue', () => page < pageCount - 1 && onPage(page + 1)),
    )
    root.append(pager)
    this.ui.append(root)
  }

  showPlay(levelName: string, levelId: number, hint: string, onPause: () => void, onTime: () => void, onMagnet: () => void) {
    this.clear()
    const hud = el('div', 'hud')
    const head = el('header')
    head.append(button('暂停', 'grey', onPause))
    const titles = el('div', 'titles')
    titles.append(el('small', '', `第 ${levelId} 关`), el('strong', '', levelName))
    head.append(titles)
    this.timer = el('div', 'timer', '0:00')
    head.append(this.timer)
    const chips = el('div', 'chips')
    const hintEl = el('p', 'hint', hint)
    this.coach = el('div', 'coach', '按住拖动')
    this.coach.hidden = levelId !== 1
    const foot = el('footer')
    this.timeBtn = button('加时', 'yellow', onTime)
    this.magnetBtn = button('磁铁', 'blue', onMagnet)
    foot.append(this.timeBtn, this.magnetBtn)
    this.floats = el('div', 'floats')
    const banner = el('div', 'banner', `第 ${levelId} 关  ${levelName}`)
    hud.append(head, chips, hintEl, this.coach, foot, this.floats, banner)
    window.setTimeout(() => banner.classList.add('hide'), 900)
    window.setTimeout(() => banner.remove(), 1400)
    this.play = hud
    this.ui.append(hud)
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
    this.openModal('暂停', hint, ['三星：剩余时间过半，且没用道具或复活'], [
      button('继续', 'green', onResume),
      button('重新开始', 'blue', onRestart),
      button(`音效：${save.settings.sfx ? '开' : '关'}`, 'yellow', onToggleSfx),
      button('关卡地图', 'grey', onMap),
    ])
  }

  showFail(title: string, subtitle: string, left: number, revived: boolean, onRevive: (() => void) | null, onRestart: () => void, onMap: () => void) {
    const buttons = []
    if (onRevive) buttons.push(button('看视频复活', 'yellow', onRevive))
    buttons.push(button('重新开始', 'green', onRestart), button('返回地图', 'blue', onMap))
    this.openModal(title, subtitle, [`还差 ${left} 个目标`, revived ? '本局已经复活过一次' : '复活后加 12 秒，并短暂无敌'], buttons)
  }

  showWin(info: WinInfo, onNext: () => void, onAgain: () => void, onMap: () => void) {
    const title = info.stars === 3 ? '完美一口' : info.stars === 2 ? '漂亮' : '过关'
    const lines = [
      info.coins > 0 ? `金币 +${info.coins}` : info.improved ? '新纪录' : '星级没有超过上次',
      `剩余 ${Math.ceil(info.timeLeft)} 秒`,
      info.clean ? '干净通关可以拿到三星' : '用了道具或复活，最多两星',
    ]
    const buttons = [
      button(info.last ? '再挑战终关' : '下一关', 'green', info.last ? onAgain : onNext),
      button('再玩一次', 'blue', onAgain),
      button('关卡地图', 'grey', onMap),
    ]
    this.openModal(title, info.name, lines, buttons, info.stars)
  }

  showCheckin(onBack: () => void) {
    this.clear()
    const save = loadSave()
    const view = checkinView(save)
    const root = el('div', 'screen sheet')
    const head = el('div', 'topbar')
    head.append(button('返回', 'grey', onBack), el('h2', '', '每日签到'))
    root.append(head, el('p', 'note', view.note), el('p', 'gold', `当前金币 ${save.coins}`))
    const list = el('div', 'check-list')
    CHECKIN_REWARDS.forEach((reward, index) => {
      const day = index + 1
      const today = day === view.today
      const claimed = day <= view.claimed
      const row = el('div', `check-row${today ? ' today' : ''}`)
      row.append(el('b', '', `第${day}天`), el('span', '', reward.label))
      const state = claimed ? '已领取' : today && view.canClaim ? '今天' : today ? '已领取' : '未到'
      row.append(el('em', claimed || (today && !view.canClaim) ? 'ok' : '', state))
      list.append(row)
    })
    root.append(list)
    root.append(
      button(view.canClaim ? '领取今日奖励' : '今天已经领过', view.canClaim ? 'yellow' : 'grey', () => {
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
    root.append(el('p', 'fine', '签到存在这台设备上，断签会从第 1 天重来'))
    this.ui.append(root)
  }

  showSkins(onBack: () => void) {
    this.clear()
    const save = loadSave()
    refreshUnlocks(save)
    const root = el('div', 'screen sheet')
    const head = el('div', 'topbar')
    head.append(button('返回', 'grey', onBack))
    const copy = el('div', 'top-copy')
    copy.append(el('h2', '', '黑洞皮肤'), el('p', '', `${save.coins} 金币 · ${totalStars(save)} 星`))
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
      text.append(el('h3', '', skin.name), el('p', '', skin.desc))
      const extra =
        skin.price <= 0
          ? '默认拥有'
          : owned
            ? '已解锁'
            : `${skin.price} 金币${skin.freeLevel ? ` · 或通关第 ${skin.freeLevel} 关` : ''}${skin.freeStars ? ` · 或 ${skin.freeStars} 星` : ''}`
      text.append(el('small', '', extra))
      const tone: Tone = equipped ? 'grey' : owned ? 'green' : 'yellow'
      const label = equipped ? '使用中' : owned ? '使用' : '解锁'
      card.append(preview, text, button(label, tone, () => this.pickSkin(skin.id, onBack), equipped))
      list.append(card)
    }
    root.append(list, el('p', 'fine', '通关或攒星也会免费解锁，不必只靠金币'))
    this.ui.append(root)
  }

  showSettings(onBack: () => void, onCredits: () => void) {
    this.clear()
    const save = loadSave()
    const root = el('div', 'screen sheet')
    const head = el('div', 'topbar')
    head.append(button('返回', 'grey', onBack), el('h2', '', '设置'))
    root.append(head)
    const rows: { title: string; detail: string; key: 'sfx' | 'music' | 'vibrate' }[] = [
      { title: '音效', detail: '吞噬、按钮和失败声', key: 'sfx' },
      { title: '音乐', detail: '菜单和局内的轻音乐', key: 'music' },
      { title: '震动', detail: '吞大和失败时短震一下', key: 'vibrate' },
    ]
    for (const row of rows) {
      const on = save.settings[row.key]
      const card = el('article', 'setting')
      const text = el('div')
      text.append(el('h3', '', row.title), el('p', '', row.detail))
      card.append(
        text,
        button(on ? '已开' : '已关', on ? 'green' : 'grey', () => {
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
    root.append(button('素材致谢', 'blue', onCredits))
    root.append(el('p', 'note', '进度、星级、皮肤和签到都保存在本地。'))
    root.append(el('p', 'note', '清除浏览器网站数据会丢掉存档。'))
    this.ui.append(root)
  }

  showCredits(onBack: () => void) {
    this.clear()
    const root = el('div', 'screen sheet')
    const card = el('article', 'credits')
    card.append(el('h2', '', '素材致谢'))
    const lines = [
      '三维食物、炸弹、木块和黑洞用简单几何体搭建，是本项目原创。',
      '界面按钮、星星、箭头来自 Kenney UI Pack。',
      '吞噬碎屑来自 Kenney Particle Pack。',
      '按钮与撞击声来自 Kenney Interface Sounds、Impact Sounds。',
      '以上 Kenney 素材均为 CC0 1.0，可商用，署名非强制。',
      '作者 Kenney · kenney.nl',
      '中文界面字体为 Noto Sans CJK SC 子集。',
      '字体许可：SIL Open Font License 1.1。',
      '吞噬 whoosh、失败嗡声、过关旋律和背景音乐为原创合成。',
      '激励视频是试投占位，不会请求广告网络。',
    ]
    for (const line of lines) card.append(el('p', '', line))
    root.append(card, button('返回', 'green', onBack))
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
        this.toast('金币不够')
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
