export const KINDS = [
  'berry',
  'orange',
  'grape',
  'apple',
  'cookie',
  'candy',
  'donut',
  'gem',
  'coin',
  'ball',
  'star',
  'cupcake',
  'ice',
  'melon',
  'cheese',
  'bomb',
  'chili',
  'cactus',
] as const

export type Kind = (typeof KINDS)[number]

export const TEX = 160

export const KIND_NAME: Record<Kind, string> = {
  berry: '草莓',
  orange: '橙子',
  grape: '葡萄',
  apple: '苹果',
  cookie: '饼干',
  candy: '糖果',
  donut: '甜甜圈',
  gem: '宝石',
  coin: '金币',
  ball: '皮球',
  star: '星星糖',
  cupcake: '纸杯',
  ice: '冰块',
  melon: '西瓜',
  cheese: '芝士',
  bomb: '炸弹',
  chili: '辣椒',
  cactus: '仙人掌',
}

export const KIND_COLOR: Record<Kind, number> = {
  berry: 0xe23b4a,
  orange: 0xff8c1a,
  grape: 0x8a3fe0,
  apple: 0xe4333a,
  cookie: 0xd8924a,
  candy: 0xff4f93,
  donut: 0xff8fb8,
  gem: 0x2ec8ff,
  coin: 0xf5c431,
  ball: 0x3d7dff,
  star: 0xffc42e,
  cupcake: 0xf472b6,
  ice: 0x8fd4ff,
  melon: 0xff5d73,
  cheese: 0xffc83d,
  bomb: 0x2a2a30,
  chili: 0xef2d2d,
  cactus: 0x3aaa55,
}

type Ctx = CanvasRenderingContext2D

function disc(ctx: Ctx, x: number, y: number, r: number, fill: string, stroke = 'rgba(48,24,18,0.3)') {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = stroke
  ctx.stroke()
}

function gloss(ctx: Ctx, x: number, y: number, rx: number, ry: number) {
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, -0.5, 0, Math.PI * 2)
  ctx.fill()
}

function leaf(ctx: Ctx, x: number, y: number, rot: number, color = '#2f9a45') {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.beginPath()
  ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

function starPath(ctx: Ctx, x: number, y: number, outer: number, inner: number, points = 5) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = -Math.PI / 2 + (i * Math.PI) / points
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

const paintBerry = (ctx: Ctx) => {
  disc(ctx, 80, 88, 48, '#e23b4a')
  gloss(ctx, 62, 70, 16, 10)
  ctx.fillStyle = '#ffe08a'
  for (const [x, y] of [
    [62, 96],
    [80, 108],
    [98, 94],
    [74, 80],
    [96, 112],
    [86, 90],
  ] as const) {
    ctx.beginPath()
    ctx.ellipse(x, y, 3.2, 4.2, 0.4, 0, Math.PI * 2)
    ctx.fill()
  }
  leaf(ctx, 64, 42, -0.6)
  leaf(ctx, 96, 40, 0.5)
  ctx.strokeStyle = '#2a6b34'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(80, 52)
  ctx.lineTo(80, 36)
  ctx.stroke()
}

const paintOrange = (ctx: Ctx) => {
  disc(ctx, 80, 86, 50, '#ff8c1a')
  ctx.fillStyle = '#e36f00'
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(80 + Math.cos(a) * 28, 86 + Math.sin(a) * 28, 3, 0, Math.PI * 2)
    ctx.fill()
  }
  gloss(ctx, 60, 68, 14, 9)
  leaf(ctx, 104, 40, 0.4)
  ctx.fillStyle = '#2f9a45'
  ctx.beginPath()
  ctx.arc(78, 40, 7, 0, Math.PI * 2)
  ctx.fill()
}

const paintGrape = (ctx: Ctx) => {
  const pts = [
    [80, 108],
    [58, 92],
    [102, 92],
    [68, 70],
    [96, 70],
    [80, 52],
  ]
  for (const [x, y] of pts) disc(ctx, x, y, 22, '#7a35d6')
  gloss(ctx, 70, 60, 10, 7)
  leaf(ctx, 108, 40, 0.8, '#3aaa55')
}

const paintApple = (ctx: Ctx) => {
  disc(ctx, 80, 90, 50, '#e4333a')
  gloss(ctx, 58, 72, 14, 9)
  ctx.strokeStyle = '#6b3a22'
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(80, 48)
  ctx.quadraticCurveTo(86, 28, 78, 22)
  ctx.stroke()
  leaf(ctx, 100, 36, 0.7)
}

const paintCookie = (ctx: Ctx) => {
  disc(ctx, 80, 82, 52, '#e0a15a')
  ctx.fillStyle = '#6b3a22'
  for (const [x, y, r] of [
    [58, 70, 7],
    [96, 66, 6],
    [78, 98, 8],
    [108, 96, 5],
    [62, 104, 5],
    [92, 112, 4],
  ] as const) {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  gloss(ctx, 58, 60, 14, 8)
}

const paintCandy = (ctx: Ctx) => {
  ctx.fillStyle = '#ff4f93'
  ctx.beginPath()
  ctx.moveTo(18, 80)
  ctx.lineTo(48, 52)
  ctx.lineTo(112, 52)
  ctx.lineTo(142, 80)
  ctx.lineTo(112, 108)
  ctx.lineTo(48, 108)
  ctx.closePath()
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = 'rgba(48,24,18,0.28)'
  ctx.stroke()
  ctx.fillStyle = '#fff1f6'
  ctx.beginPath()
  ctx.ellipse(80, 80, 28, 24, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(62, 68)
  ctx.lineTo(98, 92)
  ctx.stroke()
}

const paintDonut = (ctx: Ctx) => {
  disc(ctx, 80, 84, 56, '#e7b07a')
  disc(ctx, 80, 80, 50, '#ff8fb8', 'rgba(48,24,18,0.2)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(80, 82, 20, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  const colors = ['#fff', '#ffd24a', '#5ad0ff', '#fff']
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ctx.save()
    ctx.translate(80 + Math.cos(a) * 36, 82 + Math.sin(a) * 34)
    ctx.rotate(a)
    ctx.fillStyle = colors[i % colors.length]
    ctx.fillRect(-5, -2, 10, 4)
    ctx.restore()
  }
}

const paintGem = (ctx: Ctx) => {
  ctx.beginPath()
  ctx.moveTo(80, 16)
  ctx.lineTo(136, 62)
  ctx.lineTo(80, 146)
  ctx.lineTo(24, 62)
  ctx.closePath()
  ctx.fillStyle = '#1aa8d8'
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = 'rgba(12,50,70,0.35)'
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(80, 16)
  ctx.lineTo(136, 62)
  ctx.lineTo(80, 70)
  ctx.closePath()
  ctx.fillStyle = '#bff6ff'
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(24, 62)
  ctx.lineTo(80, 70)
  ctx.lineTo(80, 146)
  ctx.closePath()
  ctx.fillStyle = '#0e7ea8'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(80, 28)
  ctx.lineTo(80, 78)
  ctx.stroke()
}

const paintCoin = (ctx: Ctx) => {
  disc(ctx, 80, 80, 54, '#f5c431')
  ctx.beginPath()
  ctx.arc(80, 80, 38, 0, Math.PI * 2)
  ctx.lineWidth = 6
  ctx.strokeStyle = '#c48a10'
  ctx.stroke()
  starPath(ctx, 80, 82, 22, 10)
  ctx.fillStyle = '#fff4c4'
  ctx.fill()
  gloss(ctx, 60, 58, 14, 8)
}

const paintBall = (ctx: Ctx) => {
  ctx.save()
  ctx.beginPath()
  ctx.arc(80, 80, 54, 0, Math.PI * 2)
  ctx.clip()
  const colors = ['#ff4d4d', '#ffffff', '#3d7dff', '#ffffff', '#ffd24a', '#ffffff']
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    ctx.moveTo(80, 80)
    ctx.arc(80, 80, 60, (i * Math.PI) / 3, ((i + 1) * Math.PI) / 3)
    ctx.closePath()
    ctx.fillStyle = colors[i]
    ctx.fill()
  }
  ctx.restore()
  ctx.beginPath()
  ctx.arc(80, 80, 54, 0, Math.PI * 2)
  ctx.lineWidth = 5
  ctx.strokeStyle = 'rgba(48,24,18,0.28)'
  ctx.stroke()
  disc(ctx, 80, 80, 12, '#ffffff', 'rgba(48,24,18,0.15)')
  gloss(ctx, 58, 56, 12, 8)
}

const paintStar = (ctx: Ctx) => {
  starPath(ctx, 80, 84, 62, 28)
  ctx.fillStyle = '#ffc42e'
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = 'rgba(120,70,10,0.35)'
  ctx.stroke()
  starPath(ctx, 80, 84, 28, 12)
  ctx.fillStyle = '#fff1b0'
  ctx.fill()
}

const paintCupcake = (ctx: Ctx) => {
  ctx.fillStyle = '#f472b6'
  ctx.beginPath()
  ctx.moveTo(40, 78)
  ctx.lineTo(120, 78)
  ctx.lineTo(108, 132)
  ctx.lineTo(52, 132)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 4
  for (const x of [62, 80, 98]) {
    ctx.beginPath()
    ctx.moveTo(x, 82)
    ctx.lineTo(x - 4, 128)
    ctx.stroke()
  }
  disc(ctx, 80, 70, 36, '#fff7fb', 'rgba(48,24,18,0.12)')
  disc(ctx, 58, 78, 22, '#ffe4f2', 'rgba(48,24,18,0.08)')
  disc(ctx, 104, 78, 22, '#ffe4f2', 'rgba(48,24,18,0.08)')
  disc(ctx, 80, 48, 14, '#e23b4a', 'rgba(48,24,18,0.2)')
}

const paintIce = (ctx: Ctx) => {
  roundRect(ctx, 36, 32, 88, 96, 18)
  ctx.fillStyle = '#b7e7ff'
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = 'rgba(30,70,110,0.28)'
  ctx.stroke()
  roundRect(ctx, 50, 46, 48, 28, 10)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(70, 50)
  ctx.lineTo(96, 110)
  ctx.moveTo(96, 60)
  ctx.lineTo(78, 96)
  ctx.stroke()
}

const paintMelon = (ctx: Ctx) => {
  ctx.beginPath()
  ctx.moveTo(80, 80)
  ctx.arc(80, 80, 64, Math.PI * 1.12, Math.PI * 1.88)
  ctx.closePath()
  ctx.fillStyle = '#ff5d73'
  ctx.fill()
  ctx.lineWidth = 16
  ctx.strokeStyle = '#3eae5a'
  ctx.beginPath()
  ctx.arc(80, 80, 56, Math.PI * 1.12, Math.PI * 1.88)
  ctx.stroke()
  ctx.lineWidth = 8
  ctx.strokeStyle = '#d8f5c8'
  ctx.beginPath()
  ctx.arc(80, 80, 46, Math.PI * 1.14, Math.PI * 1.86)
  ctx.stroke()
  ctx.fillStyle = '#3b2418'
  for (const [x, y] of [
    [62, 108],
    [80, 118],
    [98, 108],
    [74, 96],
    [92, 98],
  ] as const) {
    ctx.beginPath()
    ctx.ellipse(x, y, 3, 5, 0.4, 0, Math.PI * 2)
    ctx.fill()
  }
}

const paintCheese = (ctx: Ctx) => {
  ctx.beginPath()
  ctx.moveTo(28, 120)
  ctx.lineTo(132, 120)
  ctx.lineTo(86, 28)
  ctx.closePath()
  ctx.fillStyle = '#ffd34d'
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = 'rgba(120,70,10,0.3)'
  ctx.stroke()
  ctx.fillStyle = '#e7a020'
  ctx.fillRect(28, 112, 104, 10)
  ctx.fillStyle = '#fff4c4'
  for (const [x, y, r] of [
    [70, 90, 8],
    [98, 96, 6],
    [84, 70, 5],
  ] as const) {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

const paintBomb = (ctx: Ctx) => {
  disc(ctx, 76, 92, 48, '#2c2c34', 'rgba(0,0,0,0.35)')
  gloss(ctx, 58, 74, 14, 9)
  ctx.strokeStyle = '#6b4a32'
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(108, 58)
  ctx.quadraticCurveTo(132, 36, 118, 22)
  ctx.stroke()
  disc(ctx, 118, 20, 10, '#ffd24a', 'rgba(120,60,0,0.25)')
  disc(ctx, 118, 20, 5, '#ff7a18', 'rgba(0,0,0,0)')
}

const paintChili = (ctx: Ctx) => {
  const path = () => {
    ctx.beginPath()
    ctx.moveTo(46, 118)
    ctx.quadraticCurveTo(30, 60, 78, 40)
    ctx.quadraticCurveTo(126, 24, 118, 72)
    ctx.quadraticCurveTo(112, 112, 78, 100)
  }
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = 'rgba(48,24,18,0.28)'
  ctx.lineWidth = 36
  path()
  ctx.stroke()
  ctx.strokeStyle = '#ef2d2d'
  ctx.lineWidth = 28
  path()
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(52, 100)
  ctx.quadraticCurveTo(48, 64, 78, 48)
  ctx.stroke()
  ctx.strokeStyle = '#2f9a45'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(78, 40)
  ctx.quadraticCurveTo(62, 16, 44, 24)
  ctx.stroke()
}

const paintCactus = (ctx: Ctx) => {
  const arm = (x: number, y: number, w: number, h: number) => {
    roundRect(ctx, x, y, w, h, 16)
    ctx.fillStyle = '#3aaa55'
    ctx.fill()
    ctx.lineWidth = 5
    ctx.strokeStyle = 'rgba(20,60,30,0.28)'
    ctx.stroke()
  }
  arm(58, 36, 44, 100)
  arm(24, 62, 48, 28)
  arm(88, 78, 48, 28)
  ctx.strokeStyle = '#e7f7c8'
  ctx.lineWidth = 2
  for (const [x, y] of [
    [70, 52],
    [88, 70],
    [74, 96],
    [40, 74],
    [112, 90],
  ] as const) {
    ctx.beginPath()
    ctx.moveTo(x - 4, y)
    ctx.lineTo(x + 4, y)
    ctx.moveTo(x, y - 4)
    ctx.lineTo(x, y + 4)
    ctx.stroke()
  }
  disc(ctx, 108, 70, 10, '#ff6b9a', 'rgba(80,20,40,0.2)')
}

const PAINT: Record<Kind, (ctx: Ctx) => void> = {
  berry: paintBerry,
  orange: paintOrange,
  grape: paintGrape,
  apple: paintApple,
  cookie: paintCookie,
  candy: paintCandy,
  donut: paintDonut,
  gem: paintGem,
  coin: paintCoin,
  ball: paintBall,
  star: paintStar,
  cupcake: paintCupcake,
  ice: paintIce,
  melon: paintMelon,
  cheese: paintCheese,
  bomb: paintBomb,
  chili: paintChili,
  cactus: paintCactus,
}

export function paintKind(ctx: Ctx, kind: Kind) {
  ctx.clearRect(0, 0, TEX, TEX)
  PAINT[kind](ctx)
}

export function objKey(kind: Kind): string {
  return `obj-${kind}`
}
