import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import Button from "../../components/common/Button"
import Icon from "../../components/common/Icon"
import { useAuth } from "../../context/AuthContext"

export default function VerificationPendingPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get("email") || ""
  const name = searchParams.get("name") || "Student"

  const { resendVerificationEmail, isConfigured } = useAuth()
  const [resending, setResending] = useState(false)
  const [resendResult, setResendResult] = useState<{
    success?: boolean
    message?: string
  } | null>(null)

  const handleResend = async () => {
    if (!email) return
    setResending(true)
    setResendResult(null)

    const result = await resendVerificationEmail(email)
    setResending(false)
    setResendResult({
      success: result.success,
      message: result.success
        ? "Verification email resent. Check your inbox and spam folders."
        : result.error || "Failed to resend verification email.",
    })
  }

  return (
    <main className="page auth-page">
      <div className="auth-card-container">
        <div className="auth-banner-notice">
          <Icon name="shield" size={16} />
          <span>
            <b>Supabase Auth Registration Accepted:</b> Your student account
            request has been recorded. Complete email verification to begin sharing.
          </span>
        </div>

        <div className="auth-card verification-card">
          <div className="verification-icon-orbit">
            <Icon name="mail" size={38} />
          </div>

          <span className="eyebrow" style={{ color: "var(--forest)" }}>
            Step 2 of 3 · Email Verification
          </span>
          <h1>Check Your Student Inbox</h1>
          <p className="verification-recipient-line">
            Supabase Auth dispatched a verification link to:
          </p>
          <div className="email-display-pill">
            <b>{email || "your student email address"}</b>
          </div>

          <div
            style={{
              fontSize: "0.86rem",
              color: "var(--text-secondary)",
              background: "var(--surface-sunken, #f8fafc)",
              padding: "10px 14px",
              borderRadius: "6px",
              margin: "12px 0 16px",
              border: "1px solid var(--border)",
              textAlign: "left",
            }}
          >
            <b>Notice:</b> Registration has been accepted by Supabase Auth. Email
            delivery depends on your Supabase project&apos;s email provider /
            SMTP settings. Check spam/junk folders if not received within a few
            minutes.
          </div>

          <div className="verification-steps-card">
            <h3>How to activate your account:</h3>
            <ol className="verification-steps-list">
              <li>
                <div className="step-num">1</div>
                <div>
                  <b>Open the verification email</b>
                  <p>
                    Check your college webmail or inbox for an email from your
                    Supabase project.
                  </p>
                </div>
              </li>
              <li>
                <div className="step-num">2</div>
                <div>
                  <b>Click the confirmation link</b>
                  <p>
                    The time-limited link will redirect to the HostelShare
                    callback route and confirm your resident account.
                  </p>
                </div>
              </li>
              <li>
                <div className="step-num">3</div>
                <div>
                  <b>Access shared cupboards & borrow items</b>
                  <p>
                    Borrow tools, books, and appliances from fellow hostel
                    residents safely.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {resendResult && (
            <div
              className={
                resendResult.success ? "form-success-alert" : "field-error-text"
              }
              role="status"
              style={{
                margin: "12px 0",
                padding: "10px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: resendResult.success ? "#dcfce7" : "#fee2e2",
                color: resendResult.success ? "#166534" : "#991b1b",
              }}
            >
              <Icon name={resendResult.success ? "check" : "close"} size={16} />
              <span>{resendResult.message}</span>
            </div>
          )}

          <div className="verification-actions">
            <Button variant="primary" to="/discover" className="wide">
              Explore Live Demo While Waiting <Icon name="arrow" size={16} />
            </Button>
            {email && isConfigured && (
              <Button
                variant="secondary"
                onClick={handleResend}
                className="wide"
                disabled={resending}
              >
                {resending ? "Sending verification email…" : "Resend Verification Email"}
              </Button>
            )}
          </div>

          <div className="auth-footer-links">
            <p>
              Entered the wrong email?{" "}
              <Link to="/signup" className="auth-switch-link">
                Register with another address →
              </Link>
            </p>
            <p>
              Already clicked the link?{" "}
              <Link to="/login" className="auth-switch-link">
                Proceed to Log In →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
