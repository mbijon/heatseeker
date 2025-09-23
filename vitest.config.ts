import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    // Run tests sequentially to avoid database conflicts
    sequence: {
      concurrent: false,
    },
    include: ['test/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
    coverage: {
      exclude: ['playwright.config.ts', 'vitest.config.ts', 'e2e/**', 'dist/**']
    }
  }
})
