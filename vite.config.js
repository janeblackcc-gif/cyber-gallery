import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ⚠️ 这一行非常重要，对应你将在 GitHub 建立的仓库名
  base: '/cyber-gallery/', 
})