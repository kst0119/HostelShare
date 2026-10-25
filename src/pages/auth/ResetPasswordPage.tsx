import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Button from "../../components/common/Button"
import Icon from "../../components/common/Icon"
import PasswordStrengthIndicator from "../../components/auth/PasswordStrengthIndicator"
import { useAuth } from "../../context/AuthContext"
import {
  ResetPasswordErrors,
  ResetPasswordFormData,
  validatePassword,
  validateResetPasswordForm,
} from "../../utils/authValidation"

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { session, updatePassword, isLoading, isConfigured, configStatus } = useAuth()

  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState<ResetPasswordErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const passwordValidation = validatePassword(formData.password)

  // Verify we have an active recovery session
  const hasActiveSession = Boolean(session)

  const handleChange = (field: keyof ResetPasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (generalError) {
      setGeneralError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConfigured) {
      setGeneralError(configStatus.message)
      return
    }

    const validation = validateResetPasswordForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      const firstErrorField = Object.keys(validation.errors)[0]
      document.getElementById(firstErrorField)?.focus()
      return
    }

    setBusy(true)
    setGeneralError(null)

    try {
      const result = await updatePassword(formData.password)
      setBusy(false)

      if (result.success) {
        setSuccess(true)
      } else {
        setGeneralError(
          result.error || "Failed to update password. Please request a new reset link.",
        )
      }
    } catch (err) {
      setBusy(false)
      setGeneralError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while updating your password.",
      )
    }
  }

  return (
    <main className="page auth-page">
      <div className="auth-card-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="eyebrow" style={{ color: "var(--forest)" }}>
              Account Security
            </span>
            <h1>Set New Password</h1>
            <p>
              Choose a strong, unique password for your HostelShare resident account.
            </p>
          </div>

          {!isConfigured && (
            <div
              style={{
                background: "#fef3c7",
                color: "#92400e",
                padding: "12px 14px",
                borderRadius: "6px",
                fontSize: "0.88rem",
                marginBottom: "20px",
                textAlign: "left",
              }}
            >
              <b>Supabase setup required:</b> {configStatus.message}
            </div>
          )}

          {success ? (
            <div className="auth-preview-feedback" role="status">
              <div
                className="preview-feedback-icon"
                style={{
                  background: "var(--forest-10, #e8f5e9)",
                  color: "var(--forest, #2e7d32)",
                }}
              >
                <Icon name="check" size={26} />
              </div>
              <h3>Password Updated Successfully!</h3>
              <p>
                Your new password has been securely saved in Supabase Auth. You can
                now log in to your account.
              </p>
              <div className="preview-actions">
                <Button variant="primary" to="/login" className="wide">
                  Proceed to Log In <Icon name="arrow" size={16} />
                </Button>
                <Button variant="secondary" to="/discover" className="wide">
                  Browse Shared Items (Demo Mode)
                </Button>
              </div>
            </div>
          ) : !isLoading && !hasActiveSession && isConfigured ? (
            <div role="alert" style={{ textAlign: "center", padding: "16px 0" }}>
              <div
                className="verification-icon-orbit"
                style={{
                  background: "var(--amber-10, #fff3e0)",
                  color: "#d97706",
                  borderColor: "#f59e0b",
                  margin: "0 auto 16px",
                }}
              >
                <Icon name="alert" size={32} />
              </div>
              <h3>No Active Recovery Session</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                To reset your password, you must click the password-reset link sent to
                your student email. If the link has expired, please request a new one.
              </p>
              <div className="preview-actions" style={{ marginTop: "20px" }}>
                <Button variant="amber" to="/forgot-password" className="wide">
                  Request New Password Reset Link
                </Button>
                <Button variant="secondary" to="/login" className="wide">
                  Return to Log In
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

              {/* New Password */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  New Password <span className="required-star">*</span>
                </label>
                <div className="input-with-icon">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className={`auth-input ${errors.password ? "input-error" : ""}`}
                    placeholder="Create a new strong password"
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
                  >
                    <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
                  </button>
                </div>

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

              {/* Confirm New Password */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm New Password <span className="required-star">*</span>
                </label>
                <div className="input-with-icon">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className={`auth-input ${errors.confirmPassword ? "input-error" : ""}`}
                    placeholder="Repeat your new password"
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
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
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

              <Button
                type="submit"
                variant="amber"
                className="wide auth-submit-btn"
                disabled={busy}
              >
                {busy ? "Updating password…" : "Save New Password"}
              </Button>
            </form>
          )}

          <div className="auth-footer-links">
            <p>
              Remember your existing password?{" "}
              <Link to="/login" className="auth-switch-link">
                Return to log in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
