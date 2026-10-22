import { Outlet, useLocation } from "react-router-dom"
import { useApp } from "../../context/AppContext"
import Modal from "../common/Modal"
import Toast from "../common/Toast"
import Footer from "./Footer"
import Header from "./Header"

export default function Layout() {
  const location = useLocation()
  const { currentUser, flash, dismissFlash } = useApp()

  return (
    <div className="app">
      <Header />

      <div
        key={`${location.pathname}-${currentUser.id}`}
        className="page-enter"
      >
        <Outlet />
      </div>

      <Footer />

      <Toast flash={flash} dismiss={dismissFlash} />
      <Modal />
    </div>
  )
}
