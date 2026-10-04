import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outRoot = path.join(root, 'dist-portals')
const portals = ['crazygames', 'gamedistribution', 'gamemonetize', 'none']

const tsc = spawnSync('npx', ['tsc', '--noEmit'], { cwd: root, stdio: 'inherit' })
if (tsc.status !== 0) process.exit(tsc.status ?? 1)

await rm(outRoot, { recursive: true, force: true })
await mkdir(outRoot, { recursive: true })

for (const portal of portals) {
  const outDir = path.join(outRoot, portal)
  const env = { ...process.env, VITE_PORTAL: portal }
  const build = spawnSync('npx', ['vite', 'build', '--outDir', outDir, '--emptyOutDir'], {
    cwd: root,
    stdio: 'inherit',
    env,
  })
  if (build.status !== 0) process.exit(build.status ?? 1)
  const bundle = readdirSync(path.join(outDir, 'assets')).find((name) => name.endsWith('.js'))
  const source = readFileSync(path.join(outDir, 'assets', bundle), 'utf8')
  const returns = portals.filter((id) => source.includes(`return"${id}"`))
  if (returns.length !== 1 || returns[0] !== portal) {
    console.error(`Expected bundle to select "${portal}" in ${bundle}, found ${returns.join(', ') || 'nothing'}`)
    process.exit(1)
  }
  const zip = path.join(outRoot, `${portal}.zip`)
  const packed = spawnSync(
    'python3',
    [
      '-c',
      `
import os, zipfile
src = ${JSON.stringify(outDir)}
dest = ${JSON.stringify(zip)}
with zipfile.ZipFile(dest, "w", compression=zipfile.ZIP_DEFLATED) as zf:
    for dirpath, _, files in os.walk(src):
        for name in files:
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, src).replace(os.sep, "/")
            zf.write(full, rel)
print(dest)
`,
    ],
    { cwd: root, stdio: 'inherit' },
  )
  if (packed.status !== 0) process.exit(packed.status ?? 1)
}
