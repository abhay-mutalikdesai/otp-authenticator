import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    closeBundle() {
      copyFileSync('manifest.json', 'dist/manifest.json')
      const iconSizes = [16, 32, 48, 128]
      const iconsDir = 'dist/icons'
      if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true })
      iconSizes.forEach(size => {
        const src = `public/icons/icon-${size}.png`
        if (existsSync(src)) {
          copyFileSync(src, `${iconsDir}/icon-${size}.png`)
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), copyExtensionFiles()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    port: 3000,
  },
})
