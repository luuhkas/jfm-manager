import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // caminhos relativos: obrigatório p/ Electron carregar via file://
  base: './',
  plugins: [react()],
})
