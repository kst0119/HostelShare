import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Button from "../../components/common/Button"
import Icon from "../../components/common/Icon"
import PasswordStrengthIndicator from "../../components/auth/PasswordStrengthIndicator"
import {
  DEFAULT_EMAIL_CONFIG,
  SignUpFormData,
  SignUpErrors,
  validatePassword,
  validateSignUpForm,
} from "../../utils/authValidation"

export default function SignUpPage() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState<SignUpFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  })

  const [errors, setErrors] = useState<SignUpErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [busy, setBusy] = useState(false)

  const passwordValidation = validatePassword(formData.password)

  const handleChange = (
    field: keyof SignUpFormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field-specific error as user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const result = validateSignUpForm(formData, DEFAULT_EMAIL_CONFIG)
    if (!result.isValid) {
      setErrors(result.errors)
      // Focus first error field for accessibility
      const firstErrorField = Object.keys(result.errors)[0]
      const el = document.getElementById(firstErrorField)
      el?.focus()
      return
    }

    setBusy(true)

    // Phase 4A UI note: No backend authentication or password storage in client state
    setTimeout(() => {
      setBusy(false)
      const encodedEmail = encodeURIComponent(formData.email.trim())
      const encodedName = encodeURIComponent(formData.fullName.trim())
      navigate(`/verification-pending?email=${encodedEmail}&name=${encodedName}`)
    }, 450)
  }

  return (
    <main className="page auth-page">
      <div className="auth-card-container">
        <div className="auth-banner-notice">
          <Icon name="shield" size={16} />
          <span>
            <b>Phase 4A Preview:</b> Student sign-up form with client-side
            validation. Real server authentication & email verification connect
            in Phase 4B.
          </span>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <span className="eyebrow" style={{ color: "var(--forest)" }}>
              Campus Registration
            </span>
            <h1>Join HostelShare</h1>
            <p>
              Register with your student email to share and borrow resources
              with verified hostel residents.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">
                Full Name <span className="required-star">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                className={`auth-input ${errors.fullName ? "input-error" : ""}`}
                placeholder="e.g. Aisha Singh"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                autoComplete="name"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
                required
              />
              {errors.fullName && (
                <p id="fullName-error" className="field-error-text" role="alert">
                  <Icon name="close" size={13} /> {errors.fullName}
                </p>
              )}
            </div>

            {/* Student Email */}
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
                  aria-describedby={errors.email ? "email-error" : "email-hint"}
                  required
                />
                <span className="input-trailing-icon">
                  <Icon name="mail" size={18} />
                </span>
              </div>
              <small id="email-hint" className="field-hint">
                Use your university or college student email address. Institutional domain rules are configurable.
              </small>
              {errors.email && (
                <p id="email-error" className="field-error-text" role="alert">
                  <Icon name="close" size={13} /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password <span className="required-star">*</span>
              </label>
              <div className="input-with-icon">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`auth-input ${errors.password ? "input-error" : ""}`}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
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

              {/* Password strength & checklist */}
              <PasswordStrengthIndicator
                checks={passwordValidation.checks}
                strength={passwordValidation.strength}
                passedCount={passwordValidation.passedCount}
                visible={passwordFocused || formData.password.length > 0}
              />

              {errors.password && (
                <p id="password-error" className="field-error-text" role="alert">
                  <Icon name="close" size={13} /> {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password <span className="required-star">*</span>
              </label>
              <div className="input-with-icon">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`auth-input ${errors.confirmPassword ? "input-error" : ""}`}
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword ? "confirmPassword-error" : undefined
                  }
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  <Icon name={showConfirmPassword ? "eyeOff" : "eye"} size={18} />
                </button>
              </div>
              {errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="field-error-text"
                  role="alert"
                >
                  <Icon name="close" size={13} /> {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms and Privacy Checkbox */}
            <div className="form-group checkbox-group">
              <label className="checkbox-label" htmlFor="termsAccepted">
                <input
                  id="termsAccepted"
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => handleChange("termsAccepted", e.target.checked)}
                  aria-invalid={!!errors.termsAccepted}
                  aria-describedby={
                    errors.termsAccepted ? "termsAccepted-error" : undefined
                  }
                />
                <span>
                  I agree to the{" "}
                  <button
                    type="button"
                    className="link-inline-btn"
                    onClick={() => {
                      alert("HostelShare Community Charter:\n1. Treat shared items with care.\n2. Always return items on time.\n3. Conduct handovers in common hostel spaces.\n4. Maintain honest neighborly trust.")
                    }}
                  >
                    HostelShare Community Guidelines
                  </button>{" "}
                  and acknowledge student data privacy.
                </span>
              </label>
              {errors.termsAccepted && (
                <p
                  id="termsAccepted-error"
                  className="field-error-text"
                  role="alert"
                >
                  <Icon name="close" size={13} /> {errors.termsAccepted}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="amber"
              className="wide auth-submit-btn"
              disabled={busy}
            >
              {busy ? "Validating credentials…" : "Create Student Account"}
            </Button>
          </form>

          <div className="auth-footer-links">
            <p>
              Already registered?{" "}
              <Link to="/login" className="auth-switch-link">
                Log in to your account →
              </Link>
            </p>
          </div>

          <div className="demo-bypass-box">
            <small>Looking to test the prototype without registering?</small>
            <Button
              variant="text"
              to="/discover"
              className="demo-bypass-btn"
            >
              Skip to Demo Mode as Aisha (Maple House) →
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
