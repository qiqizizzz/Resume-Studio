import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 项目站点需要以仓库名作为静态资源前缀，本地开发仍使用根路径
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/').pop()

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS && repositoryName ? `/${repositoryName}/` : '/',
  plugins: [react()],
})
