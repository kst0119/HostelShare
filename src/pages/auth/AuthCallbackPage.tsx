import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import Button from "../../components/common/Button"
import Icon from "../../components/common/Icon"
import { isSupabaseConfigured, supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"

type CallbackStatus = "processing" | "success" | "error" | "recovery"

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { configStatus } = useAuth()

  const [status, setStatus] = useState<CallbackStatus>("processing")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const processedRef = useRef(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus("error")
      setErrorMessage(
        "Supabase is not configured. Email verification callbacks require valid Supabase credentials in .env.local.",
      )
      return
    }

    // Helper to extract param from query string or hash fragment
    const getParam = (key: string): string | null => {
      const fromQuery = searchParams.get(key)
      if (fromQuery) return fromQuery
      if (typeof window !== "undefined" && window.location.hash) {
        const rawHash = window.location.hash.replace(/^#/, "")
        const hashParams = new URLSearchParams(rawHash)
        return hashParams.get(key)
      }
      return null
    }

    const type = getParam("type")
    const isRecovery =
      type === "recovery" ||
      (typeof window !== "undefined" &&
        window.location.hash.includes("type=recovery")) ||
      searchParams.get("next")?.includes("reset-password")

    // Listen to auth state changes (essential for implicit token hash fragments)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession) {
        if (isRecovery) {
          setStatus("recovery")
          navigate("/reset-password", { replace: true })
        } else {
          setStatus("success")
        }
      }
    })

    const processAuthCallback = async () => {
      try {
        const code = getParam("code")
        const tokenHash = getParam("token_hash")
        const errorDescription =
          getParam("error_description") || getParam("error")

        // Provider reported error via query param or hash
        if (errorDescription) {
          setStatus("error")
          setErrorMessage(errorDescription)
          return
        }

        // Case 1: PKCE code exchange
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            setStatus("error")
            setErrorMessage(
              error.message.includes("expired")
                ? "This verification link has expired. Please request a new one."
                : error.message,
            )
            return
          }

          if (isRecovery) {
            setStatus("recovery")
            navigate("/reset-password", { replace: true })
            return
          }

          if (data.session) {
            setStatus("success")
            return
          }
        }

        // Case 2: Token hash / OTP verification
        if (tokenHash) {
          const otpType = (type || "email") as
            | "signup"
            | "email"
            | "recovery"
            | "invite"
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          })

          if (error) {
            setStatus("error")
            setErrorMessage(
              error.message.includes("expired")
                ? "This link has expired. Please request a new verification email."
                : error.message,
            )
            return
          }

          if (isRecovery || otpType === "recovery") {
            setStatus("recovery")
            navigate("/reset-password", { replace: true })
            return
          }

          if (data.session) {
            setStatus("success")
            return
          }
        }

        // Case 3: Implicit hash flow session check
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession()

        if (sessionError) {
          setStatus("error")
          setErrorMessage(sessionError.message)
          return
        }

        if (sessionData.session) {
          if (isRecovery) {
            setStatus("recovery")
            navigate("/reset-password", { replace: true })
            return
          }
          setStatus("success")
          return
        }

        // If access_token is in hash, keep in processing state while onAuthStateChange completes
        if (
          typeof window !== "undefined" &&
          window.location.hash.includes("access_token")
        ) {
          return
        }

        // Case 4: No params or session found
        setStatus("error")
        setErrorMessage(
          "No valid verification code or active session was detected in the URL. If you already verified, please log in.",
        )
      } catch (err) {
        setStatus("error")
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while verifying your session.",
        )
      }
    }

    processAuthCallback()

    return () => {
      subscription.unsubscribe()
    }
  }, [searchParams, navigate])

  return (
    <main className="page auth-page">
      <div className="auth-card-container">
        <div className="auth-card verification-card">
          {status === "processing" && (
            <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <div
                className="loading-spinner"
                style={{
                  width: "48px",
                  height: "48px",
                  margin: "0 auto 20px",
                  border: "4px solid var(--border)",
                  borderTopColor: "var(--forest)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <h2>Verifying Your Student Credentials</h2>
              <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
                Establishing a secure session with Supabase Auth…
              </p>
            </div>
          )}

          {status === "success" && (
            <div role="status">
              <div
                className="verification-icon-orbit"
                style={{
                  background: "var(--forest-10, #e8f5e9)",
                  color: "var(--forest, #2e7d32)",
                  borderColor: "var(--forest, #2e7d32)",
                }}
              >
                <Icon name="check" size={40} />
              </div>

              <span className="eyebrow" style={{ color: "var(--forest)" }}>
                Verification Complete
              </span>
              <h1>Email Confirmed!</h1>
              <p className="verification-recipient-line">
                Your student account is now verified and active. You can now
                borrow items, post requirements, and share with your hostel neighbors.
              </p>

              <div className="verification-actions" style={{ marginTop: "24px" }}>
                <Button variant="primary" to="/discover" className="wide">
                  Explore Shared Cupboards <Icon name="arrow" size={16} />
                </Button>
                <Button variant="secondary" to="/profile" className="wide">
                  Go to Resident Profile
                </Button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div role="alert">
              <div
                className="verification-icon-orbit"
                style={{
                  background: "var(--amber-10, #fff3e0)",
                  color: "#d97706",
                  borderColor: "#f59e0b",
                }}
              >
                <Icon name="alert" size={40} />
              </div>

              <span className="eyebrow" style={{ color: "#d97706" }}>
                Verification Status
              </span>
              <h1>Link Verification Notice</h1>
              <div
                style={{
                  background: "var(--surface-sunken, #f8fafc)",
                  padding: "16px",
                  borderRadius: "8px",
                  margin: "16px 0",
                  border: "1px solid var(--border)",
                  textAlign: "left",
                }}
              >
                <p style={{ margin: 0, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                  {errorMessage}
                </p>
              </div>

              {!isSupabaseConfigured && (
                <div
                  style={{
                    background: "#fef3c7",
                    color: "#92400e",
                    padding: "12px 14px",
                    borderRadius: "6px",
                    fontSize: "0.88rem",
                    marginBottom: "16px",
                    textAlign: "left",
                  }}
                >
                  <b>Setup requirement:</b> {configStatus.message}
                </div>
              )}

              <div className="verification-actions" style={{ marginTop: "20px" }}>
                <Button variant="primary" to="/login" className="wide">
                  Proceed to Log In
                </Button>
                <Button variant="secondary" to="/signup" className="wide">
                  Create a New Account
                </Button>
              </div>

              <div className="demo-bypass-box" style={{ marginTop: "20px" }}>
                <small>Want to test existing features right away?</small>
                <Button variant="text" to="/discover" className="demo-bypass-btn">
                  Explore in Demo Mode (No Login Required) →
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
