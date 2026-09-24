export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`
}

export const IMAGE_MANIFEST: Record<string, string> = {
  'btn-green': 'assets/kenney/ui/btn-green.png',
  'btn-yellow': 'assets/kenney/ui/btn-yellow.png',
  'btn-red': 'assets/kenney/ui/btn-red.png',
  'btn-blue': 'assets/kenney/ui/btn-blue.png',
  'btn-grey': 'assets/kenney/ui/btn-grey.png',
  'round-green': 'assets/kenney/ui/round-green.png',
  'round-yellow': 'assets/kenney/ui/round-yellow.png',
  'round-blue': 'assets/kenney/ui/round-blue.png',
  'round-grey': 'assets/kenney/ui/round-grey.png',
  'round-red': 'assets/kenney/ui/round-red.png',
  star: 'assets/kenney/ui/star.png',
  'star-grey': 'assets/kenney/ui/star-grey.png',
  'star-outline': 'assets/kenney/ui/star-outline.png',
  check: 'assets/kenney/ui/check.png',
  cross: 'assets/kenney/ui/cross.png',
  'arrow-left': 'assets/kenney/ui/arrow-left.png',
  'arrow-right': 'assets/kenney/ui/arrow-right.png',
  'p-circle': 'assets/kenney/particles/circle.png',
  'p-star': 'assets/kenney/particles/star.png',
  'p-spark': 'assets/kenney/particles/spark.png',
  'p-twirl': 'assets/kenney/particles/twirl.png',
  'p-magic': 'assets/kenney/particles/magic.png',
}
