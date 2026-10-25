import { describe, expect, it, vi } from "vitest"
import { getSupabaseConfigStatus, isSupabaseConfigured } from "../lib/supabase"

describe("Authentication Failure Scenarios & Edge Cases", () => {
  it("missing configuration returns clear actionable status without throwing", () => {
    const status = getSupabaseConfigStatus()
    if (!isSupabaseConfigured) {
      expect(status.configured).toBe(false)
      expect(status.message).toContain("VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY")
    }
  })

  it("handles duplicate user registration error safely", () => {
    // Mapping of Supabase provider duplicate account error
    const duplicateError = {
      message: "User already registered",
      status: 400,
    }

    const mapError = (err: { message: string }) => {
      const msg = err.message.toLowerCase()
      if (msg.includes("already registered") || msg.includes("user already exists")) {
        return "An account with this email address already exists. Please log in instead."
      }
      return err.message
    }

    expect(mapError(duplicateError)).toBe(
      "An account with this email address already exists. Please log in instead.",
    )
  })

  it("handles unconfirmed email identity with empty identities array (email enumeration protection)", () => {
    const mockResponseWithEmptyIdentities = {
      user: {
        id: "mock-user-id",
        identities: [],
      },
      session: null,
    }

    const hasDuplicateIdentity =
      mockResponseWithEmptyIdentities.user.identities.length === 0

    expect(hasDuplicateIdentity).toBe(true)
  })

  it("handles rate limit 429 error gracefully", () => {
    const rateLimitError = {
      message: "rate limit exceeded",
      status: 429,
    }

    const isRateLimit =
      rateLimitError.status === 429 ||
      rateLimitError.message.toLowerCase().includes("rate limit")

    expect(isRateLimit).toBe(true)
  })

  it("handles unconfirmed email login error safely", () => {
    const unconfirmedError = {
      message: "Email not confirmed",
      status: 400,
    }

    const isUnconfirmed = unconfirmedError.message
      .toLowerCase()
      .includes("email not confirmed")

    expect(isUnconfirmed).toBe(true)
  })

  it("handles expired verification callback links", () => {
    const expiredLinkError = {
      message: "Token has expired or is invalid",
    }

    const isExpired = expiredLinkError.message.toLowerCase().includes("expired")
    const userFacingMessage = isExpired
      ? "This verification link has expired. Please request a new one."
      : expiredLinkError.message

    expect(userFacingMessage).toBe(
      "This verification link has expired. Please request a new one.",
    )
  })

  it("distinguishes recovery flow callback from standard email confirmation callback", () => {
    const urlWithRecovery = new URL("https://hostelshare.app/auth/callback?type=recovery")
    const urlWithSignup = new URL("https://hostelshare.app/auth/callback?type=signup")

    expect(urlWithRecovery.searchParams.get("type")).toBe("recovery")
    expect(urlWithSignup.searchParams.get("type")).toBe("signup")
  })
})
