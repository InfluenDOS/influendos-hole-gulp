import { BOMB_RADIUS, BOMB_RATIO, GULP_RATIO, TIER_RADIUS, canEat, growAmount, type Tier } from './balance'
import type { Kind } from './kinds'
import { checklistRows, holeStart, itemXY, metrics, tableXY } from './theme'

export type Role = 'target' | 'snack' | 'bomb' | 'decoy'

export type Item = {
  k: Kind
  u: number
  v: number
  t: Tier
  role: Role
  wander: number
}

export type Obstacle =
  | { kind: 'rect'; u: number; v: number; w: number; h: number }
  | { kind: 'circle'; u: number; v: number; r: number }

export type LevelDef = {
  id: number
  name: string
  hint: string
  time: number
  startR: number
  maxR: number
  items: Item[]
  obstacles: Obstacle[]
}

function it(k: Kind, u: number, v: number, t: Tier, role: Role, wander = 0): Item {
  return { k, u, v, t, role, wander }
}

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: '一口草莓',
    hint: '按住桌面拖动黑洞，把草莓吞掉',
    time: 40,
    startR: 48,
    maxR: 130,
    obstacles: [],
    items: [
      it('berry', 0.18, 0.22, 1, 'target'),
      it('berry', 0.78, 0.28, 1, 'target'),
      it('berry', 0.42, 0.78, 1, 'target'),
      it('coin', 0.22, 0.62, 1, 'snack'),
      it('coin', 0.72, 0.7, 1, 'snack'),
    ],
  },
  {
    id: 2,
    name: '橙子进阶',
    hint: '先吞小草莓，洞变大后再吞橙子',
    time: 48,
    startR: 46,
    maxR: 145,
    obstacles: [],
    items: [
      it('berry', 0.2, 0.2, 1, 'target'),
      it('berry', 0.78, 0.22, 1, 'target'),
      it('berry', 0.18, 0.72, 1, 'target'),
      it('orange', 0.72, 0.48, 2, 'target'),
      it('orange', 0.4, 0.84, 2, 'target'),
      it('coin', 0.84, 0.78, 1, 'snack'),
    ],
  },
  {
    id: 3,
    name: '饼干时间',
    hint: '饼干和糖果都要吃完，先从小草莓开始',
    time: 50,
    startR: 46,
    maxR: 150,
    obstacles: [],
    items: [
      it('berry', 0.16, 0.18, 1, 'snack'),
      it('berry', 0.84, 0.16, 1, 'snack'),
      it('berry', 0.18, 0.84, 1, 'snack'),
      it('cookie', 0.32, 0.32, 2, 'target'),
      it('cookie', 0.7, 0.7, 2, 'target'),
      it('candy', 0.74, 0.28, 2, 'target'),
      it('candy', 0.28, 0.72, 2, 'target'),
    ],
  },
  {
    id: 4,
    name: '炸弹登场',
    hint: '红色炸弹碰下去就会失败',
    time: 48,
    startR: 48,
    maxR: 155,
    obstacles: [],
    items: [
      it('apple', 0.22, 0.24, 1, 'target'),
      it('apple', 0.78, 0.26, 1, 'target'),
      it('apple', 0.5, 0.82, 3, 'target'),
      it('coin', 0.18, 0.55, 1, 'snack'),
      it('coin', 0.82, 0.58, 1, 'snack'),
      it('coin', 0.48, 0.18, 1, 'snack'),
      it('bomb', 0.12, 0.12, 1, 'bomb'),
      it('bomb', 0.88, 0.88, 1, 'bomb'),
    ],
  },
  {
    id: 5,
    name: '别碰辣椒',
    hint: '葡萄是目标，辣椒吞了就出局',
    time: 50,
    startR: 46,
    maxR: 150,
    obstacles: [],
    items: [
      it('grape', 0.28, 0.22, 2, 'target'),
      it('grape', 0.74, 0.36, 2, 'target'),
      it('grape', 0.36, 0.78, 2, 'target'),
      it('berry', 0.16, 0.48, 1, 'snack'),
      it('berry', 0.84, 0.16, 1, 'snack'),
      it('berry', 0.8, 0.8, 1, 'snack'),
      it('chili', 0.7, 0.16, 2, 'decoy'),
      it('chili', 0.16, 0.84, 2, 'decoy'),
    ],
  },
  {
    id: 6,
    name: '金币铺路',
    hint: '先捡金币把洞养大，再吞宝石',
    time: 52,
    startR: 44,
    maxR: 165,
    obstacles: [],
    items: [
      it('coin', 0.18, 0.18, 1, 'snack'),
      it('coin', 0.4, 0.16, 1, 'snack'),
      it('coin', 0.78, 0.18, 1, 'snack'),
      it('coin', 0.16, 0.78, 1, 'snack'),
      it('coin', 0.84, 0.62, 1, 'snack'),
      it('gem', 0.3, 0.4, 3, 'target'),
      it('gem', 0.72, 0.42, 3, 'target'),
      it('gem', 0.48, 0.82, 4, 'target'),
      it('bomb', 0.88, 0.12, 1, 'bomb'),
      it('bomb', 0.12, 0.88, 1, 'bomb'),
    ],
  },
  {
    id: 7,
    name: '双色拼盘',
    hint: '西瓜和芝士都在清单上',
    time: 54,
    startR: 46,
    maxR: 165,
    obstacles: [],
    items: [
      it('melon', 0.24, 0.22, 2, 'target'),
      it('melon', 0.76, 0.24, 2, 'target'),
      it('cheese', 0.22, 0.7, 3, 'target'),
      it('cheese', 0.74, 0.74, 3, 'target'),
      it('berry', 0.48, 0.16, 1, 'snack'),
      it('berry', 0.16, 0.46, 1, 'snack'),
      it('cookie', 0.84, 0.48, 2, 'snack'),
      it('bomb', 0.5, 0.88, 1, 'bomb'),
    ],
  },
  {
    id: 8,
    name: '木块夹道',
    hint: '绕开木块，别蹭到炸弹',
    time: 56,
    startR: 48,
    maxR: 150,
    obstacles: [
      { kind: 'rect', u: 0.34, v: 0.34, w: 300, h: 36 },
      { kind: 'rect', u: 0.68, v: 0.66, w: 300, h: 36 },
    ],
    items: [
      it('candy', 0.78, 0.16, 2, 'target'),
      it('candy', 0.82, 0.4, 2, 'target'),
      it('candy', 0.18, 0.58, 2, 'target'),
      it('candy', 0.22, 0.86, 2, 'target'),
      it('coin', 0.5, 0.14, 1, 'snack'),
      it('coin', 0.5, 0.9, 1, 'snack'),
      it('bomb', 0.14, 0.16, 1, 'bomb'),
      it('bomb', 0.86, 0.86, 1, 'bomb'),
    ],
  },
  {
    id: 9,
    name: '甜甜圈',
    hint: '甜甜圈很大，先把小糖果吃掉',
    time: 54,
    startR: 44,
    maxR: 170,
    obstacles: [],
    items: [
      it('candy', 0.16, 0.16, 1, 'snack'),
      it('candy', 0.4, 0.14, 1, 'snack'),
      it('candy', 0.84, 0.18, 1, 'snack'),
      it('candy', 0.16, 0.84, 1, 'snack'),
      it('berry', 0.84, 0.55, 1, 'snack'),
      it('berry', 0.2, 0.55, 1, 'snack'),
      it('donut', 0.32, 0.34, 3, 'target'),
      it('donut', 0.7, 0.4, 3, 'target'),
      it('donut', 0.48, 0.8, 4, 'target'),
      it('bomb', 0.88, 0.84, 1, 'bomb'),
      it('bomb', 0.12, 0.36, 1, 'bomb'),
    ],
  },
  {
    id: 10,
    name: '冰与火',
    hint: '只吞冰块。辣椒和炸弹都会失败',
    time: 50,
    startR: 46,
    maxR: 160,
    obstacles: [],
    items: [
      it('ice', 0.26, 0.22, 2, 'target'),
      it('ice', 0.74, 0.28, 2, 'target'),
      it('ice', 0.4, 0.78, 2, 'target'),
      it('coin', 0.16, 0.48, 1, 'snack'),
      it('coin', 0.84, 0.5, 1, 'snack'),
      it('coin', 0.5, 0.14, 1, 'snack'),
      it('chili', 0.16, 0.16, 1, 'decoy'),
      it('chili', 0.84, 0.16, 1, 'decoy'),
      it('chili', 0.56, 0.58, 3, 'decoy'),
      it('bomb', 0.14, 0.86, 1, 'bomb'),
      it('bomb', 0.88, 0.86, 1, 'bomb'),
    ],
  },
  {
    id: 11,
    name: '急速清盘',
    hint: '时间很短，下手要快',
    time: 30,
    startR: 56,
    maxR: 150,
    obstacles: [],
    items: [
      it('berry', 0.2, 0.18, 1, 'target'),
      it('berry', 0.48, 0.16, 1, 'target'),
      it('berry', 0.78, 0.2, 1, 'target'),
      it('berry', 0.18, 0.78, 1, 'target'),
      it('orange', 0.72, 0.48, 2, 'target'),
      it('orange', 0.4, 0.82, 2, 'target'),
      it('coin', 0.84, 0.8, 1, 'snack'),
    ],
  },
  {
    id: 12,
    name: '纸杯迷宫',
    hint: '绕开木块，吃完三只纸杯蛋糕',
    time: 60,
    startR: 46,
    maxR: 160,
    obstacles: [
      { kind: 'rect', u: 0.5, v: 0.2, w: 360, h: 28 },
      { kind: 'rect', u: 0.2, v: 0.48, w: 28, h: 170 },
      { kind: 'rect', u: 0.8, v: 0.52, w: 28, h: 160 },
      { kind: 'rect', u: 0.48, v: 0.82, w: 260, h: 28 },
    ],
    items: [
      it('cupcake', 0.5, 0.36, 3, 'target'),
      it('cupcake', 0.32, 0.66, 3, 'target'),
      it('cupcake', 0.68, 0.68, 3, 'target'),
      it('berry', 0.08, 0.08, 1, 'snack'),
      it('berry', 0.92, 0.08, 1, 'snack'),
      it('berry', 0.08, 0.9, 1, 'snack'),
      it('berry', 0.92, 0.9, 1, 'snack'),
      it('bomb', 0.92, 0.28, 1, 'bomb'),
      it('bomb', 0.08, 0.28, 1, 'bomb'),
    ],
  },
  {
    id: 13,
    name: '宝石四级',
    hint: '宝石一颗比一颗大，金币负责把洞喂大',
    time: 56,
    startR: 44,
    maxR: 175,
    obstacles: [],
    items: [
      it('coin', 0.16, 0.16, 1, 'snack'),
      it('coin', 0.38, 0.14, 1, 'snack'),
      it('coin', 0.62, 0.14, 1, 'snack'),
      it('coin', 0.84, 0.2, 1, 'snack'),
      it('coin', 0.16, 0.48, 1, 'snack'),
      it('gem', 0.78, 0.4, 2, 'target'),
      it('gem', 0.28, 0.36, 3, 'target'),
      it('gem', 0.72, 0.72, 4, 'target'),
      it('gem', 0.36, 0.82, 5, 'target'),
      it('bomb', 0.88, 0.88, 1, 'bomb'),
      it('bomb', 0.12, 0.84, 1, 'bomb'),
    ],
  },
  {
    id: 14,
    name: '派对长桌',
    hint: '清单上的都要吃，仙人掌不行',
    time: 62,
    startR: 46,
    maxR: 175,
    obstacles: [],
    items: [
      it('candy', 0.18, 0.16, 2, 'target'),
      it('candy', 0.42, 0.14, 2, 'target'),
      it('star', 0.78, 0.18, 2, 'target'),
      it('star', 0.16, 0.42, 2, 'target'),
      it('donut', 0.78, 0.46, 3, 'target'),
      it('cupcake', 0.32, 0.78, 3, 'target'),
      it('berry', 0.84, 0.72, 1, 'snack'),
      it('berry', 0.16, 0.72, 1, 'snack'),
      it('berry', 0.55, 0.88, 1, 'snack'),
      it('cactus', 0.86, 0.88, 3, 'decoy'),
      it('bomb', 0.12, 0.88, 1, 'bomb'),
      it('bomb', 0.5, 0.28, 1, 'bomb'),
    ],
  },
  {
    id: 15,
    name: '炸弹花园',
    hint: '洞越大越容易吸到炸弹，走位要收着',
    time: 52,
    startR: 48,
    maxR: 155,
    obstacles: [
      { kind: 'circle', u: 0.3, v: 0.32, r: 28 },
      { kind: 'circle', u: 0.7, v: 0.68, r: 28 },
    ],
    items: [
      it('apple', 0.18, 0.2, 2, 'target'),
      it('apple', 0.5, 0.14, 2, 'target'),
      it('apple', 0.82, 0.22, 2, 'target'),
      it('grape', 0.18, 0.78, 3, 'target'),
      it('grape', 0.82, 0.78, 3, 'target'),
      it('coin', 0.16, 0.48, 1, 'snack'),
      it('coin', 0.84, 0.5, 1, 'snack'),
      it('coin', 0.5, 0.88, 1, 'snack'),
      it('bomb', 0.12, 0.12, 1, 'bomb'),
      it('bomb', 0.88, 0.12, 1, 'bomb'),
      it('bomb', 0.12, 0.88, 1, 'bomb'),
      it('bomb', 0.88, 0.88, 1, 'bomb'),
      it('bomb', 0.5, 0.42, 1, 'bomb'),
    ],
  },
  {
    id: 16,
    name: '巨大西瓜',
    hint: '先把小吃吃掉，才能吞下大西瓜',
    time: 58,
    startR: 44,
    maxR: 180,
    obstacles: [],
    items: [
      it('berry', 0.14, 0.14, 1, 'snack'),
      it('berry', 0.34, 0.12, 1, 'snack'),
      it('berry', 0.66, 0.12, 1, 'snack'),
      it('berry', 0.88, 0.16, 1, 'snack'),
      it('orange', 0.14, 0.38, 2, 'snack'),
      it('orange', 0.86, 0.4, 2, 'snack'),
      it('orange', 0.16, 0.7, 2, 'snack'),
      it('cookie', 0.84, 0.68, 2, 'snack'),
      it('cookie', 0.3, 0.86, 2, 'snack'),
      it('cheese', 0.72, 0.84, 4, 'target'),
      it('melon', 0.48, 0.28, 5, 'target'),
      it('bomb', 0.12, 0.9, 1, 'bomb'),
      it('bomb', 0.9, 0.9, 1, 'bomb'),
    ],
  },
  {
    id: 17,
    name: '差一秒',
    hint: '限时极短，看清再吞，辣椒是陷阱',
    time: 32,
    startR: 54,
    maxR: 150,
    obstacles: [],
    items: [
      it('star', 0.22, 0.2, 2, 'target'),
      it('star', 0.78, 0.22, 2, 'target'),
      it('star', 0.5, 0.78, 2, 'target'),
      it('candy', 0.18, 0.5, 1, 'target'),
      it('candy', 0.5, 0.16, 1, 'target'),
      it('candy', 0.82, 0.52, 1, 'target'),
      it('chili', 0.16, 0.82, 1, 'decoy'),
      it('chili', 0.84, 0.82, 1, 'decoy'),
      it('bomb', 0.5, 0.4, 1, 'bomb'),
    ],
  },
  {
    id: 18,
    name: '晃动皮球',
    hint: '皮球会轻轻晃，看准洞口再吞',
    time: 54,
    startR: 46,
    maxR: 170,
    obstacles: [],
    items: [
      it('coin', 0.16, 0.16, 1, 'snack'),
      it('coin', 0.4, 0.14, 1, 'snack'),
      it('coin', 0.84, 0.16, 1, 'snack'),
      it('coin', 0.16, 0.84, 1, 'snack'),
      it('star', 0.84, 0.5, 1, 'snack'),
      it('star', 0.18, 0.5, 1, 'snack'),
      it('ball', 0.32, 0.32, 3, 'target', 26),
      it('ball', 0.7, 0.36, 3, 'target', 22),
      it('ball', 0.5, 0.8, 4, 'target', 18),
      it('bomb', 0.88, 0.84, 1, 'bomb'),
      it('bomb', 0.12, 0.36, 1, 'bomb'),
    ],
  },
  {
    id: 19,
    name: '四角危机',
    hint: '四个角都是炸弹，从中间吃',
    time: 48,
    startR: 46,
    maxR: 165,
    obstacles: [],
    items: [
      it('gem', 0.36, 0.28, 3, 'target'),
      it('gem', 0.66, 0.7, 3, 'target'),
      it('ice', 0.28, 0.62, 2, 'target'),
      it('ice', 0.74, 0.32, 2, 'target'),
      it('apple', 0.5, 0.16, 2, 'target'),
      it('apple', 0.5, 0.86, 2, 'target'),
      it('berry', 0.2, 0.4, 1, 'snack'),
      it('berry', 0.8, 0.58, 1, 'snack'),
      it('bomb', 0.1, 0.1, 1, 'bomb'),
      it('bomb', 0.9, 0.1, 1, 'bomb'),
      it('bomb', 0.1, 0.9, 1, 'bomb'),
      it('bomb', 0.9, 0.9, 1, 'bomb'),
    ],
  },
  {
    id: 20,
    name: '满桌盛宴',
    hint: '对照清单，把目标全部吞完',
    time: 66,
    startR: 44,
    maxR: 180,
    obstacles: [],
    items: [
      it('berry', 0.16, 0.16, 1, 'target'),
      it('berry', 0.84, 0.16, 1, 'target'),
      it('orange', 0.18, 0.4, 2, 'target'),
      it('orange', 0.82, 0.42, 2, 'target'),
      it('cookie', 0.32, 0.28, 2, 'target'),
      it('donut', 0.7, 0.7, 3, 'target'),
      it('cupcake', 0.28, 0.74, 3, 'target'),
      it('gem', 0.55, 0.88, 4, 'target'),
      it('coin', 0.5, 0.14, 1, 'snack'),
      it('coin', 0.14, 0.62, 1, 'snack'),
      it('coin', 0.88, 0.66, 1, 'snack'),
      it('chili', 0.12, 0.88, 2, 'decoy'),
      it('chili', 0.88, 0.88, 2, 'decoy'),
      it('bomb', 0.4, 0.5, 1, 'bomb'),
      it('bomb', 0.62, 0.22, 1, 'bomb'),
    ],
  },
  {
    id: 21,
    name: '大师试炼',
    hint: '木块、炸弹、错误食物，都要躲开',
    time: 52,
    startR: 44,
    maxR: 175,
    obstacles: [
      { kind: 'rect', u: 0.5, v: 0.22, w: 280, h: 26 },
      { kind: 'rect', u: 0.22, v: 0.62, w: 26, h: 150 },
      { kind: 'circle', u: 0.78, v: 0.62, r: 22 },
    ],
    items: [
      it('berry', 0.12, 0.1, 1, 'snack'),
      it('berry', 0.36, 0.1, 1, 'snack'),
      it('berry', 0.88, 0.1, 1, 'snack'),
      it('berry', 0.12, 0.9, 1, 'snack'),
      it('coin', 0.68, 0.1, 1, 'snack'),
      it('coin', 0.4, 0.9, 1, 'snack'),
      it('cupcake', 0.86, 0.28, 3, 'target'),
      it('melon', 0.12, 0.36, 3, 'target'),
      it('donut', 0.68, 0.4, 4, 'target'),
      it('gem', 0.86, 0.88, 4, 'target'),
      it('chili', 0.08, 0.62, 2, 'decoy'),
      it('cactus', 0.4, 0.74, 2, 'decoy'),
      it('bomb', 0.9, 0.55, 1, 'bomb'),
      it('bomb', 0.08, 0.2, 1, 'bomb'),
      it('bomb', 0.55, 0.08, 1, 'bomb'),
    ],
  },
  {
    id: 22,
    name: '一口吞宇宙',
    hint: '最终关：从小吃到大，吞下最后那颗宝石',
    time: 62,
    startR: 44,
    maxR: 190,
    obstacles: [],
    items: [
      it('berry', 0.14, 0.14, 1, 'snack'),
      it('berry', 0.36, 0.12, 1, 'snack'),
      it('berry', 0.64, 0.12, 1, 'snack'),
      it('berry', 0.88, 0.16, 1, 'snack'),
      it('candy', 0.14, 0.4, 1, 'snack'),
      it('candy', 0.88, 0.42, 1, 'snack'),
      it('coin', 0.16, 0.58, 1, 'snack'),
      it('coin', 0.9, 0.58, 1, 'snack'),
      it('star', 0.28, 0.28, 2, 'target'),
      it('star', 0.72, 0.26, 2, 'target'),
      it('ball', 0.36, 0.78, 3, 'target', 16),
      it('gem', 0.5, 0.18, 3, 'target'),
      it('donut', 0.74, 0.72, 4, 'target'),
      it('gem', 0.52, 0.9, 5, 'target'),
      it('chili', 0.1, 0.9, 2, 'decoy'),
      it('chili', 0.9, 0.88, 2, 'decoy'),
      it('bomb', 0.08, 0.28, 1, 'bomb'),
      it('bomb', 0.92, 0.3, 1, 'bomb'),
      it('bomb', 0.28, 0.55, 1, 'bomb'),
    ],
  },
]

export const LEVEL_COUNT = LEVELS.length

export const PAGE_TITLES = ['热身桌', '小心桌', '挑战桌', '大师桌']

export function targetKinds(items: Item[]): Kind[] {
  const list: Kind[] = []
  for (const item of items) {
    if (item.role === 'target' && !list.includes(item.k)) list.push(item.k)
  }
  return list
}

export function levelRows(level: LevelDef): number {
  return checklistRows(targetKinds(level.items).length)
}

export function getLevel(id: number): LevelDef {
  const level = LEVELS.find((entry) => entry.id === id)
  if (!level) throw new Error(`missing level ${id}`)
  return level
}

function radiusOf(item: Item): number {
  return item.role === 'bomb' ? BOMB_RADIUS : TIER_RADIUS[item.t]
}

function distPointRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): number {
  const cx = Math.max(rx, Math.min(px, rx + rw))
  const cy = Math.max(ry, Math.min(py, ry + rh))
  return Math.hypot(px - cx, py - cy)
}

export function validateLevels(): string[] {
  const problems: string[] = []
  if (LEVELS.length < 20) problems.push(`需要至少 20 关，现在 ${LEVELS.length}`)
  LEVELS.forEach((level, index) => {
    if (level.id !== index + 1) problems.push(`关卡序号不连续：${level.id}`)
    const rows = levelRows(level)
    const start = holeStart(rows)
    const m = metrics(rows)
    const foods = level.items.filter((item) => item.role === 'snack' || item.role === 'target')
    if (!foods.some((item) => item.role === 'target')) problems.push(`${level.id} 没有目标`)
    let hole = level.startR
    const pending = foods.map((item) => ({ item, eaten: false }))
    for (let guard = 0; guard < 80 && pending.some((entry) => !entry.eaten); guard++) {
      const edible = pending.filter((entry) => !entry.eaten && canEat(TIER_RADIUS[entry.item.t], hole))
      if (!edible.length) break
      edible.sort((a, b) => TIER_RADIUS[a.item.t] - TIER_RADIUS[b.item.t])
      edible[0].eaten = true
      hole = Math.min(level.maxR, hole + growAmount(edible[0].item.t))
    }
    if (pending.some((entry) => entry.item.role === 'target' && !entry.eaten)) {
      problems.push(`${level.id} ${level.name} 按当前成长吃不完目标`)
    }
    const placed = level.items.map((item) => ({ item, ...itemXY(item.u, item.v, rows), r: radiusOf(item) }))
    for (const p of placed) {
      if (p.x - p.r < m.tableX + 4 || p.x + p.r > m.tableX + m.tableW - 4 || p.y - p.r < m.tableY + 4 || p.y + p.r > m.tableBottom - 4) {
        problems.push(`${level.id} ${p.item.k} 超出桌面`)
      }
      const dist = Math.hypot(p.x - start.x, p.y - start.y)
      const safe = p.item.role === 'bomb' ? level.startR * BOMB_RATIO + 36 : level.startR * GULP_RATIO + 22
      if (dist < safe) problems.push(`${level.id} ${p.item.k} 离出生点太近 (${dist.toFixed(0)})`)
    }
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i]
        const b = placed[j]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        if (dist < a.r + b.r + 8) {
          problems.push(`${level.id} ${a.item.k} 与 ${b.item.k} 重叠 (${dist.toFixed(0)} < ${(a.r + b.r + 8).toFixed(0)})`)
        }
      }
    }
    for (const obstacle of level.obstacles) {
      const c = tableXY(obstacle.u, obstacle.v, rows)
      if (obstacle.kind === 'circle') {
        if (Math.hypot(c.x - start.x, c.y - start.y) < obstacle.r + 36) {
          problems.push(`${level.id} 圆形障碍挡住出生点`)
        }
        for (const p of placed) {
          if (Math.hypot(p.x - c.x, p.y - c.y) < p.r + obstacle.r + 6) {
            problems.push(`${level.id} ${p.item.k} 压到圆障碍`)
          }
        }
      } else {
        const rx = c.x - obstacle.w / 2
        const ry = c.y - obstacle.h / 2
        if (distPointRect(start.x, start.y, rx, ry, obstacle.w, obstacle.h) < 36) {
          problems.push(`${level.id} 木块挡住出生点`)
        }
        for (const p of placed) {
          if (distPointRect(p.x, p.y, rx, ry, obstacle.w, obstacle.h) < p.r + 8) {
            problems.push(`${level.id} ${p.item.k} 压到木块`)
          }
        }
      }
    }
  })
  return problems
}

const levelProblems = validateLevels()
if (levelProblems.length) {
  throw new Error(`关卡数据有误\n${levelProblems.join('\n')}`)
}
