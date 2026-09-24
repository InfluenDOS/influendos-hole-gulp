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
  size: number
  r: number
  g: number
  b: number
}

const MAX = 96

export class Bursts {
  private bits: Bit[] = []
  private geo: THREE.BufferGeometry
  private points: THREE.Points
  private pos: Float32Array
  private col: Float32Array

  constructor(parent: THREE.Object3D) {
    this.pos = new Float32Array(MAX * 3)
    this.col = new Float32Array(MAX * 3)
    this.geo = new THREE.BufferGeometry()
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3))
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3))
    const mat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const tex = new THREE.TextureLoader().load(asset('assets/kenney/particles/circle.png'))
    tex.colorSpace = THREE.SRGBColorSpace
    mat.map = tex
    mat.alphaTest = 0.15
    this.points = new THREE.Points(this.geo, mat)
    this.points.frustumCulled = false
    this.points.renderOrder = 4
    parent.add(this.points)
    for (let i = 0; i < MAX; i++) this.bits.push({ x: 0, y: -8, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 0.1, r: 1, g: 1, b: 1 })
  }

  burst(x: number, y: number, z: number, color: number, count: number, speed: number) {
    const c = new THREE.Color(color)
    let left = count
    for (const bit of this.bits) {
      if (bit.life > 0) continue
      const ang = Math.random() * Math.PI * 2
      const up = 0.6 + Math.random() * 1.4
      const vel = speed * (0.45 + Math.random() * 0.7)
      bit.life = bit.max = 0.28 + Math.random() * 0.28
      bit.x = x
      bit.y = y
      bit.z = z
      bit.vx = Math.cos(ang) * vel
      bit.vz = Math.sin(ang) * vel
      bit.vy = up
      bit.r = c.r
      bit.g = c.g
      bit.b = c.b
      left -= 1
      if (left <= 0) break
    }
  }

  update(dt: number) {
    for (let i = 0; i < MAX; i++) {
      const bit = this.bits[i]
      const o = i * 3
      if (bit.life <= 0) {
        this.pos[o + 1] = -12
        continue
      }
      bit.life -= dt
      bit.vy -= 6 * dt
      bit.x += bit.vx * dt
      bit.y += bit.vy * dt
      bit.z += bit.vz * dt
      const fade = Math.max(0, bit.life / bit.max)
      this.pos[o] = bit.x
      this.pos[o + 1] = bit.y
      this.pos[o + 2] = bit.z
      this.col[o] = bit.r * fade
      this.col[o + 1] = bit.g * fade
      this.col[o + 2] = bit.b * fade
    }
    this.geo.attributes.position.needsUpdate = true
    this.geo.attributes.color.needsUpdate = true
  }

  dispose() {
    this.points.removeFromParent()
    this.geo.dispose()
    const mat = this.points.material
    if (mat instanceof THREE.Material) {
      const map = (mat as THREE.PointsMaterial).map
      map?.dispose()
      mat.dispose()
    }
  }
}
