/**
 * Generates PNG icons for the Chrome extension from the favicon SVG.
 * Run with: node generate-icons.mjs
 * Requires: @resvg/resvg-js  (npm install -D @resvg/resvg-js)
 */
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const svg = readFileSync(join(process.cwd(), 'public/favicon.svg'), 'utf8')
const sizes = [16, 32, 48, 128]
const dir = join(process.cwd(), 'public/icons')
mkdirSync(dir, { recursive: true })

for (const size of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  })
  const png = resvg.render()
  const data = png.asPng()
  writeFileSync(join(dir, `icon-${size}.png`), data)
  console.log(`✓ icon-${size}.png`)
}
console.log('Icons generated in public/icons/')
