// Regenerates the install QR code shown at the top of the README.
// Run with: npm run qr
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import QRCode from 'qrcode'

const APP_URL = process.env.APP_URL ?? 'https://seventyfive75.web.app'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'docs')
const outFile = join(outDir, 'install-qr.svg')

// Dark modules on a light field. Do NOT invert this to match the app's dark
// palette: the QR spec assumes dark-on-light and many camera apps simply refuse
// to read an inverted code. The deep blue keeps it on-brand while holding a very
// high contrast ratio. `margin` is the quiet zone in modules - scanners need at
// least 4 to lock on.
const svg = await QRCode.toString(APP_URL, {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 4,
  color: { dark: '#0c4a60', light: '#ffffff' },
})

await mkdir(outDir, { recursive: true })
await writeFile(outFile, svg, 'utf8')
console.log(`generated docs/install-qr.svg -> ${APP_URL}`)
