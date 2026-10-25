export type PasswordChecks = {
  hasMinLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
}

export type PasswordStrength = "empty" | "weak" | "fair" | "good" | "strong"

export type PasswordValidationResult = {
  isValid: boolean
  checks: PasswordChecks
  passedCount: number
  strength: PasswordStrength
  error?: string
}

export type EmailValidationConfig = {
  allowedDomains?: string[]
  requireInstitutionalDomain?: boolean
}

export const DEFAULT_EMAIL_CONFIG: EmailValidationConfig = {
  allowedDomains: [],
  requireInstitutionalDomain: false,
}

// Special characters supported
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export function validateEmail(
  email: string,
  config: EmailValidationConfig = DEFAULT_EMAIL_CONFIG,
): { isValid: boolean; error?: string } {
  const trimmed = email ? email.trim() : ""

  if (!trimmed) {
    return { isValid: false, error: "Student email address is required." }
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: "Please enter a valid email address (e.g., student@college.edu).",
    }
  }

  // Configurable institutional domain check
  if (
    config.requireInstitutionalDomain &&
    config.allowedDomains &&
    config.allowedDomains.length > 0
  ) {
    const domain = trimmed.split("@")[1]?.toLowerCase()
    const isDomainAllowed = config.allowedDomains.some(
      (allowed) => domain === allowed.toLowerCase() || domain?.endsWith(`.${allowed.toLowerCase()}`),
    )
    if (!isDomainAllowed) {
      return {
        isValid: false,
        error: `Please use your official college email (${config.allowedDomains.join(", ")}).`,
      }
    }
  }

  return { isValid: true }
}

export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return {
      isValid: false,
      checks: {
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
      },
      passedCount: 0,
      strength: "empty",
      error: "Password is required.",
    }
  }

  const checks: PasswordChecks = {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: SPECIAL_CHAR_REGEX.test(password),
  }

  const passedCount = Object.values(checks).filter(Boolean).length

  let strength: PasswordStrength = "weak"
  if (passedCount <= 2) {
    strength = "weak"
  } else if (passedCount === 3) {
    strength = "fair"
  } else if (passedCount === 4) {
    strength = "good"
  } else if (passedCount === 5) {
    strength = "strong"
  }

  const isValid = passedCount === 5

  let error: string | undefined
  if (!isValid) {
    if (!checks.hasMinLength) {
      error = "Password must be at least 8 characters long."
    } else if (!checks.hasUppercase) {
      error = "Password must contain at least one uppercase letter (A-Z)."
    } else if (!checks.hasLowercase) {
      error = "Password must contain at least one lowercase letter (a-z)."
    } else if (!checks.hasNumber) {
      error = "Password must contain at least one number (0-9)."
    } else if (!checks.hasSpecialChar) {
      error = "Password must contain at least one special character (e.g. !@#$%^&*)."
    }
  }

  return {
    isValid,
    checks,
    passedCount,
    strength,
    error,
  }
}

export type SignUpFormData = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  termsAccepted: boolean
}

export type SignUpErrors = {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
  termsAccepted?: string
}

export function validateSignUpForm(
  data: SignUpFormData,
  config: EmailValidationConfig = DEFAULT_EMAIL_CONFIG,
): { isValid: boolean; errors: SignUpErrors } {
  const errors: SignUpErrors = {}

  // Full Name validation
  const trimmedName = data.fullName ? data.fullName.trim() : ""
  if (!trimmedName) {
    errors.fullName = "Full name is required."
  } else if (trimmedName.length < 2) {
    errors.fullName = "Please enter your full name (at least 2 characters)."
  }

  // Email validation
  const emailResult = validateEmail(data.email, config)
  if (!emailResult.isValid) {
    errors.email = emailResult.error
  }

  // Password validation
  const passwordResult = validatePassword(data.password)
  if (!passwordResult.isValid) {
    errors.password = passwordResult.error
  }

  // Confirm Password validation
  if (!data.confirmPassword) {
    errors.confirmPassword = "Please confirm your password."
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match."
  }

  // Terms and Privacy acknowledgement
  if (!data.termsAccepted) {
    errors.termsAccepted = "You must acknowledge the terms and community privacy guidelines to register."
  }

  const isValid = Object.keys(errors).length === 0
  return { isValid, errors }
}

export type LoginFormData = {
  email: string
  password: string
}

export type LoginErrors = {
  email?: string
  password?: string
}

export function validateLoginForm(
  data: LoginFormData,
  config: EmailValidationConfig = DEFAULT_EMAIL_CONFIG,
): { isValid: boolean; errors: LoginErrors } {
  const errors: LoginErrors = {}

  const emailResult = validateEmail(data.email, config)
  if (!emailResult.isValid) {
    errors.email = emailResult.error
  }

  if (!data.password) {
    errors.password = "Password is required."
  }

  const isValid = Object.keys(errors).length === 0
  return { isValid, errors }
}

export function validateForgotPasswordForm(
  email: string,
  config: EmailValidationConfig = DEFAULT_EMAIL_CONFIG,
): { isValid: boolean; error?: string } {
  return validateEmail(email, config)
}

export type ResetPasswordFormData = {
  password: string
  confirmPassword: string
}

export type ResetPasswordErrors = {
  password?: string
  confirmPassword?: string
}

export function validateResetPasswordForm(data: ResetPasswordFormData): {
  isValid: boolean
  errors: ResetPasswordErrors
} {
  const errors: ResetPasswordErrors = {}

  const passwordResult = validatePassword(data.password)
  if (!passwordResult.isValid) {
    errors.password = passwordResult.error
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = "Please confirm your new password."
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match."
  }

  const isValid = Object.keys(errors).length === 0
  return { isValid, errors }
}
