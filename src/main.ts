import './style.css'
import { openRewardedSlot } from './game/ads'
import { Arena, failCopy } from './game/arena'
import { asset } from './game/assets'
import { audio } from './game/audio'
import { warmIcons } from './game/icons'
import { LEVEL_COUNT } from './game/levels'
import { grantLevelClear, loadSave, saveGame } from './game/save'
import { Stage } from './game/stage'
import { Shell } from './ui/shell'

const frame = document.getElementById('frame')
if (!frame) throw new Error('missing frame')

for (const tone of ['green', 'yellow', 'blue', 'grey', 'red']) {
  document.documentElement.style.setProperty(`--btn-${tone}`, `url("${asset(`assets/kenney/ui/btn-${tone}.png`)}")`)
}

const stage = new Stage(frame)
const shell = new Shell(frame)
let arena: Arena | null = null
let mapPage = 0
let levelId = 1
let coachOn = false
let screen: 'title' | 'map' | 'play' | 'checkin' | 'skins' | 'settings' | 'credits' = 'title'
const held = new Set<string>()

const unlock = () => audio.unlock()
window.addEventListener('pointerdown', unlock)
window.addEventListener('keydown', unlock)
window.addEventListener('contextmenu', (event) => event.preventDefault())

function fmt(timeLeft: number): string {
  const s = Math.max(0, Math.ceil(timeLeft))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function leavePlay() {
  if (!arena) return
  stage.remove(arena.root)
  arena.dispose()
  arena = null
  stage.setPlaying(false)
  audio.setBed('menu')
}

function showTitle() {
  screen = 'title'
  leavePlay()
  shell.showTitle({
    onStart: startFromTitle,
    onMap: () => {
      const save = loadSave()
      const latest = Math.min(save.unlocked, LEVEL_COUNT)
      mapPage = Math.floor((latest - 1) / 6)
      showMap()
    },
    onCheckin: () => showCheckin('title'),
    onSkins: () => showSkins('title'),
    onSettings: () => showSettings('title'),
    onHow: () => shell.showHow(false, () => shell.closeModal()),
    onCredits: () => showCredits('title'),
  })
}

function startFromTitle() {
  const save = loadSave()
  const latest = Math.min(save.unlocked, LEVEL_COUNT)
  const go = () => enterPlay(latest)
  if (!save.seenHow) {
    shell.showHow(true, () => {
      const data = loadSave()
      data.seenHow = true
      saveGame(data)
      shell.closeModal()
      go()
    })
    return
  }
  go()
}

function showMap() {
  screen = 'map'
  leavePlay()
  const pageCount = Math.ceil(LEVEL_COUNT / 6)
  mapPage = Math.max(0, Math.min(pageCount - 1, mapPage))
  shell.showMap(mapPage, showTitle, (id) => enterPlay(id), (page) => {
    mapPage = page
    showMap()
  })
}

function showCheckin(back: 'title' | 'map') {
  screen = 'checkin'
  shell.showCheckin(() => (back === 'map' ? showMap() : showTitle()))
}

function showSkins(back: 'title' | 'map') {
  screen = 'skins'
  shell.showSkins(() => (back === 'map' ? showMap() : showTitle()))
}

function showSettings(back: 'title' | 'play') {
  screen = 'settings'
  shell.showSettings(
    () => (back === 'play' ? enterPlay(levelId) : showTitle()),
    () => showCredits(back === 'play' ? 'play' : 'settings-title'),
  )
}

function showCredits(back: 'title' | 'play' | 'settings-title') {
  screen = 'credits'
  shell.showCredits(() => {
    if (back === 'play') enterPlay(levelId)
    else if (back === 'settings-title') showSettings('title')
    else showTitle()
  })
}

function enterPlay(id: number) {
  screen = 'play'
  levelId = id
  coachOn = id === 1
  if (arena) {
    stage.remove(arena.root)
    arena.dispose()
    arena = null
  }
  arena = new Arena(id, stage.reduce)
  stage.add(arena.root)
  stage.setPlaying(true)
  stage.snap(arena.focus())
  audio.setBed('play')
  const current = arena
  current.onShake = (amp) => {
    stage.shakeAmp = Math.max(stage.shakeAmp, amp)
  }
  current.onFloat = (text, color, x, y, z) => {
    const point = stage.project(x, y, z)
    if (point) shell.float(text, color, point.x, point.y)
  }
  current.onFail = () => openFail()
  current.onWin = () => openWin()
  shell.showPlay(
    current.level.name,
    current.level.id,
    current.level.hint,
    openPause,
    () => void useTime(),
    () => void useMagnet(),
  )
}

function openPause() {
  if (!arena || (arena.mode !== 'play' && arena.mode !== 'pause')) return
  arena.setMode('pause')
  shell.showPause(
    arena.level.hint,
    () => {
      shell.closeModal()
      arena?.setMode('play')
    },
    () => enterPlay(levelId),
    () => {
      const data = loadSave()
      data.settings.sfx = !data.settings.sfx
      saveGame(data)
      audio.apply(data.settings)
      audio.play('toggle', 0.7)
      openPause()
    },
    () => {
      mapPage = Math.floor((levelId - 1) / 6)
      showMap()
    },
  )
}

function openFail() {
  if (!arena) return
  const [title, subtitle] = failCopy(arena.failReason)
  shell.showFail(
    title,
    subtitle,
    arena.targetsLeft(),
    arena.revived,
    arena.revived ? null : () => void revive(),
    () => enterPlay(levelId),
    () => {
      mapPage = Math.floor((levelId - 1) / 6)
      showMap()
    },
  )
}

function openWin() {
  if (!arena) return
  const result = grantLevelClear(arena.level.id, LEVEL_COUNT, arena.timeLeft, arena.level.time, arena.boostersUsed, arena.revived)
  const last = arena.level.id >= LEVEL_COUNT
  shell.showWin(
    {
      stars: result.stars,
      coins: result.coins,
      improved: result.improved,
      timeLeft: arena.timeLeft,
      clean: arena.boostersUsed === 0 && !arena.revived,
      name: arena.level.name,
      last,
    },
    () => enterPlay(arena ? Math.min(LEVEL_COUNT, arena.level.id + 1) : levelId),
    () => enterPlay(levelId),
    () => {
      mapPage = Math.floor((levelId - 1) / 6)
      showMap()
    },
  )
}

async function useTime() {
  if (!arena || arena.mode !== 'play') return
  const save = loadSave()
  if (save.timeBoosters > 0) {
    save.timeBoosters -= 1
    saveGame(save)
    arena.applyTime()
    audio.confirm()
    return
  }
  arena.setMode('ad')
  const ok = await openRewardedSlot(shell.ui, '加时 15 秒')
  if (!arena?.alive) return
  if (!ok) {
    arena.setMode('play')
    return
  }
  audio.confirm()
  arena.setMode('play')
  arena.applyTime()
}

async function useMagnet() {
  if (!arena || arena.mode !== 'play') return
  const save = loadSave()
  if (save.magnetBoosters > 0) {
    save.magnetBoosters -= 1
    saveGame(save)
    arena.applyMagnet()
    audio.confirm()
    return
  }
  arena.setMode('ad')
  const ok = await openRewardedSlot(shell.ui, '磁铁 8 秒')
  if (!arena?.alive) return
  if (!ok) {
    arena.setMode('play')
    return
  }
  audio.confirm()
  arena.setMode('play')
  arena.applyMagnet()
}

async function revive() {
  if (!arena) return
  arena.setMode('ad')
  shell.closeModal()
  const ok = await openRewardedSlot(shell.ui, '复活并加时')
  if (!arena.alive) return
  if (!ok) {
    arena.setMode('fail')
    openFail()
    return
  }
  audio.confirm()
  arena.revive()
}

function axes() {
  let x = 0
  let z = 0
  if (held.has('a') || held.has('arrowleft')) x -= 1
  if (held.has('d') || held.has('arrowright')) x += 1
  if (held.has('w') || held.has('arrowup')) z -= 1
  if (held.has('s') || held.has('arrowdown')) z += 1
  return { x, z }
}

window.addEventListener('keydown', (event) => {
  held.add(event.key.toLowerCase())
  if (event.key === 'Escape' && screen === 'play' && arena) {
    if (arena.mode === 'play') openPause()
    else if (arena.mode === 'pause') {
      shell.closeModal()
      arena.setMode('play')
    }
  }
})
window.addEventListener('keyup', (event) => held.delete(event.key.toLowerCase()))
document.addEventListener('visibilitychange', () => {
  if (document.hidden && arena?.mode === 'play') openPause()
})

const canvas = stage.renderer.domElement
canvas.addEventListener('pointerdown', (event) => {
  if (!arena || arena.mode !== 'play' || shell.blocking) return
  const point = stage.groundPoint(event.clientX, event.clientY)
  if (!point) return
  const tw = arena.tw
  if (point.x < tw.minX || point.x > tw.maxX || point.z < tw.minZ || point.z > tw.maxZ) return
  arena.setDragging(true, point)
  coachOn = false
  shell.clearCoach()
  canvas.setPointerCapture(event.pointerId)
})
canvas.addEventListener('pointermove', (event) => {
  if (!arena || !event.buttons) return
  const point = stage.groundPoint(event.clientX, event.clientY)
  if (point) arena.setPointer(point)
})
const endDrag = () => arena?.setDragging(false, null)
canvas.addEventListener('pointerup', endDrag)
canvas.addEventListener('pointercancel', endDrag)

const boot = async () => {
  warmIcons()
  audio.apply(loadSave().settings)
  await Promise.race([
    Promise.all([audio.load(), document.fonts.load('bold 48px "Noto Sans SC"').catch(() => undefined)]),
    new Promise((resolve) => window.setTimeout(resolve, 2000)),
  ])
  document.getElementById('boot')?.remove()
  showTitle()
}

let last = performance.now()
const loop = (now: number) => {
  const dt = Math.min(0.033, (now - last) / 1000)
  last = now
  if (arena && screen === 'play') {
    const stick = arena.mode === 'play' ? axes() : { x: 0, z: 0 }
    arena.setKeys(stick.x, stick.z)
    arena.update(dt)
    const focus = arena.focus()
    stage.follow(focus, dt)
    const save = loadSave()
    const timeLabel = save.timeBoosters > 0 ? `加时 · ${save.timeBoosters}` : '加时 · 广告'
    const magnetLabel =
      arena.magnetLeft > 0
        ? `磁铁 ${Math.ceil(arena.magnetLeft)}秒`
        : save.magnetBoosters > 0
          ? `磁铁 · ${save.magnetBoosters}`
          : '磁铁 · 广告'
    shell.syncPlay(fmt(arena.timeLeft), arena.timeLeft <= 8, timeLabel, magnetLabel, arena.chips())
    if (coachOn && arena.mode === 'play') {
      const point = stage.project(focus.x, 0.2, focus.z)
      if (point) shell.placeCoach(point.x, point.y + 36, true)
    }
  } else {
    stage.updateMenu(dt)
  }
  stage.render()
  requestAnimationFrame(loop)
}

window.addEventListener('resize', () => stage.resize())
new ResizeObserver(() => stage.resize()).observe(frame)
void boot()
requestAnimationFrame(loop)
