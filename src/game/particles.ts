import * as THREE from 'three'

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

const CRUMBS = 168
const SPARKS = 72

function makePool(count: number, spark: boolean): {
  bits: Bit[]
  geo: THREE.BufferGeometry
  points: THREE.Points
  pos: Float32Array
  col: Float32Array
  size: Float32Array
} {
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const size = new Float32Array(count)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: spark ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {},
    vertexShader: /* glsl */ `
      attribute vec3 aColor;
      attribute float aSize;
      varying vec3 vColor;
      void main() {
        vColor = aColor;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (260.0 / max(1.2, -mv.z));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: spark
      ? /* glsl */ `
        varying vec3 vColor;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p);
          float ang = atan(p.y, p.x);
          float r = 0.18 + 0.2 * abs(cos(ang * 2.0));
          float a = smoothstep(r, r * 0.45, d);
          if (a < 0.02) discard;
          gl_FragColor = vec4(vColor * a, 1.0);
        }
      `
      : /* glsl */ `
        varying vec3 vColor;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p);
          float a = smoothstep(0.5, 0.08, d);
          if (a < 0.02) discard;
          float core = smoothstep(0.22, 0.0, d);
          gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.65), a);
        }
      `,
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  points.renderOrder = spark ? 6 : 5
  const bits: Bit[] = []
  for (let i = 0; i < count; i++) {
    pos[i * 3 + 1] = -12
    bits.push({ x: 0, y: -8, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 0, r: 1, g: 1, b: 1 })
  }
  return { bits, geo, points, pos, col, size }
}

function spawn(bits: Bit[], x: number, y: number, z: number, color: THREE.Color, count: number, speed: number, up: number, size: number, life: number) {
  let left = count
  for (const bit of bits) {
    if (bit.life > 0) continue
    const ang = Math.random() * Math.PI * 2
    const vel = speed * (0.45 + Math.random() * 0.7)
    bit.life = bit.max = life * (0.75 + Math.random() * 0.5)
    bit.x = x
    bit.y = y
    bit.z = z
    bit.vx = Math.cos(ang) * vel
    bit.vz = Math.sin(ang) * vel
    bit.vy = up * (0.65 + Math.random() * 0.7)
    bit.size = size * (0.75 + Math.random() * 0.5)
    bit.r = color.r
    bit.g = color.g
    bit.b = color.b
    left -= 1
    if (left <= 0) break
  }
}

function step(pool: ReturnType<typeof makePool>, dt: number, gravity: number) {
  const { bits, pos, col, size } = pool
  for (let i = 0; i < bits.length; i++) {
    const bit = bits[i]
    const o = i * 3
    if (bit.life <= 0) {
      pos[o + 1] = -12
      size[i] = 0
      continue
    }
    bit.life -= dt
    bit.vy -= gravity * dt
    bit.x += bit.vx * dt
    bit.y += bit.vy * dt
    bit.z += bit.vz * dt
    bit.vx *= 1 - Math.min(1, dt * 1.4)
    bit.vz *= 1 - Math.min(1, dt * 1.4)
    const fade = Math.max(0, bit.life / bit.max)
    pos[o] = bit.x
    pos[o + 1] = bit.y
    pos[o + 2] = bit.z
    col[o] = bit.r * fade
    col[o + 1] = bit.g * fade
    col[o + 2] = bit.b * fade
    size[i] = bit.size * (0.45 + fade)
  }
  pool.geo.attributes.position.needsUpdate = true
  pool.geo.attributes.aColor.needsUpdate = true
  pool.geo.attributes.aSize.needsUpdate = true
}

export class Bursts {
  private crumbs: ReturnType<typeof makePool>
  private sparks: ReturnType<typeof makePool>
  private tint = new THREE.Color()

  constructor(parent: THREE.Object3D) {
    this.crumbs = makePool(CRUMBS, false)
    this.sparks = makePool(SPARKS, true)
    parent.add(this.crumbs.points, this.sparks.points)
  }

  burst(x: number, y: number, z: number, color: number, count: number, speed: number) {
    this.tint.setHex(color)
    spawn(this.crumbs.bits, x, y, z, this.tint, count, speed, 1.15, 14, 0.42)
  }

  sparkle(x: number, y: number, z: number, color: number, count: number) {
    this.tint.setHex(color)
    spawn(this.sparks.bits, x, y, z, this.tint, count, 1.4, 1.8, 11, 0.48)
  }

  /** Ring of crumbs blooming out of the mouth when something drops in. */
  lip(x: number, z: number, radius: number, color: number) {
    this.tint.setHex(color)
    const count = 10
    let left = count
    for (const bit of this.crumbs.bits) {
      if (bit.life > 0) continue
      const ang = (left / count) * Math.PI * 2
      const rr = radius * (0.72 + Math.random() * 0.2)
      bit.life = bit.max = 0.32 + Math.random() * 0.12
      bit.x = x + Math.cos(ang) * rr
      bit.y = 0.08
      bit.z = z + Math.sin(ang) * rr
      bit.vx = Math.cos(ang) * (1.2 + Math.random())
      bit.vz = Math.sin(ang) * (1.2 + Math.random())
      bit.vy = 1.4 + Math.random() * 1.1
      bit.size = 12
      bit.r = this.tint.r
      bit.g = this.tint.g
      bit.b = this.tint.b
      left -= 1
      if (left <= 0) break
    }
  }

  update(dt: number) {
    step(this.crumbs, dt, 7.5)
    step(this.sparks, dt, 1.6)
  }

  dispose() {
    for (const pool of [this.crumbs, this.sparks]) {
      pool.points.removeFromParent()
      pool.geo.dispose()
      const mat = pool.points.material
      if (mat instanceof THREE.Material) mat.dispose()
    }
  }
}

/** Soft blobs so snacks sit on the wood. One draw call for the whole table. */
export class ContactShadows {
  private mesh: THREE.InstancedMesh
  private dummy = new THREE.Object3D()

  constructor(parent: THREE.Object3D, count: number) {
    const geo = new THREE.CircleGeometry(1, 12)
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {},
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 transformed = (instanceMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          float d = length(vUv - 0.5) * 2.0;
          float a = smoothstep(1.0, 0.2, d) * 0.4;
          if (a < 0.02) discard;
          gl_FragColor = vec4(0.11, 0.05, 0.02, a);
        }
      `,
    })
    this.mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, count))
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 1
    parent.add(this.mesh)
    this.dummy.scale.setScalar(0)
    this.dummy.updateMatrix()
    for (let i = 0; i < this.mesh.count; i++) this.mesh.setMatrixAt(i, this.dummy.matrix)
  }

  place(index: number, x: number, z: number, radius: number) {
    this.dummy.position.set(x, 0.018, z)
    this.dummy.rotation.set(-Math.PI / 2, 0, 0)
    this.dummy.scale.setScalar(radius > 0 ? radius : 0)
    this.dummy.updateMatrix()
    this.mesh.setMatrixAt(index, this.dummy.matrix)
  }

  commit() {
    this.mesh.instanceMatrix.needsUpdate = true
  }

  dispose() {
    this.mesh.removeFromParent()
    this.mesh.geometry.dispose()
    const mat = this.mesh.material
    if (mat instanceof THREE.Material) mat.dispose()
  }
}

/** A handful of drifting specks. Cheap atmosphere, not a weather system. */
export class Motes {
  private points: THREE.Points
  private pos: Float32Array
  private phase: Float32Array
  private count: number

  constructor(parent: THREE.Object3D) {
    this.count = 26
    this.pos = new Float32Array(this.count * 3)
    this.phase = new Float32Array(this.count)
    for (let i = 0; i < this.count; i++) {
      this.phase[i] = Math.random() * Math.PI * 2
      this.pos[i * 3] = (Math.random() - 0.5) * 8
      this.pos[i * 3 + 1] = 0.4 + Math.random() * 2.4
      this.pos[i * 3 + 2] = (Math.random() - 0.5) * 8
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3))
    const mat = new THREE.PointsMaterial({
      color: 0xffe6c4,
      size: 0.045,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      sizeAttenuation: true,
    })
    this.points = new THREE.Points(geo, mat)
    this.points.frustumCulled = false
    this.points.renderOrder = 3
    parent.add(this.points)
  }

  follow(x: number, z: number, time: number, reduce: boolean) {
    this.points.visible = !reduce
    if (reduce) return
    for (let i = 0; i < this.count; i++) {
      const p = this.phase[i]
      const o = i * 3
      this.pos[o] = x + Math.sin(time * 0.17 + p) * (2.2 + (i % 5) * 0.45)
      this.pos[o + 1] = 0.55 + ((i * 0.37) % 2.2) + Math.sin(time * 0.6 + p) * 0.12
      this.pos[o + 2] = z + Math.cos(time * 0.13 + p * 1.3) * (1.8 + (i % 4) * 0.4)
    }
    const attr = this.points.geometry.getAttribute('position')
    attr.needsUpdate = true
  }

  dispose() {
    this.points.removeFromParent()
    this.points.geometry.dispose()
    const mat = this.points.material
    if (mat instanceof THREE.Material) mat.dispose()
  }
}
