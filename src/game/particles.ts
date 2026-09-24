import * as THREE from 'three'
import { asset } from './assets'

type Bit = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  max: number
  r: number
  g: number
  b: number
}

const MAX = 36

/** A short crumb puff when something is swallowed. One small pool, no trails. */
export class Bursts {
  private bits: Bit[] = []
  private geo: THREE.BufferGeometry
  private points: THREE.Points
  private pos: Float32Array
  private col: Float32Array
  private cursor = 0
  private tint = new THREE.Color()

  constructor(parent: THREE.Object3D) {
    this.pos = new Float32Array(MAX * 3)
    this.col = new Float32Array(MAX * 3)
    for (let i = 0; i < MAX; i++) {
      this.pos[i * 3 + 1] = -20
      this.bits.push({ x: 0, y: -8, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, r: 1, g: 1, b: 1 })
    }
    this.geo = new THREE.BufferGeometry()
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3))
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3))
    const map = new THREE.TextureLoader().load(asset('assets/kenney/particles/circle.png'))
    const mat = new THREE.PointsMaterial({
      size: 0.14,
      map,
      transparent: true,
      alphaTest: 0.2,
      depthWrite: false,
      vertexColors: true,
      sizeAttenuation: true,
    })
    this.points = new THREE.Points(this.geo, mat)
    this.points.frustumCulled = false
    this.points.renderOrder = 4
    parent.add(this.points)
  }

  burst(x: number, y: number, z: number, color: number, count: number, speed: number) {
    this.tint.setHex(color)
    const n = Math.min(6, Math.max(0, count))
    for (let i = 0; i < n; i++) {
      const slot = this.cursor
      this.cursor = (this.cursor + 1) % MAX
      const bit = this.bits[slot]
      const ang = Math.random() * Math.PI * 2
      const vel = speed * (0.55 + Math.random() * 0.4)
      bit.life = bit.max = 0.14 + Math.random() * 0.1
      bit.x = x
      bit.y = y
      bit.z = z
      bit.vx = Math.cos(ang) * vel
      bit.vz = Math.sin(ang) * vel
      bit.vy = 0.55 + Math.random() * 0.45
      bit.r = this.tint.r
      bit.g = this.tint.g
      bit.b = this.tint.b
    }
  }

  update(dt: number) {
    for (let i = 0; i < this.bits.length; i++) {
      const bit = this.bits[i]
      const o = i * 3
      if (bit.life <= 0) {
        this.pos[o + 1] = -20
        continue
      }
      bit.life -= dt
      if (bit.life <= 0.02) {
        bit.life = 0
        this.pos[o + 1] = -20
        continue
      }
      bit.vy -= 6 * dt
      bit.x += bit.vx * dt
      bit.y += bit.vy * dt
      bit.z += bit.vz * dt
      this.pos[o] = bit.x
      this.pos[o + 1] = bit.y
      this.pos[o + 2] = bit.z
      this.col[o] = bit.r
      this.col[o + 1] = bit.g
      this.col[o + 2] = bit.b
    }
    this.geo.attributes.position.needsUpdate = true
    this.geo.attributes.color.needsUpdate = true
  }

  dispose() {
    this.points.removeFromParent()
    this.geo.dispose()
    const mat = this.points.material
    if (mat instanceof THREE.PointsMaterial) {
      mat.map?.dispose()
      mat.dispose()
    }
  }
}
