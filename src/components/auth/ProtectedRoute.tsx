import { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

type ProtectedRouteProps = {
  children: ReactNode
}

/**
 * Route guard that requires an active Supabase authenticated session.
 * Displays an accessible loading indicator while the auth session resolves.
 * Keeps demo mode completely distinct — demo personas do not bypass real route protection.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div
        className="auth-page"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            className="loading-spinner"
            style={{
              width: "40px",
              height: "40px",
              margin: "0 auto 16px",
              border: "3px solid var(--border)",
              borderTopColor: "var(--forest)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Resolving resident session…
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
