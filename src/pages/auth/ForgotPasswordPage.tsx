import { useState } from "react"
import { Link } from "react-router-dom"
import Button from "../../components/common/Button"
import Icon from "../../components/common/Icon"
import { useAuth } from "../../context/AuthContext"
import {
  DEFAULT_EMAIL_CONFIG,
  validateForgotPasswordForm,
} from "../../utils/authValidation"

export default function ForgotPasswordPage() {
  const { resetPassword, isConfigured, configStatus } = useAuth()

  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | undefined>()
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = validateForgotPasswordForm(email, DEFAULT_EMAIL_CONFIG)
    if (!result.isValid) {
      setError(result.error)
      document.getElementById("email")?.focus()
      return
    }

    if (!isConfigured) {
      setGeneralError(configStatus.message)
      return
    }

    setBusy(true)
    setGeneralError(null)

    try {
      const res = await resetPassword(email)
      setBusy(false)

      if (!res.success) {
        setGeneralError(
          res.error || "Failed to send reset link. Please check the email address and try again.",
        )
        return
      }

      setSubmitted(true)
    } catch (err) {
      setBusy(false)
      setGeneralError(
        err instanceof Error
          ? err.message
          : "An unexpected network error occurred. Please try again.",
      )
    }
  }

  return (
    <main className="page auth-page">
      <div className="auth-card-container">
        {!isConfigured ? (
          <div
            className="auth-banner-notice"
            style={{
              borderColor: "#f59e0b",
              background: "#fef3c7",
              color: "#92400e",
            }}
          >
            <Icon name="alert" size={16} />
            <span>
              <b>Supabase Setup Required:</b> Password reset requires active Supabase
              credentials in <code>.env.local</code>.
            </span>
          </div>
        ) : (
          <div className="auth-banner-notice">
            <Icon name="shield" size={16} />
            <span>
              <b>Secure Password Recovery:</b> A time-limited cryptographic token will
              be dispatched to your confirmed student email address.
            </span>
          </div>
        )}

        <div className="auth-card">
          <div className="auth-header">
            <span className="eyebrow" style={{ color: "var(--forest)" }}>
              Account Recovery
            </span>
            <h1>Reset Your Password</h1>
            <p>
              Enter the student email address associated with your HostelShare
              account.
            </p>
          </div>

          {submitted ? (
            <div className="auth-preview-feedback" role="status">
              <div
                className="preview-feedback-icon"
                style={{
                  background: "var(--forest-10, #e8f5e9)",
                  color: "var(--forest, #2e7d32)",
                }}
              >
                <Icon name="mail" size={26} />
              </div>
              <h3>Reset Link Dispatched</h3>
              <p>
                Supabase Auth has accepted the reset request. A time-limited
                password reset link was dispatched to:
              </p>
              <div className="preview-feedback-box">
                <b>{email.trim()}</b>
              </div>
              <p className="preview-next-steps">
                Check your student email inbox and spam folder. Click the link
                to set a new password. (Note: Email delivery is subject to your
                Supabase project&apos;s SMTP configuration).
              </p>
              <div className="preview-actions">
                <Button variant="primary" to="/login" className="wide">
                  Return to Log In
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSubmitted(false)
                    setEmail("")
                  }}
                  className="wide"
                >
                  Request for Another Email
                </Button>
              </div>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {generalError && (
                <div
                  style={{
                    background: "#fee2e2",
                    color: "#991b1b",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    fontSize: "0.88rem",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  role="alert"
                >
                  <Icon name="close" size={16} />
                  <span>{generalError}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Student Email Address <span className="required-star">*</span>
                </label>
                <div className="input-with-icon">
                  <input
                    id="email"
                    type="email"
                    className={`auth-input ${error ? "input-error" : ""}`}
                    placeholder="e.g. student@college.edu"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError(undefined)
                      if (generalError) setGeneralError(null)
                    }}
                    autoComplete="email"
                    aria-invalid={!!error}
                    aria-describedby={error ? "email-error" : undefined}
                    required
                  />
                  <span className="input-trailing-icon">
                    <Icon name="mail" size={18} />
                  </span>
                </div>
                {error && (
                  <p id="email-error" className="field-error-text" role="alert">
                    <Icon name="close" size={13} /> {error}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="amber"
                className="wide auth-submit-btn"
                disabled={busy}
              >
                {busy ? "Sending reset request…" : "Send Reset Link"}
              </Button>
            </form>
          )}

          <div className="auth-footer-links">
            <p>
              Remember your password?{" "}
              <Link to="/login" className="auth-switch-link">
                Return to log in →
              </Link>
            </p>
          </div>

          <div className="demo-bypass-box">
            <small>Want to test existing features right away?</small>
            <Button variant="text" to="/discover" className="demo-bypass-btn">
              Explore in Demo Mode →
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
