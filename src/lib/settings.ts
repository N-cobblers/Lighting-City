export type AppCheckMode = 'none' | 'debug' | 'recaptcha'
export type WeatherMode = 'live' | 'rain'

export type Settings = {
  firebaseConfig: string
  appCheckMode: AppCheckMode
  appCheckDebugToken: string
  recaptchaSiteKey: string
  model: string
  cwaKey: string
  weatherMode: WeatherMode
  luckyOverride: string
  room: string
  nickname: string
  demoPersonaId: string
  forceDemo: boolean
  allowRepeat: boolean
}

export const DEFAULT_MODEL = 'gemini-3.1-flash-lite'

export const defaultSettings: Settings = {
  firebaseConfig: '',
  appCheckMode: 'debug',
  appCheckDebugToken: '',
  recaptchaSiteKey: '',
  model: DEFAULT_MODEL,
  cwaKey: '',
  weatherMode: 'rain',
  luckyOverride: '',
  room: 'demo',
  nickname: '',
  demoPersonaId: 'xiao-han',
  forceDemo: false,
  allowRepeat: false,
}

const KEY = 'yoxi-lighting-city:settings:v1'

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...defaultSettings }
    return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    return { ...defaultSettings }
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* storage unavailable: keep settings in memory only */
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}
