import { CSSProperties, ReactNode } from "react"
import { Link } from "react-router-dom"

export default function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled,
  className = "",
  to,
  style,
  title,
}: {
  children: ReactNode
  variant?: "primary" | "secondary" | "text" | "dark" | "amber"
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
  className?: string
  to?: string
  style?: CSSProperties
  title?: string
}) {
  const combinedClasses = `btn btn-${variant} ${className}`.trim()

  if (to && !disabled) {
    return (
      <Link
        to={to}
        className={combinedClasses}
        onClick={onClick}
        style={style}
        title={title}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      className={combinedClasses}
      onClick={onClick}
      type={type}
      disabled={disabled}
      style={style}
      title={title}
    >
      {children}
    </button>
  )
}
