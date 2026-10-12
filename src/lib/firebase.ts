import type { FirebaseApp, FirebaseOptions } from 'firebase/app'
import type { Settings } from './settings'

export type FirebaseBundle = {
  app: FirebaseApp
  options: FirebaseOptions
}

let bundlePromise: Promise<FirebaseBundle | null> | null = null
let lastKey = ''

/** Firebase Hosting serves the project's web config at this reserved path. */
async function hostingConfig(): Promise<FirebaseOptions | null> {
  try {
    const res = await fetch('/__/firebase/init.json', { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json && json.apiKey ? (json as FirebaseOptions) : null
  } catch {
    return null
  }
}

function parseConfig(text: string): FirebaseOptions | null {
  const t = text.trim()
  if (!t) return null
  try {
    // accept either pure JSON or the `const firebaseConfig = {...}` snippet from the console
    const start = t.indexOf('{')
    const end = t.lastIndexOf('}')
    const body = t.slice(start, end + 1)
    let obj: any
    try {
      obj = JSON.parse(body)
    } catch {
      const jsonish = body.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":').replace(/'/g, '"').replace(/,\s*}/g, '}')
      obj = JSON.parse(jsonish)
    }
    return obj && obj.apiKey ? (obj as FirebaseOptions) : null
  } catch {
    return null
  }
}

export function getFirebase(settings: Settings): Promise<FirebaseBundle | null> {
  const key = [settings.firebaseConfig, settings.appCheckMode, settings.appCheckDebugToken, settings.recaptchaSiteKey].join('|')
  if (bundlePromise && key === lastKey) return bundlePromise
  if (bundlePromise && key !== lastKey) {
    // settings changed after init: a reload applies them cleanly
    return bundlePromise
  }
  lastKey = key
  bundlePromise = (async () => {
    const options = parseConfig(settings.firebaseConfig) || (await hostingConfig())
    if (!options) return null
    const { initializeApp } = await import('firebase/app')
    const app = initializeApp(options)
    if (settings.appCheckMode !== 'none') {
      const { initializeAppCheck, ReCaptchaV3Provider, CustomProvider } = await import('firebase/app-check')
      if (settings.appCheckMode === 'debug') {
        ;(self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = settings.appCheckDebugToken.trim() || true
        initializeAppCheck(app, {
          provider: new CustomProvider({
            getToken: async () => {
              throw new Error('App Check debug mode only')
            },
          }),
          isTokenAutoRefreshEnabled: true,
        })
      } else if (settings.recaptchaSiteKey.trim()) {
        initializeAppCheck(app, { provider: new ReCaptchaV3Provider(settings.recaptchaSiteKey.trim()), isTokenAutoRefreshEnabled: true })
      }
    }
    return { app, options }
  })().catch((e) => {
    console.warn('[firebase] init failed', e)
    return null
  })
  return bundlePromise
}

export async function ensureUser(settings: Settings): Promise<{ uid: string } | null> {
  const fb = await getFirebase(settings)
  if (!fb) return null
  try {
    const { getAuth, signInAnonymously, onAuthStateChanged } = await import('firebase/auth')
    const auth = getAuth(fb.app)
    if (auth.currentUser) return { uid: auth.currentUser.uid }
    const existing = await new Promise<string | null>((resolve) => {
      const off = onAuthStateChanged(auth, (u) => {
        off()
        resolve(u ? u.uid : null)
      })
    })
    if (existing) return { uid: existing }
    const cred = await signInAnonymously(auth)
    return { uid: cred.user.uid }
  } catch (e) {
    console.warn('[firebase] anonymous sign-in failed', e)
    return null
  }
}
