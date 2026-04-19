import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'  // ← make sure this is here

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),  // ← and this
  ],
})