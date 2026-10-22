import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import Button from "../../components/common/Button"
import Icon from "../../components/common/Icon"

export default function VerificationPendingPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get("email") || "your student email address"
  const name = searchParams.get("name") || "Student"

  const [resent, setResent] = useState(false)

  const handleResend = () => {
    setResent(true)
    setTimeout(() => setResent(false), 5000)
  }

  return (
    <main className="page auth-page">
      <div className="auth-card-container">
        <div className="auth-banner-notice">
          <Icon name="shield" size={16} />
          <span>
            <b>Phase 4A Onboarding Preview:</b> This screen demonstrates the
            post-registration verification step. Live email verification and
            account activation will be automated in Phase 4B.
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
            We dispatched a verification email to:
          </p>
          <div className="email-display-pill">
            <b>{email}</b>
          </div>

          <div className="verification-steps-card">
            <h3>Future Verification Flow:</h3>
            <ol className="verification-steps-list">
              <li>
                <div className="step-num">1</div>
                <div>
                  <b>Open the verification email</b>
                  <p>
                    Check your college webmail or inbox for an email from{" "}
                    <code>verify@hostelshare.edu</code>.
                  </p>
                </div>
              </li>
              <li>
                <div className="step-num">2</div>
                <div>
                  <b>Click the confirmation link</b>
                  <p>
                    The time-limited link verifies that you are an actively
                    enrolled student resident.
                  </p>
                </div>
              </li>
              <li>
                <div className="step-num">3</div>
                <div>
                  <b>Choose your hostel room & start sharing</b>
                  <p>
                    Set your hostel building (e.g. Maple House) and room number
                    to connect with your immediate floor-mates.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {resent && (
            <div className="form-success-alert" role="status">
              <Icon name="check" size={16} />
              <span>
                Simulated verification email resent to <b>{email}</b>! Check
                your inbox shortly.
              </span>
            </div>
          )}

          <div className="verification-actions">
            <Button variant="primary" to="/discover" className="wide">
              Explore Live Demo While Waiting <Icon name="arrow" size={16} />
            </Button>
            <Button
              variant="secondary"
              onClick={handleResend}
              className="wide"
              disabled={resent}
            >
              {resent ? "Email Dispatched" : "Resend Verification Email"}
            </Button>
          </div>

          <div className="auth-footer-links">
            <p>
              Entered the wrong email?{" "}
              <Link to="/signup" className="auth-switch-link">
                Register with another address →
              </Link>
            </p>
            <p>
              Already verified?{" "}
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
