import { describe, expect, it } from "vitest"
import {
  getSupabaseConfigStatus,
  isSupabaseConfigured,
  supabase,
} from "./supabase"

describe("Supabase Integration Client", () => {
  it("provides graceful configuration diagnostic when credentials are unconfigured", () => {
    const status = getSupabaseConfigStatus()
    expect(typeof status.configured).toBe("boolean")
    expect(typeof status.missingUrl).toBe("boolean")
    expect(typeof status.missingKey).toBe("boolean")
    expect(typeof status.message).toBe("string")

    if (!isSupabaseConfigured) {
      expect(status.configured).toBe(false)
      expect(status.message).toContain("Supabase credentials are not configured")
    }
  })

  it("exports a valid SupabaseClient with required auth interface", () => {
    expect(supabase).toBeDefined()
    expect(typeof supabase.auth.signUp).toBe("function")
    expect(typeof supabase.auth.signInWithPassword).toBe("function")
    expect(typeof supabase.auth.signOut).toBe("function")
    expect(typeof supabase.auth.getSession).toBe("function")
    expect(typeof supabase.auth.resetPasswordForEmail).toBe("function")
    expect(typeof supabase.auth.updateUser).toBe("function")
    expect(typeof supabase.auth.resend).toBe("function")
  })

  it("resolves valid authentication redirect URLs for local dev and paths", async () => {
    const { getAuthRedirectUrl } = await import("./supabase")
    const url = getAuthRedirectUrl("/auth/callback")
    expect(typeof url).toBe("string")
    expect(url).toContain("/auth/callback")
    expect(url.startsWith("http")).toBe(true)

    const recoveryUrl = getAuthRedirectUrl("/auth/callback?type=recovery")
    expect(recoveryUrl).toContain("/auth/callback?type=recovery")
  })
})
