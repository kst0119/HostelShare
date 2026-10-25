import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import Button from "../../components/common/Button"
import Icon from "../../components/common/Icon"
import { useAuth } from "../../context/AuthContext"
import {
  DEFAULT_EMAIL_CONFIG,
  LoginFormData,
  LoginErrors,
  validateLoginForm,
} from "../../utils/authValidation"

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, isConfigured, configStatus, resendVerificationEmail } = useAuth()

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  })

  const [errors, setErrors] = useState<LoginErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resendStatus, setResendStatus] = useState<string | null>(null)

  const fromLocation = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/discover"

  const handleChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (generalError) {
      setGeneralError(null)
    }
    if (needsConfirmation) {
      setNeedsConfirmation(false)
    }
  }

  const handleResend = async () => {
    if (!formData.email) return
    setResendStatus("Dispatching verification link…")
    const res = await resendVerificationEmail(formData.email)
    setResendStatus(res.message || res.error || "Request processed.")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = validateLoginForm(formData, DEFAULT_EMAIL_CONFIG)
    if (!result.isValid) {
      setErrors(result.errors)
      const firstErrorField = Object.keys(result.errors)[0]
      const el = document.getElementById(firstErrorField)
      el?.focus()
      return
    }

    if (!isConfigured) {
      setGeneralError(configStatus.message)
      return
    }

    setBusy(true)
    setGeneralError(null)
    setNeedsConfirmation(false)
    setResendStatus(null)

    try {
      const res = await signIn(formData.email, formData.password)
      setBusy(false)

      if (res.needsEmailConfirmation) {
        setNeedsConfirmation(true)
        setGeneralError(res.error || "Email not confirmed.")
        return
      }

      if (!res.success) {
        setGeneralError(res.error || "Login failed. Please verify your credentials.")
        return
      }

      navigate(fromLocation, { replace: true })
    } catch (err) {
      setBusy(false)
      setGeneralError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during login. Please try again.",
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
              <b>Supabase Setup Required:</b> To authenticate real accounts,
              configure <code>VITE_SUPABASE_URL</code> and{" "}
              <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in <code>.env.local</code>.
              Demo Mode remains accessible without login.
            </span>
          </div>
        ) : (
          <div className="auth-banner-notice">
            <Icon name="shield" size={16} />
            <span>
              <b>Resident Sign In:</b> Authenticating with Supabase Auth session
              management and secure cookies.
            </span>
          </div>
        )}

        <div className="auth-card">
          <div className="auth-header">
            <span className="eyebrow" style={{ color: "var(--forest)" }}>
              Resident Access
            </span>
            <h1>Log in to HostelShare</h1>
            <p>
              Access your shared cupboards, active borrowings, and hostel neighbor
              requests.
            </p>
          </div>

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
                  flexDirection: "column",
                  gap: "6px",
                }}
                role="alert"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon name="close" size={16} />
                  <span>{generalError}</span>
                </div>
                {needsConfirmation && (
                  <div style={{ marginTop: "4px" }}>
                    <button
                      type="button"
                      onClick={handleResend}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#991b1b",
                        textDecoration: "underline",
                        cursor: "pointer",
                        fontWeight: 600,
                        padding: 0,
                        fontSize: "0.85rem",
                      }}
                    >
                      Resend verification email to {formData.email} →
                    </button>
                    {resendStatus && (
                      <p style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>
                        {resendStatus}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Student Email Address <span className="required-star">*</span>
              </label>
              <div className="input-with-icon">
                <input
                  id="email"
                  type="email"
                  className={`auth-input ${errors.email ? "input-error" : ""}`}
                  placeholder="e.g. student@college.edu"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  required
                />
                <span className="input-trailing-icon">
                  <Icon name="mail" size={18} />
                </span>
              </div>
              {errors.email && (
                <p id="email-error" className="field-error-text" role="alert">
                  <Icon name="close" size={13} /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <div className="label-with-counter">
                <label htmlFor="password" className="form-label">
                  Password <span className="required-star">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="forgot-password-link"
                  tabIndex={0}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="input-with-icon">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`auth-input ${errors.password ? "input-error" : ""}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  className="field-error-text"
                  role="alert"
                >
                  <Icon name="close" size={13} /> {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="wide auth-submit-btn"
              disabled={busy}
            >
              {busy ? "Authenticating with Supabase…" : "Log In"}
            </Button>
          </form>

          <div className="auth-footer-links">
            <p>
              New to HostelShare?{" "}
              <Link to="/signup" className="auth-switch-link">
                Create a student account →
              </Link>
            </p>
          </div>

          <div className="demo-bypass-box">
            <small>Want to test existing features right away?</small>
            <Button variant="text" to="/discover" className="demo-bypass-btn">
              Explore in Demo Mode (No Login Required) →
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
