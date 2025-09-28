import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Options (if needed):
      // - include: ['crypto', 'buffer'], // Specific modules to polyfill
      // - globals: { Buffer: true, global: true, process: true }, // Whether to polyfill global variables
      // - protocolImports: true, // If you use 'node:' imports
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'src/manifest.json',
          dest: ''
        }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        content: resolve(__dirname, 'src/content.ts')
      },
      output: {
        entryFileNames: (chunk) => {
          return chunk.name === 'content' ? 'content.js' : '[name].[hash].js'
        }
      }
    }
  },
  publicDir: 'public',
})
