import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { Session, User as SupabaseUser } from "@supabase/supabase-js"
import {
  getAuthRedirectUrl,
  getSupabaseConfigStatus,
  isSupabaseConfigured,
  supabase,
} from "../lib/supabase"
import { SignUpFormData } from "../utils/authValidation"

export type AuthResult = {
  success: boolean
  message?: string
  error?: string
  needsEmailConfirmation?: boolean
}

export type AuthContextType = {
  user: SupabaseUser | null
  session: Session | null
  isLoading: boolean
  isConfigured: boolean
  configStatus: ReturnType<typeof getSupabaseConfigStatus>
  signUp: (data: SignUpFormData) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<AuthResult>
  updatePassword: (password: string) => Promise<AuthResult>
  resendVerificationEmail: (email: string) => Promise<AuthResult>
  authError: string | null
  clearAuthError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const configStatus = getSupabaseConfigStatus()

  const clearAuthError = useCallback(() => {
    setAuthError(null)
  }, [])

  // Initialize session and subscribe to auth state changes
  useEffect(() => {
    let isMounted = true

    if (!isSupabaseConfigured) {
      setIsLoading(false)
      return
    }

    // 1. Get initial active session
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession }, error }) => {
        if (!isMounted) return
        if (error) {
          setAuthError(error.message)
        }
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
        setIsLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setAuthError(err instanceof Error ? err.message : "Failed to get session")
        setIsLoading(false)
      })

    // 2. Subscribe to auth changes (sign in, sign out, token refresh, password recovery)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setIsLoading(false)
    })

    // Clean up subscription on unmount
    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (data: SignUpFormData): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: configStatus.message,
      }
    }

    try {
      const { data: resData, error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
          },
          emailRedirectTo: getAuthRedirectUrl("/auth/callback"),
        },
      })

      if (error) {
        // Map common errors to friendly student-facing messages
        if (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("user already exists")
        ) {
          return {
            success: false,
            error: "An account with this email address already exists. Please log in instead.",
          }
        }
        if (error.status === 429 || error.message.toLowerCase().includes("rate limit")) {
          return {
            success: false,
            error: "Too many sign-up requests. Please wait a few minutes before trying again.",
          }
        }
        return {
          success: false,
          error: error.message,
        }
      }

      // Check if user identities are empty (email enumeration protection for duplicate accounts)
      if (resData.user?.identities && resData.user.identities.length === 0) {
        return {
          success: false,
          error: "An account with this email already exists. Please check your inbox or try logging in.",
        }
      }

      // If email confirmation is required, session will be null
      const needsEmailConfirmation = !resData.session
      return {
        success: true,
        needsEmailConfirmation,
        message: needsEmailConfirmation
          ? "Registration accepted. Please check your student inbox to verify your email."
          : "Account created and signed in successfully.",
      }
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Network error occurred while connecting to authentication service.",
      }
    }
  }

  const signIn = async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: configStatus.message,
      }
    }

    try {
      const { data: _resData, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        const msg = error.message.toLowerCase()
        if (msg.includes("email not confirmed")) {
          return {
            success: false,
            needsEmailConfirmation: true,
            error:
              "Your student email has not been confirmed yet. Please verify your email using the link sent to your inbox.",
          }
        }
        if (
          msg.includes("invalid login credentials") ||
          msg.includes("invalid credentials")
        ) {
          return {
            success: false,
            error:
              "Invalid email or password. Please verify your credentials and try again.",
          }
        }
        if (error.status === 429 || msg.includes("rate limit")) {
          return {
            success: false,
            error:
              "Too many login attempts. Please wait a few minutes before trying again.",
          }
        }
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
        message: "Successfully logged in.",
      }
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Network error occurred while signing in.",
      }
    }
  }

  const signOut = async (): Promise<void> => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut()
      } catch {
        // Silently clear local session state even if network call fails
      }
    }
    setSession(null)
    setUser(null)
  }

  const resetPassword = async (email: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: configStatus.message,
      }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: getAuthRedirectUrl("/auth/callback?type=recovery"),
        },
      )

      if (error) {
        if (error.status === 429 || error.message.toLowerCase().includes("rate limit")) {
          return {
            success: false,
            error:
              "Too many password reset requests. Please wait a few minutes before trying again.",
          }
        }
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
        message: "Password reset link sent to your student inbox.",
      }
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Network error while requesting password reset.",
      }
    }
  }

  const updatePassword = async (password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: configStatus.message,
      }
    }

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
        message: "Your password has been successfully updated.",
      }
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Network error while updating password.",
      }
    }
  }

  const resendVerificationEmail = async (email: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: configStatus.message,
      }
    }

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: getAuthRedirectUrl("/auth/callback"),
        },
      })

      if (error) {
        if (error.status === 429 || error.message.toLowerCase().includes("rate limit")) {
          return {
            success: false,
            error:
              "Too many resend attempts. Please wait a few moments before requesting another link.",
          }
        }
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
        message: "Verification email resent. Please check your student inbox.",
      }
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Network error while resending verification email.",
      }
    }
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isConfigured: isSupabaseConfigured,
    configStatus,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    resendVerificationEmail,
    authError,
    clearAuthError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
