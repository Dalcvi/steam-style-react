import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Test config is kept separate from `vite.config.ts` because that file is the
 * library build: it marks stylesheets external and copies them into `dist`,
 * neither of which applies when running tests in jsdom.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Component stylesheets are not needed to assert behaviour, and loading
    // them in jsdom only slows the suite down.
    css: false,
    restoreMocks: true,
    unstubGlobals: true,
  },
})
