import * as THREE from 'three'
import { skinById, type SkinId } from './skinData'
import type { TableUniforms } from './tableMat'

export class HoleView {
  readonly group = new THREE.Group()
  private radius = 1
  private skin: SkinId = 'classic'
  private mouth = 0.78
  private rim: THREE.Mesh
  private lip: THREE.Mesh
  private pit: THREE.Mesh
  private floor: THREE.Mesh
  private swirls: THREE.Mesh[] = []
  private magnet: THREE.Mesh
  private spark: THREE.Mesh
  private surface: TableUniforms | null = null
  private rimMat: THREE.MeshStandardMaterial
  private lipMat: THREE.MeshStandardMaterial
  private pitMat: THREE.MeshBasicMaterial
  private floorMat: THREE.MeshBasicMaterial
  private swirlMat: THREE.MeshBasicMaterial
  private magnetMat: THREE.MeshBasicMaterial
  private glowMat: THREE.MeshBasicMaterial
  private sheenMat: THREE.MeshBasicMaterial
  private glow: THREE.Mesh
  private sheen: THREE.Mesh
  private suck = 0

  constructor() {
    this.rimMat = new THREE.MeshStandardMaterial({ color: 0xb7a6ff, roughness: 0.28, metalness: 0.35, emissive: 0x2a2048, emissiveIntensity: 0.7 })
    this.lipMat = new THREE.MeshStandardMaterial({ color: 0x3a3158, roughness: 0.45, metalness: 0.18 })
    this.pitMat = new THREE.MeshBasicMaterial({ color: 0x07060c, side: THREE.BackSide })
    this.floorMat = new THREE.MeshBasicMaterial({ color: 0x020108 })
    this.swirlMat = new THREE.MeshBasicMaterial({ color: 0x8d7cff, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })
    this.magnetMat = new THREE.MeshBasicMaterial({ color: 0x7ef0ff, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false })
    this.glowMat = new THREE.MeshBasicMaterial({
      color: 0xc7b6ff,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    this.sheenMat = new THREE.MeshBasicMaterial({ color: 0xfff6ea })

    this.rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.085, 8, 28), this.rimMat)
    this.rim.rotation.x = Math.PI / 2
    this.lip = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.045, 6, 24), this.lipMat)
    this.lip.rotation.x = Math.PI / 2
    this.pit = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.42, 5.6, 28, 1, true), this.pitMat)
    this.floor = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), this.floorMat)
    this.floor.rotation.x = -Math.PI / 2
    this.magnet = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.28, 32), this.magnetMat)
    this.magnet.rotation.x = -Math.PI / 2
    this.spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffe7a8 }),
    )
    this.glow = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.42, 36), this.glowMat)
    this.glow.rotation.x = -Math.PI / 2
    this.glow.renderOrder = 3
    this.sheen = new THREE.Mesh(new THREE.TorusGeometry(1, 0.018, 6, 28), this.sheenMat)
    this.sheen.rotation.x = Math.PI / 2
    this.group.add(this.pit, this.floor, this.rim, this.lip, this.sheen, this.glow, this.magnet, this.spark)
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.18 + (i % 3) * 0.08, 0.26 + (i % 3) * 0.08, 20, 1, 0, 1.7), this.swirlMat)
      ring.rotation.x = -Math.PI / 2
      ring.position.y = -0.2 - i * 0.72
      this.swirls.push(ring)
      this.group.add(ring)
    }
    this.resize()
  }

  bindSurface(surface: TableUniforms | null) {
    this.surface = surface
  }

  setSkin(id: SkinId) {
    this.skin = id
    const skin = skinById(id)
    this.rimMat.color.setHex(skin.rimHi)
    this.rimMat.emissive.setHex(skin.rim)
    this.lipMat.color.setHex(skin.rim)
    this.pitMat.color.setHex(skin.void).lerp(new THREE.Color(skin.swirl), 0.42)
    this.floorMat.color.setHex(skin.void)
    this.swirlMat.color.setHex(skin.swirl)
    this.glowMat.color.setHex(skin.swirl)
    this.sheenMat.color.setHex(skin.rimHi)
    this.spark.visible = id === 'lava' || id === 'galaxy'
    if (this.surface) this.surface.uGlow.value.setHex(skin.swirl)
  }

  setRadius(radius: number) {
    this.radius = Math.max(0.2, radius)
    this.resize()
  }

  setMouth(scale: number) {
    this.mouth = scale
    this.resize()
  }

  setPosition(x: number, z: number) {
    this.group.position.x = x
    this.group.position.z = z
    if (this.surface) {
      this.surface.uHole.value.set(x, z)
      this.surface.uHoleR.value = this.radius * this.mouth
    }
  }

  setSuck(amount: number) {
    this.suck = Math.max(0, Math.min(1, amount))
  }

  setMagnet(on: boolean, time: number) {
    this.magnetMat.opacity = on ? 0.28 + Math.sin(time * 9) * 0.18 : 0
  }

  setAlpha(alpha: number) {
    this.group.visible = alpha > 0.2
  }

  dispose() {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        const material = obj.material
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
        else material.dispose()
      }
    })
    this.group.clear()
  }

  update(time: number, reduce: boolean) {
    const speed = reduce ? 0.4 : this.skin === 'mint' ? 1.3 : 2.1
    this.swirls.forEach((ring, i) => {
      ring.rotation.z = time * speed * (i % 2 === 0 ? 1 : -1) + i
    })
    const pulse = reduce ? 0.5 : Math.sin(time * 2.4) * 0.5 + 0.5
    this.glowMat.opacity = 0.22 + pulse * 0.14 + this.suck * 0.5
    this.glow.scale.setScalar(this.radius * (1.02 + pulse * 0.035 + this.suck * 0.09))
    this.rimMat.emissiveIntensity = 0.55 + pulse * 0.3 + this.suck * 0.85
    if (this.spark.visible) {
      const a = time * (this.skin === 'lava' ? -2.4 : 1.5)
      const rr = this.radius * 0.92
      this.spark.position.set(Math.cos(a) * rr, 0.08, Math.sin(a) * rr)
    }
  }

  private resize() {
    const r = this.radius
    const mouth = r * this.mouth
    this.rim.scale.setScalar(r)
    this.rim.position.y = r * 0.045
    this.lip.scale.setScalar(mouth)
    this.lip.position.y = 0.03
    this.pit.scale.set(mouth * 1.02, 1, mouth * 1.02)
    this.pit.position.y = -2.8
    this.floor.scale.setScalar(mouth)
    this.floor.position.y = -5.58
    this.magnet.scale.setScalar(r)
    this.magnet.position.y = 0.04
    this.glow.scale.setScalar(r)
    this.glow.position.y = 0.03
    this.sheen.scale.setScalar(r)
    this.sheen.position.y = r * 0.07
    this.swirls.forEach((ring, i) => {
      ring.scale.setScalar(mouth * (0.55 + i * 0.18))
    })
  }
}
