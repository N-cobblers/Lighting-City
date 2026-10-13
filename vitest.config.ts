import { defineConfig } from 'vitest/config'

// App 的單元測試只跑 src；functions/ 有自己的測試（見 functions/package.json），scripts/ 是 Python 的 e2e。
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['functions/**', 'scripts/**', 'node_modules/**', 'dist/**'],
    environment: 'node',
  },
})
