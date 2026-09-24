export const SKIN_IDS = ['classic', 'galaxy', 'lava', 'mint'] as const
export type SkinId = (typeof SKIN_IDS)[number]

export type SkinDef = {
  id: SkinId
  name: string
  desc: string
  price: number
  /** Cleared level required for a free unlock. 0 = none. */
  freeLevel: number
  /** Total stars required for a free unlock. 0 = none. */
  freeStars: number
  rim: number
  rimHi: number
  void: number
  swirl: number
}

export const SKINS: SkinDef[] = [
  {
    id: 'classic',
    name: '经典黑洞',
    desc: '什么都想吞一口的基础款',
    price: 0,
    freeLevel: 0,
    freeStars: 0,
    rim: 0x3a3158,
    rimHi: 0xb7a6ff,
    void: 0x07060c,
    swirl: 0x8d7cff,
  },
  {
    id: 'galaxy',
    name: '星旋紫洞',
    desc: '漩涡里飘着细碎星尘',
    price: 80,
    freeLevel: 5,
    freeStars: 0,
    rim: 0x2a1d66,
    rimHi: 0xd4c6ff,
    void: 0x070818,
    swirl: 0x9ecbff,
  },
  {
    id: 'lava',
    name: '熔岩赤洞',
    desc: '边缘像刚从炉子里掏出来',
    price: 150,
    freeLevel: 0,
    freeStars: 18,
    rim: 0x6a2418,
    rimHi: 0xff9a4a,
    void: 0x140806,
    swirl: 0xffc27a,
  },
  {
    id: 'mint',
    name: '薄荷糖洞',
    desc: '清凉的浅色旋，看着就想吞',
    price: 220,
    freeLevel: 12,
    freeStars: 0,
    rim: 0x1c6a62,
    rimHi: 0xc8fff0,
    void: 0x071412,
    swirl: 0x7dffe1,
  },
]

export function skinById(id: SkinId): SkinDef {
  return SKINS.find((s) => s.id === id) ?? SKINS[0]
}
