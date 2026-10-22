import { useApp } from "../../context/AppContext"
import Icon from "../common/Icon"

export default function ThemeToggle({
  theme: propTheme,
  toggleTheme: propToggleTheme,
}: {
  theme?: "light" | "dark"
  toggleTheme?: () => void
} = {}) {
  const context = useApp()
  const theme = propTheme || context.theme
  const toggleTheme = propToggleTheme || context.toggleTheme

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <Icon name={isDark ? "sun" : "moon"} size={18} />
    </button>
  )
}
