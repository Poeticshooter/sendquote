import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

type RateLimitResult = { allowed: boolean; remaining: number; retryAfter?: number }

export async function rateLimit(
  ip: string,
  route: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (!supabaseUrl || !supabaseKey) {
    return rateLimitFallback(ip, route, max, windowMs)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const key = `${ip}:${route}`
  const windowSeconds = Math.floor(windowMs / 1000)

  try {
    const { data, error } = await supabase.rpc('upsert_rate_limit', {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    })

    if (error || !data) {
      return rateLimitFallback(ip, route, max, windowMs)
    }

    return {
      allowed: data.allowed,
      remaining: data.remaining,
      retryAfter: data.retryAfter,
    }
  } catch {
    return rateLimitFallback(ip, route, max, windowMs)
  }
}

const localStore = new Map<string, { count: number; firstSeen: number; windowMs: number }>()
const CLEANUP_INTERVAL_MS = 3600000

function rateLimitFallback(
  ip: string,
  route: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const key = `${ip}:${route}`
  const now = Date.now()
  const entry = localStore.get(key)

  if (!entry) {
    localStore.set(key, { count: 1, firstSeen: now, windowMs })
    scheduleCleanup()
    return { allowed: true, remaining: max - 1 }
  }

  if (now - entry.firstSeen > entry.windowMs) {
    localStore.set(key, { count: 1, firstSeen: now, windowMs })
    return { allowed: true, remaining: max - 1 }
  }

  if (entry.count >= max) {
    const retryAfter = Math.ceil((entry.firstSeen + entry.windowMs - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  entry.count++
  return { allowed: true, remaining: max - entry.count }
}

let cleanupScheduled = false

function scheduleCleanup() {
  if (cleanupScheduled) return
  cleanupScheduled = true
  setTimeout(() => {
    const now = Date.now()
    for (const [key, entry] of localStore.entries()) {
      if (now - entry.firstSeen > entry.windowMs) {
        localStore.delete(key)
      }
    }
    cleanupScheduled = false
  }, CLEANUP_INTERVAL_MS)
}

export function clearRateLimitStore() {
  localStore.clear()
  cleanupScheduled = false
}
