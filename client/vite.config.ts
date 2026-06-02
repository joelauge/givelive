import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@givelive/journey-validation': path.resolve(
        __dirname,
        '../server/src/lib/journeyValidation.ts'
      ),
    },
  },
})
