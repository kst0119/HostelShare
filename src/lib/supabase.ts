import { createClient, SupabaseClient } from "@supabase/supabase-js"

/**
 * HostelShare - Supabase Auth Integration Client
 *
 * Reads configuration from VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
 * Falls back to VITE_SUPABASE_ANON_KEY if standard publishable key alias is supplied.
 * Never exposes service-role keys or logs sensitive authentication data.
 */

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim()
const rawKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ""
).trim()

const isPlaceholderUrl =
  !rawUrl ||
  rawUrl === "https://your-project-ref.supabase.co" ||
  rawUrl.includes("your-project-ref")

const isPlaceholderKey =
  !rawKey ||
  rawKey === "your-supabase-anon-or-publishable-key" ||
  rawKey.includes("placeholder")

/**
 * Indicates whether a valid external Supabase URL and Publishable Key are configured.
 */
export const isSupabaseConfigured: boolean = !isPlaceholderUrl && !isPlaceholderKey

export const SUPABASE_URL: string = isSupabaseConfigured
  ? rawUrl
  : "https://placeholder-hostelshare.supabase.co"

export const SUPABASE_PUBLISHABLE_KEY: string = isSupabaseConfigured
  ? rawKey
  : "placeholder-anon-key-hostelshare-unconfigured"

/**
 * Clear user-facing diagnostic for missing credentials.
 */
export function getSupabaseConfigStatus(): {
  configured: boolean
  missingUrl: boolean
  missingKey: boolean
  message: string
} {
  const missingUrl = isPlaceholderUrl
  const missingKey = isPlaceholderKey
  const configured = !missingUrl && !missingKey

  let message = "Supabase Auth is configured and operational."
  if (!configured) {
    if (missingUrl && missingKey) {
      message =
        "Supabase credentials are not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local to enable real authentication."
    } else if (missingUrl) {
      message =
        "VITE_SUPABASE_URL is missing or placeholder in .env.local. Please configure your project URL."
    } else {
      message =
        "VITE_SUPABASE_PUBLISHABLE_KEY is missing or placeholder in .env.local. Please configure your anon/publishable key."
    }
  }

  return { configured, missingUrl, missingKey, message }
}

/**
 * Singleton Supabase Client instance.
 * Uses official session-management, token refresh, and URL detection.
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
)
