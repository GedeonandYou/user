import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/onboarding/',
  build: {
    outDir: '../onboarding_dist',
    emptyOutDir: true,
  },
})
