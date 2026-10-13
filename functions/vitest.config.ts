import { defineConfig } from 'vitest/config'

// 模擬器測試第一次呼叫 Cloud Functions 要冷啟動，時間放寬
export default defineConfig({
  test: { testTimeout: 60_000, hookTimeout: 60_000 },
})
