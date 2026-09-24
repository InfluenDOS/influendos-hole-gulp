import * as THREE from 'three'
import { KIND_COLOR, type Kind } from './kinds'

export type PropTemplate = { geo: THREE.BufferGeometry; mat: THREE.MeshStandardMaterial }

const templates = new Map<Kind, PropTemplate>()

function hex(n: number): THREE.Color {
  return new THREE.Color(n)
}

function mix(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return a.clone().lerp(b, t)
}

function matFor(kind: Kind, emissive = 0x000000): THREE.MeshStandardMaterial {
  const shiny = kind === 'coin' || kind === 'gem' || kind === 'ice'
  return new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: shiny ? 0.28 : 0.46,
    metalness: kind === 'coin' ? 0.55 : kind === 'gem' ? 0.35 : 0.04,
    emissive,
    emissiveIntensity: kind === 'bomb' ? 0.95 : kind === 'gem' ? 0.55 : kind === 'coin' ? 0.42 : kind === 'star' ? 0.34 : emissive ? 0.28 : 0,
    flatShading: true,
  })
}

function compose(x: number, y: number, z: number, sx: number, sy: number, sz: number, rx = 0, ry = 0, rz = 0): THREE.Matrix4 {
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz))
  m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz))
  return m
}

function merge(parts: { geo: THREE.BufferGeometry; matrix: THREE.Matrix4; color: THREE.Color }[]): THREE.BufferGeometry {
  const chunks = parts.map((part) => (part.geo.index ? part.geo.toNonIndexed() : part.geo))
  let count = 0
  for (const chunk of chunks) count += chunk.getAttribute('position').count
  const pos = new Float32Array(count * 3)
  const nor = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const v = new THREE.Vector3()
  const n = new THREE.Vector3()
  const nm = new THREE.Matrix3()
  let offset = 0
  parts.forEach((part, index) => {
    const chunk = chunks[index]
    const pa = chunk.getAttribute('position')
    const na = chunk.getAttribute('normal')
    nm.getNormalMatrix(part.matrix)
    for (let i = 0; i < pa.count; i++) {
      v.fromBufferAttribute(pa, i).applyMatrix4(part.matrix)
      const o = (offset + i) * 3
      pos[o] = v.x
      pos[o + 1] = v.y
      pos[o + 2] = v.z
      if (na) n.fromBufferAttribute(na, i).applyMatrix3(nm).normalize()
      else n.set(0, 1, 0)
      nor[o] = n.x
      nor[o + 1] = n.y
      nor[o + 2] = n.z
      col[o] = part.color.r
      col[o + 1] = part.color.g
      col[o + 2] = part.color.b
    }
    offset += pa.count
    if (part.geo.index) chunk.dispose()
  })
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  out.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return out
}

function normalize(g: THREE.BufferGeometry): THREE.BufferGeometry {
  g.computeBoundingSphere()
  const radius = g.boundingSphere?.radius || 1
  g.translate(0, 0, 0)
  const center = g.boundingSphere?.center.clone() ?? new THREE.Vector3()
  g.translate(-center.x, -center.y, -center.z)
  g.scale(1 / radius, 1 / radius, 1 / radius)
  g.computeBoundingSphere()
  return g
}

function speckle(g: THREE.BufferGeometry, color: THREE.Color, chance: number, seed: number) {
  const attr = g.getAttribute('color')
  const pos = g.getAttribute('position')
  let s = seed
  const rnd = () => {
    s = (s * 16807 + 11) % 2147483647
    return (s & 2147483647) / 2147483647
  }
  for (let i = 0; i < pos.count; i++) {
    if (rnd() > chance) continue
    attr.setXYZ(i, color.r, color.g, color.b)
  }
  attr.needsUpdate = true
}

const sphere = new THREE.SphereGeometry(1, 10, 8)
const ico = new THREE.IcosahedronGeometry(1, 0)
const box = new THREE.BoxGeometry(1, 1, 1)
const cyl = new THREE.CylinderGeometry(1, 1, 1, 10)
const cone = new THREE.ConeGeometry(1, 1, 8)
const torus = new THREE.TorusGeometry(0.62, 0.28, 8, 14)

function starGeo(): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  const points = 5
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? 1 : 0.46
    const a = -Math.PI / 2 + (i * Math.PI) / points
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.38,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 1,
  })
}

const star = starGeo()

function build(kind: Kind): THREE.BufferGeometry {
  const base = hex(KIND_COLOR[kind])
  const hi = mix(base, hex(0xffffff), 0.45)
  const lo = mix(base, hex(0x000000), 0.28)
  const leaf = hex(0x2f9a45)
  const cream = hex(0xfff6ea)
  let g: THREE.BufferGeometry
  switch (kind) {
    case 'berry':
      g = merge([
        { geo: ico, matrix: compose(0, 0, 0, 1, 0.92, 1), color: base },
        { geo: cone, matrix: compose(0, 0.82, 0, 0.28, 0.42, 0.28), color: leaf },
        { geo: sphere, matrix: compose(-0.28, 0.62, 0.12, 0.22, 0.12, 0.16, 0.4, 0, -0.6), color: leaf },
      ])
      speckle(g, hex(0xffe08a), 0.18, 3)
      break
    case 'orange':
      g = merge([
        { geo: ico, matrix: compose(0, 0, 0, 1, 0.96, 1), color: base },
        { geo: sphere, matrix: compose(0, 0.78, 0, 0.16, 0.16, 0.16), color: leaf },
        { geo: sphere, matrix: compose(0.22, 0.7, 0.05, 0.2, 0.1, 0.14, 0.2, 0, 0.8), color: leaf },
      ])
      break
    case 'grape':
      g = merge([
        { geo: sphere, matrix: compose(0, -0.15, 0, 0.42, 0.42, 0.42), color: base },
        { geo: sphere, matrix: compose(-0.36, 0.05, 0.05, 0.38, 0.38, 0.38), color: lo },
        { geo: sphere, matrix: compose(0.36, 0.05, 0.02, 0.38, 0.38, 0.38), color: hi },
        { geo: sphere, matrix: compose(-0.18, 0.38, 0, 0.34, 0.34, 0.34), color: base },
        { geo: sphere, matrix: compose(0.18, 0.4, -0.04, 0.34, 0.34, 0.34), color: lo },
        { geo: sphere, matrix: compose(0, 0.7, 0, 0.28, 0.28, 0.28), color: hi },
        { geo: sphere, matrix: compose(0.28, 0.78, 0, 0.16, 0.1, 0.12, 0, 0, 0.7), color: leaf },
      ])
      break
    case 'apple':
      g = merge([
        { geo: ico, matrix: compose(0, -0.05, 0, 1, 0.9, 1), color: base },
        { geo: cyl, matrix: compose(0, 0.78, 0, 0.08, 0.36, 0.08, 0.2, 0, 0), color: hex(0x6b3a22) },
        { geo: sphere, matrix: compose(0.24, 0.72, 0, 0.22, 0.1, 0.14, 0, 0, 0.8), color: leaf },
      ])
      break
    case 'cookie':
      g = merge([{ geo: cyl, matrix: compose(0, 0, 0, 1, 0.38, 1), color: base }])
      speckle(g, hex(0x6b3a22), 0.16, 9)
      break
    case 'candy':
      g = merge([
        { geo: box, matrix: compose(0, 0, 0, 1.15, 0.62, 0.72), color: base },
        { geo: box, matrix: compose(0, 0, 0, 0.46, 0.66, 0.76), color: cream },
        { geo: cone, matrix: compose(-0.85, 0, 0, 0.28, 0.42, 0.28, 0, 0, Math.PI / 2), color: hi },
        { geo: cone, matrix: compose(0.85, 0, 0, 0.28, 0.42, 0.28, 0, 0, -Math.PI / 2), color: hi },
      ])
      break
    case 'donut':
      g = merge([{ geo: torus, matrix: compose(0, 0, 0, 1, 1, 1, Math.PI / 2, 0, 0), color: base }])
      speckle(g, cream, 0.12, 4)
      speckle(g, hex(0xffd24a), 0.08, 6)
      speckle(g, hex(0x5ad0ff), 0.06, 8)
      break
    case 'gem':
      g = merge([{ geo: new THREE.OctahedronGeometry(1, 0), matrix: compose(0, 0, 0, 0.8, 1.15, 0.8), color: base }])
      speckle(g, hi, 0.22, 2)
      break
    case 'coin':
      g = merge([
        { geo: cyl, matrix: compose(0, 0, 0, 1, 0.22, 1), color: base },
        { geo: cyl, matrix: compose(0, 0, 0, 0.62, 0.26, 0.62), color: hi },
      ])
      break
    case 'ball':
      g = merge([{ geo: sphere, matrix: compose(0, 0, 0, 1, 1, 1), color: base }])
      speckle(g, cream, 0.2, 5)
      speckle(g, hex(0xff4d4d), 0.12, 7)
      speckle(g, hex(0xffd24a), 0.1, 11)
      break
    case 'star':
      g = merge([{ geo: star, matrix: compose(0, 0, 0, 1, 1, 1, Math.PI / 2, 0, 0), color: base }])
      break
    case 'cupcake':
      g = merge([
        { geo: cyl, matrix: compose(0, -0.28, 0, 0.72, 0.7, 0.72), color: base },
        { geo: sphere, matrix: compose(0, 0.28, 0, 0.78, 0.55, 0.78), color: cream },
        { geo: sphere, matrix: compose(0, 0.62, 0, 0.22, 0.22, 0.22), color: hex(0xe23b4a) },
      ])
      break
    case 'ice':
      g = merge([{ geo: box, matrix: compose(0, 0, 0, 0.9, 1.05, 0.9), color: base }])
      speckle(g, cream, 0.2, 12)
      break
    case 'melon':
      g = merge([
        { geo: sphere, matrix: compose(0, -0.15, 0, 1, 1, 1), color: hex(0x3eae5a) },
        { geo: sphere, matrix: compose(0, 0.08, 0.15, 0.82, 0.72, 0.55), color: base },
      ])
      speckle(g, hex(0x3b2418), 0.08, 15)
      break
    case 'cheese':
      g = merge([{ geo: cone, matrix: compose(0, 0, 0, 1, 0.85, 1), color: base }])
      speckle(g, cream, 0.1, 14)
      break
    case 'bomb':
      g = merge([
        { geo: sphere, matrix: compose(0, -0.05, 0, 1, 1, 1), color: base },
        { geo: cyl, matrix: compose(0.28, 0.62, 0, 0.08, 0.4, 0.08, 0, 0, -0.5), color: hex(0x6b4a32) },
        { geo: sphere, matrix: compose(0.42, 0.88, 0, 0.18, 0.18, 0.18), color: hex(0xffd24a) },
      ])
      break
    case 'chili':
      g = merge([
        { geo: sphere, matrix: compose(0, 0, 0, 0.42, 1.15, 0.42, 0, 0, 0.5), color: base },
        { geo: sphere, matrix: compose(-0.15, 0.85, 0, 0.28, 0.16, 0.16, 0, 0, 0.8), color: leaf },
      ])
      break
    case 'cactus':
      g = merge([
        { geo: cyl, matrix: compose(0, 0, 0, 0.38, 1.3, 0.38), color: base },
        { geo: cyl, matrix: compose(-0.42, 0.15, 0, 0.22, 0.55, 0.22, 0, 0, Math.PI / 2), color: hi },
        { geo: cyl, matrix: compose(0.42, -0.05, 0, 0.22, 0.5, 0.22, 0, 0, Math.PI / 2), color: lo },
        { geo: sphere, matrix: compose(0.62, 0.18, 0, 0.16, 0.16, 0.16), color: hex(0xff6b9a) },
      ])
      break
    default:
      g = merge([{ geo: sphere, matrix: compose(0, 0, 0, 1, 1, 1), color: base }])
  }
  return normalize(g)
}

export function propTemplate(kind: Kind): PropTemplate {
  const found = templates.get(kind)
  if (found) return found
  const emissive = kind === 'gem' ? 0x0c4a58 : kind === 'coin' ? 0x6a4810 : kind === 'bomb' ? 0x6a1818 : kind === 'star' ? 0x6a5010 : 0x000000
  const template = { geo: build(kind), mat: matFor(kind, emissive) }
  templates.set(kind, template)
  return template
}
