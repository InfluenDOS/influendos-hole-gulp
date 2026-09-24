import * as THREE from 'three'

export type TableUniforms = {
  uHole: { value: THREE.Vector2 }
  uHoleR: { value: number }
  uColor: { value: THREE.Color }
  uDark: { value: THREE.Color }
  uLight: { value: THREE.Vector3 }
}

export function createTableMaterial(): THREE.ShaderMaterial & { uniforms: TableUniforms } {
  const uniforms: TableUniforms = {
    uHole: { value: new THREE.Vector2(999, 999) },
    uHoleR: { value: 0.01 },
    uColor: { value: new THREE.Color(0xf3d2a8) },
    uDark: { value: new THREE.Color(0xd7b188) },
    uLight: { value: new THREE.Vector3(-0.32, 0.88, 0.34).normalize() },
  }
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vNormal;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vNormal;
      uniform vec2 uHole;
      uniform float uHoleR;
      uniform vec3 uColor;
      uniform vec3 uDark;
      uniform vec3 uLight;
      void main() {
        float d = distance(vWorld.xz, uHole);
        if (d < uHoleR) discard;
        float ndl = clamp(dot(normalize(vNormal), uLight), 0.0, 1.0);
        float seam = smoothstep(0.07, 0.0, abs(fract(vWorld.x * 0.62) - 0.5) - 0.4);
        float grain = 0.94 + 0.06 * sin(vWorld.x * 16.0 + vWorld.z * 2.4);
        float plank = mix(0.94, 1.0, seam);
        vec3 col = mix(uDark, uColor, 0.45 + 0.55 * ndl) * grain * plank;
        float lip = smoothstep(uHoleR, uHoleR + 0.14, d);
        col = mix(vec3(0.07, 0.045, 0.03), col, lip);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
  material.toneMapped = true
  return material as THREE.ShaderMaterial & { uniforms: TableUniforms }
}
