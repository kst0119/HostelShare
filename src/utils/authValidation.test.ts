import { describe, expect, it } from "vitest"
import {
  DEFAULT_EMAIL_CONFIG,
  validateEmail,
  validateForgotPasswordForm,
  validateLoginForm,
  validatePassword,
  validateResetPasswordForm,
  validateSignUpForm,
} from "./authValidation"

describe("Email Validation", () => {
  it("rejects empty or whitespace email", () => {
    expect(validateEmail("").isValid).toBe(false)
    expect(validateEmail("   ").isValid).toBe(false)
    expect(validateEmail("").error).toBe("Student email address is required.")
  })

  it("rejects malformed email addresses", () => {
    expect(validateEmail("notanemail").isValid).toBe(false)
    expect(validateEmail("student@").isValid).toBe(false)
    expect(validateEmail("@college.edu").isValid).toBe(false)
    expect(validateEmail("student@college").isValid).toBe(false)
  })

  it("accepts valid general student email format by default", () => {
    expect(validateEmail("resident@campus.edu").isValid).toBe(true)
    expect(validateEmail("student123@university.ac.in").isValid).toBe(true)
  })

  it("respects configurable institutional domain check when enabled", () => {
    const config = {
      requireInstitutionalDomain: true,
      allowedDomains: ["college.edu", "hostel.ac.in"],
    }

    expect(validateEmail("student@college.edu", config).isValid).toBe(true)
    expect(validateEmail("student@hostel.ac.in", config).isValid).toBe(true)
    expect(validateEmail("student@gmail.com", config).isValid).toBe(false)
    expect(validateEmail("student@gmail.com", config).error).toContain(
      "Please use your official college email",
    )
  })
})

describe("Password Policy & Checklist Validation", () => {
  it("marks empty password as invalid with empty strength", () => {
    const res = validatePassword("")
    expect(res.isValid).toBe(false)
    expect(res.strength).toBe("empty")
    expect(res.passedCount).toBe(0)
    expect(res.error).toBe("Password is required.")
  })

  it("checks minimum 8 characters rule", () => {
    const res = validatePassword("Ab1!")
    expect(res.checks.hasMinLength).toBe(false)
    expect(res.isValid).toBe(false)
  })

  it("checks uppercase letter rule", () => {
    const res = validatePassword("lowercase123!")
    expect(res.checks.hasUppercase).toBe(false)
    expect(res.isValid).toBe(false)
  })

  it("checks lowercase letter rule", () => {
    const res = validatePassword("UPPERCASE123!")
    expect(res.checks.hasLowercase).toBe(false)
    expect(res.isValid).toBe(false)
  })

  it("checks number requirement", () => {
    const res = validatePassword("UppercaseOnly!")
    expect(res.checks.hasNumber).toBe(false)
    expect(res.isValid).toBe(false)
  })

  it("checks special character requirement", () => {
    const res = validatePassword("Uppercase1234")
    expect(res.checks.hasSpecialChar).toBe(false)
    expect(res.isValid).toBe(false)
  })

  it("assigns correct strength ratings", () => {
    // 2 checks passed -> weak
    expect(validatePassword("abc").strength).toBe("weak")
    // 3 checks passed -> fair
    expect(validatePassword("abcdefgh1").strength).toBe("fair")
    // 4 checks passed -> good
    expect(validatePassword("Abcdefgh1").strength).toBe("good")
    // 5 checks passed -> strong & valid
    const strong = validatePassword("Abcdefgh1!")
    expect(strong.strength).toBe("strong")
    expect(strong.isValid).toBe(true)
    expect(strong.error).toBeUndefined()
  })
})

describe("SignUp Form Validation", () => {
  const validData = {
    fullName: "Aisha Singh",
    email: "aisha@college.edu",
    password: "Password123!",
    confirmPassword: "Password123!",
    termsAccepted: true,
  }

  it("passes when all fields are valid", () => {
    const res = validateSignUpForm(validData)
    expect(res.isValid).toBe(true)
    expect(Object.keys(res.errors).length).toBe(0)
  })

  it("validates full name requirement and length", () => {
    expect(validateSignUpForm({ ...validData, fullName: "" }).errors.fullName).toBe(
      "Full name is required.",
    )
    expect(
      validateSignUpForm({ ...validData, fullName: "A" }).errors.fullName,
    ).toBe("Please enter your full name (at least 2 characters).")
  })

  it("validates password match", () => {
    const res = validateSignUpForm({
      ...validData,
      confirmPassword: "DifferentPassword123!",
    })
    expect(res.isValid).toBe(false)
    expect(res.errors.confirmPassword).toBe("Passwords do not match.")
  })

  it("validates terms acknowledgement requirement", () => {
    const res = validateSignUpForm({ ...validData, termsAccepted: false })
    expect(res.isValid).toBe(false)
    expect(res.errors.termsAccepted).toContain("You must acknowledge the terms")
  })
})

describe("Login Form Validation", () => {
  it("rejects empty fields", () => {
    const res = validateLoginForm({ email: "", password: "" })
    expect(res.isValid).toBe(false)
    expect(res.errors.email).toBeDefined()
    expect(res.errors.password).toBe("Password is required.")
  })

  it("passes with valid email and password provided", () => {
    const res = validateLoginForm({
      email: "resident@college.edu",
      password: "SomePassword123!",
    })
    expect(res.isValid).toBe(true)
  })
})

describe("Reset Password Form Validation", () => {
  it("rejects mismatched passwords", () => {
    const res = validateResetPasswordForm({
      password: "Password123!",
      confirmPassword: "MismatchPassword123!",
    })
    expect(res.isValid).toBe(false)
    expect(res.errors.confirmPassword).toBe("Passwords do not match.")
  })

  it("rejects weak new password", () => {
    const res = validateResetPasswordForm({
      password: "weak",
      confirmPassword: "weak",
    })
    expect(res.isValid).toBe(false)
    expect(res.errors.password).toBeDefined()
  })

  it("accepts valid matching new password", () => {
    const res = validateResetPasswordForm({
      password: "ValidNewPass123!",
      confirmPassword: "ValidNewPass123!",
    })
    expect(res.isValid).toBe(true)
    expect(Object.keys(res.errors).length).toBe(0)
  })
})
