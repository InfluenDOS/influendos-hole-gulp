export type Tier = 1 | 2 | 3 | 4 | 5

/** Objects can be swallowed when their radius is within this fraction of the hole. */
export const EAT_RATIO = 0.64

export const TIER_RADIUS: Record<Tier, number> = {
  1: 20,
  2: 30,
  3: 42,
  4: 56,
  5: 72,
}

export const BOMB_RADIUS = 28

/** How close a bomb center must get, as a fraction of hole radius. */
export const BOMB_RATIO = 0.5

/** Food is gulped once its center is inside this fraction of the hole radius. */
export const GULP_RATIO = 0.62

export function growAmount(tier: Tier): number {
  return 5 + tier * 3.5
}

export function canEat(objRadius: number, holeRadius: number): boolean {
  return objRadius <= holeRadius * EAT_RATIO + 0.01
}

export function rateStars(
  timeLeft: number,
  timeLimit: number,
  boostersUsed: number,
  revived: boolean,
): 1 | 2 | 3 {
  const ratio = timeLimit <= 0 ? 0 : timeLeft / timeLimit
  if (ratio >= 0.5 && boostersUsed === 0 && !revived) return 3
  if (ratio >= 0.28) return 2
  return 1
}
