import * as THREE from 'three'
import { HoleView } from './holeView'
import { propTemplate } from './props'
import { loadSave } from './save'
import { createTableMaterial } from './tableMat'
import type { Kind } from './kinds'

const MENU_KINDS: Kind[] = ['berry', 'orange', 'cookie', 'candy', 'donut', 'gem', 'coin', 'star', 'cupcake', 'apple', 'grape', 'melon']

type Bit = {
  mesh: THREE.Mesh
  ang: number
  rad: number
  y: number
  falling: number
  spin: number
}

export class Stage {
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  readonly renderer: THREE.WebGLRenderer
  readonly reduce: boolean
  private menu = new THREE.Group()
  private bits: Bit[] = []
  private menuHole: HoleView
  private menuMat: ReturnType<typeof createTableMaterial>
  private clock = 0
  private look = new THREE.Vector3()
  private camPos = new THREE.Vector3()
  private raycaster = new THREE.Raycaster()
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private hit = new THREE.Vector3()
  private projected = new THREE.Vector3()
  shakeAmp = 0
  private playing = false

  constructor(frame: HTMLElement) {
    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.camera = new THREE.PerspectiveCamera(46, 9 / 16, 0.08, 80)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0x140e0c, 1)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    this.renderer.domElement.id = 'view'
    frame.appendChild(this.renderer.domElement)
    this.scene.background = new THREE.Color(0x140e0c)
    const hemi = new THREE.HemisphereLight(0xfff4e6, 0x3a2418, 0.95)
    const sun = new THREE.DirectionalLight(0xfff7ee, 1.25)
    sun.position.set(-6, 14, 8)
    const fill = new THREE.DirectionalLight(0xffc49a, 0.38)
    fill.position.set(7, 6, -5)
    this.scene.add(hemi, sun, fill)
    this.menuMat = createTableMaterial()
    this.menuHole = new HoleView()
    this.menuHole.bindSurface(this.menuMat.uniforms)
    this.menuHole.setSkin(loadSave().skin)
    this.menuHole.setRadius(0.95)
    this.menuHole.setMouth(0.78)
    this.buildMenu()
    this.scene.add(this.menu)
    this.resize()
  }

  resize() {
    const canvas = this.renderer.domElement
    const parent = canvas.parentElement
    if (!parent) return
    const w = parent.clientWidth
    const h = parent.clientHeight
    if (w < 2 || h < 2) return
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
  }

  setPlaying(playing: boolean) {
    this.playing = playing
    this.menu.visible = !playing
  }

  add(obj: THREE.Object3D) {
    this.scene.add(obj)
  }

  remove(obj: THREE.Object3D) {
    this.scene.remove(obj)
  }

  groundPoint(clientX: number, clientY: number): { x: number; z: number } | null {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera)
    if (!this.raycaster.ray.intersectPlane(this.plane, this.hit)) return null
    return { x: this.hit.x, z: this.hit.z }
  }

  /**
   * Screen pixels per world unit on the ground at (x, z).
   * Sampled with the camera that is actually drawing, so a finger move can
   * be converted where the hole is instead of along a slanted ground ray.
   */
  groundScale(x: number, z: number): { pxPerX: number; pxPerZ: number } | null {
    const eps = 0.5
    const origin = this.project(x, 0, z)
    const axisX = this.project(x + eps, 0, z)
    const axisZ = this.project(x, 0, z + eps)
    if (!origin || !axisX || !axisZ) return null
    const pxPerX = (axisX.x - origin.x) / eps
    const pxPerZ = (axisZ.y - origin.y) / eps
    if (!Number.isFinite(pxPerX) || !Number.isFinite(pxPerZ)) return null
    if (Math.abs(pxPerX) < 2 || Math.abs(pxPerZ) < 2) return null
    return { pxPerX, pxPerZ }
  }

  project(x: number, y: number, z: number): { x: number; y: number } | null {
    this.projected.set(x, y, z).project(this.camera)
    if (this.projected.z > 1) return null
    const w = this.renderer.domElement.clientWidth
    const h = this.renderer.domElement.clientHeight
    return {
      x: (this.projected.x * 0.5 + 0.5) * w,
      y: (-this.projected.y * 0.5 + 0.5) * h,
    }
  }

  updateMenu(dt: number) {
    if (this.playing) return
    this.clock += dt
    const skin = loadSave().skin
    this.menuHole.setSkin(skin)
    this.menuHole.setPosition(0, 0)
    this.menuHole.update(this.clock, this.reduce)
    const next = this.bits.find((bit) => bit.falling < 0 && bit.rad < 1.35)
    if (next && Math.floor(this.clock * 6) !== Math.floor((this.clock - dt) * 6)) {
      next.falling = 0.0001
    }
    for (const bit of this.bits) {
      if (bit.falling < 0) {
        bit.ang += dt * (this.reduce ? 0.15 : 0.45)
        bit.mesh.position.set(Math.cos(bit.ang) * bit.rad, bit.y, Math.sin(bit.ang) * bit.rad * 0.82)
        bit.mesh.rotation.y += dt
        bit.mesh.visible = true
        bit.mesh.scale.setScalar(bit.y)
      } else {
        bit.falling += dt
        const k = Math.min(1, bit.falling / 0.55)
        bit.mesh.position.x += (0 - bit.mesh.position.x) * Math.min(1, dt * 6)
        bit.mesh.position.z += (0 - bit.mesh.position.z) * Math.min(1, dt * 6)
        bit.mesh.position.y = bit.y * (1 - k) - k * 1.4
        bit.mesh.rotation.x += dt * bit.spin
        bit.mesh.rotation.z += dt * bit.spin * 0.7
        bit.mesh.scale.setScalar(bit.y * (1 - k * 0.75))
        if (bit.falling > 0.58) {
          bit.falling = -1
          bit.ang = Math.random() * Math.PI * 2
          bit.rad = 1.5 + Math.random() * 1.55
          bit.mesh.rotation.set(Math.random(), Math.random(), Math.random())
        }
      }
    }
    const ang = this.clock * (this.reduce ? 0.05 : 0.18)
    this.camera.position.set(Math.sin(ang) * 1.6, 3.7, 5.4 + Math.cos(ang) * 0.4)
    this.camera.lookAt(0, -0.55, 0)
  }

  snap(focus: { x: number; z: number; holeWorld: number; tableW: number; tableD: number }) {
    this.look.set(focus.x, 0, focus.z)
    this.follow(focus, 8)
  }

  follow(focus: { x: number; z: number; holeWorld: number; tableW: number; tableD: number }, dt: number) {
    const back = 7.6 + focus.holeWorld * 0.55
    const height = 5.6 + focus.holeWorld * 0.42
    this.look.x += (focus.x - this.look.x) * (1 - Math.exp(-5 * dt))
    this.look.z += (focus.z - this.look.z) * (1 - Math.exp(-5 * dt))
    const shake = this.shakeAmp * Math.sin(this.clock * 40)
    this.camPos.set(this.look.x + shake, height, this.look.z + back)
    this.camera.position.lerp(this.camPos, 1 - Math.exp(-6 * dt))
    this.camera.lookAt(this.look.x, -0.85, this.look.z)
    this.shakeAmp *= Math.exp(-7 * dt)
    this.clock += dt
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  private buildMenu() {
    const top = new THREE.Mesh(new THREE.CircleGeometry(3.35, 40), this.menuMat)
    top.rotation.x = -Math.PI / 2
    const sideMat = new THREE.MeshStandardMaterial({ color: 0xb8743a, roughness: 0.68, flatShading: true })
    const side = new THREE.Mesh(new THREE.CylinderGeometry(3.35, 3.15, 0.42, 32, 1, true), sideMat)
    side.position.y = -0.22
    const room = new THREE.Mesh(
      new THREE.CircleGeometry(8, 32),
      new THREE.MeshStandardMaterial({ color: 0x1a100c, roughness: 1 }),
    )
    room.rotation.x = -Math.PI / 2
    room.position.y = -6.2
    this.menu.add(room, side, top, this.menuHole.group)
    MENU_KINDS.forEach((kind, index) => {
      for (let n = 0; n < 3; n++) {
        const template = propTemplate(kind)
        const mesh = new THREE.Mesh(template.geo, template.mat)
        const size = 0.28 + (index % 3) * 0.06
        const bit: Bit = {
          mesh,
          ang: (index / MENU_KINDS.length) * Math.PI * 2 + n,
          rad: 1.45 + ((index + n) % 5) * 0.28,
          y: size,
          falling: -1,
          spin: n % 2 === 0 ? 4 : -4,
        }
        mesh.scale.setScalar(size)
        this.bits.push(bit)
        this.menu.add(mesh)
      }
    })
  }
}
