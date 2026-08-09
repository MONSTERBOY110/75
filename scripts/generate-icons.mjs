// Rasterizes the brand SVGs into the PNG icons referenced by the PWA manifest.
// Run with: npm run icons   (requires `sharp`)
import { readFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'icons')

const icon = await readFile(join(root, 'public', 'favicon.svg'))
const maskable = await readFile(join(root, 'public', 'maskable.svg'))

const targets = [
  { src: icon, size: 192, name: 'icon-192.png' },
  { src: icon, size: 512, name: 'icon-512.png' },
  { src: icon, size: 180, name: 'apple-touch-icon.png' },
  { src: maskable, size: 512, name: 'maskable-512.png' },
]

await mkdir(outDir, { recursive: true })
for (const { src, size, name } of targets) {
  await sharp(src, { density: 384 }).resize(size, size).png().toFile(join(outDir, name))
  console.log(`generated icons/${name} (${size}x${size})`)
}
