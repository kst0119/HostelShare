import Icon from "../common/Icon"
import { PasswordChecks, PasswordStrength } from "../../utils/authValidation"

export default function PasswordStrengthIndicator({
  checks,
  strength,
  passedCount,
  visible,
}: {
  checks: PasswordChecks
  strength: PasswordStrength
  passedCount: number
  visible: boolean
}) {
  if (!visible) return null

  const strengthLabels: Record<PasswordStrength, string> = {
    empty: "Enter a password",
    weak: "Weak password",
    fair: "Fair password",
    good: "Good password",
    strong: "Strong password",
  }

  const strengthColors: Record<PasswordStrength, string> = {
    empty: "var(--muted)",
    weak: "#EF4444",
    fair: "#F59E0B",
    good: "#10B981",
    strong: "#059669",
  }

  const items = [
    { key: "hasMinLength", label: "At least 8 characters", met: checks.hasMinLength },
    { key: "hasUppercase", label: "One uppercase letter (A-Z)", met: checks.hasUppercase },
    { key: "hasLowercase", label: "One lowercase letter (a-z)", met: checks.hasLowercase },
    { key: "hasNumber", label: "One number (0-9)", met: checks.hasNumber },
    { key: "hasSpecialChar", label: "One special character (!@#$%^&*)", met: checks.hasSpecialChar },
  ] as const

  return (
    <div className="password-strength-box" role="status" aria-live="polite">
      <div className="strength-bar-row">
        <div className="strength-bars">
          {[1, 2, 3, 4, 5].map((step) => {
            const isFilled = passedCount >= step
            return (
              <span
                key={step}
                className={`strength-segment ${isFilled ? `filled ${strength}` : ""}`}
              />
            )
          })}
        </div>
        <span
          className="strength-label"
          style={{ color: strengthColors[strength] }}
        >
          {strengthLabels[strength]}
        </span>
      </div>

      <ul className="password-rules-list">
        {items.map((item) => (
          <li key={item.key} className={item.met ? "rule-met" : "rule-unmet"}>
            <span className="rule-icon">
              {item.met ? (
                <Icon name="check" size={12} />
              ) : (
                <i className="rule-dot" />
              )}
            </span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
