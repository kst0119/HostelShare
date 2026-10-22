import { useState } from "react"
import { Link } from "react-router-dom"
import Button from "../../components/common/Button"
import Icon from "../../components/common/Icon"
import {
  DEFAULT_EMAIL_CONFIG,
  validateForgotPasswordForm,
} from "../../utils/authValidation"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | undefined>()
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const result = validateForgotPasswordForm(email, DEFAULT_EMAIL_CONFIG)
    if (!result.isValid) {
      setError(result.error)
      document.getElementById("email")?.focus()
      return
    }

    setBusy(true)

    // Phase 4A UI simulation
    setTimeout(() => {
      setBusy(false)
      setSubmitted(true)
    }, 400)
  }

  return (
    <main className="page auth-page">
      <div className="auth-card-container">
        <div className="auth-banner-notice">
          <Icon name="shield" size={16} />
          <span>
            <b>Phase 4A Design Placeholder:</b> Password recovery interface.
            Secure time-limited reset tokens and email dispatch will be handled
            by the auth provider in Phase 4B.
          </span>
        </div>

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
              <div className="preview-feedback-icon">
                <Icon name="mail" size={26} />
              </div>
              <h3>Reset Link Request Simulated</h3>
              <p>
                In production (Phase 4B), a password reset link with a
                time-limited cryptographic token would be dispatched to:
              </p>
              <div className="preview-feedback-box">
                <b>{email.trim()}</b>
              </div>
              <p className="preview-next-steps">
                Check your student email inbox and spam folder. If you don&apos;t
                receive an email within a few minutes, ensure your email address
                was entered correctly.
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
                {busy ? "Sending request…" : "Send Reset Link"}
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
