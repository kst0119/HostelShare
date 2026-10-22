import { useState } from "react"
import { Link } from "react-router-dom"
import Button from "../../components/common/Button"
import Icon from "../../components/common/Icon"
import {
  DEFAULT_EMAIL_CONFIG,
  LoginFormData,
  LoginErrors,
  validateLoginForm,
} from "../../utils/authValidation"

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  })

  const [errors, setErrors] = useState<LoginErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [validatedPreview, setValidatedPreview] = useState(false)

  const handleChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (validatedPreview) {
      setValidatedPreview(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const result = validateLoginForm(formData, DEFAULT_EMAIL_CONFIG)
    if (!result.isValid) {
      setErrors(result.errors)
      const firstErrorField = Object.keys(result.errors)[0]
      const el = document.getElementById(firstErrorField)
      el?.focus()
      return
    }

    setBusy(true)

    // Phase 4A UI note: Do not fake login success or store fake tokens
    setTimeout(() => {
      setBusy(false)
      setValidatedPreview(true)
    }, 400)
  }

  return (
    <main className="page auth-page">
      <div className="auth-card-container">
        <div className="auth-banner-notice">
          <Icon name="shield" size={16} />
          <span>
            <b>Phase 4A Preview:</b> Authentication user interface with
            client-side validation. Server authentication and sessions connect
            in Phase 4B.
          </span>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <span className="eyebrow" style={{ color: "var(--forest)" }}>
              Resident Access
            </span>
            <h1>Log in to HostelShare</h1>
            <p>
              Access your shared cupboards, active borrowings, and hostel
              neighbor requests.
            </p>
          </div>

          {validatedPreview ? (
            <div className="auth-preview-feedback" role="status">
              <div className="preview-feedback-icon">
                <Icon name="check" size={24} />
              </div>
              <h3>Form Validated Successfully</h3>
              <p>
                Email format and password requirements were validated on the
                client side. In accordance with Phase 4A requirements, fake login
                success is not simulated and credentials are not stored.
              </p>
              <div className="preview-feedback-box">
                <small>Validated inputs:</small>
                <b>Email: {formData.email}</b>
                <span>Password: •••••••• ({formData.password.length} chars)</span>
              </div>
              <p className="preview-next-steps">
                In Phase 4B, secure JWT tokens, password hashing, and server
                sessions will be integrated. You can test all live features right
                now using the demo mode:
              </p>
              <div className="preview-actions">
                <Button variant="amber" to="/discover" className="wide">
                  Explore Live Demo (Browse Items) <Icon name="arrow" size={16} />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setValidatedPreview(false)
                    setFormData({ email: "", password: "" })
                  }}
                  className="wide"
                >
                  Clear and Test Another Login
                </Button>
              </div>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
                {busy ? "Validating credentials…" : "Log In"}
              </Button>
            </form>
          )}

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
