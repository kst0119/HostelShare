import { useEffect } from "react"
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom"
import Layout from "./components/layout/Layout"
import AppProvider from "./context/AppContext"
import ActivityPage from "./pages/ActivityPage"
import DiscoverPage from "./pages/DiscoverPage"
import HomePage from "./pages/HomePage"
import ItemDetailPage from "./pages/ItemDetailPage"
import ListItemPage from "./pages/ListItemPage"
import NotFoundPage from "./pages/NotFoundPage"
import ProfilePage from "./pages/ProfilePage"
import RequirementsPage from "./pages/RequirementsPage"
import TransactionPage from "./pages/TransactionPage"
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage"
import LoginPage from "./pages/auth/LoginPage"
import SignUpPage from "./pages/auth/SignUpPage"
import VerificationPendingPage from "./pages/auth/VerificationPendingPage"

function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.slice(1))
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" })
        }, 60)
        return
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [pathname, hash])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/requirements" element={<RequirementsPage />} />
            <Route path="/requirements/:id" element={<RequirementsPage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
            <Route
              path="/items"
              element={<Navigate to="/discover" replace />}
            />
            <Route path="/list-item" element={<ListItemPage />} />
            <Route
              path="/list"
              element={<Navigate to="/list-item" replace />}
            />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/transactions/:id" element={<TransactionPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/verification-pending"
              element={<VerificationPendingPage />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}
