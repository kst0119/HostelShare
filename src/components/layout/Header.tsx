import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useApp } from "../../context/AppContext"
import Button from "../common/Button"
import Icon from "../common/Icon"
import Logo from "./Logo"
import ThemeToggle from "./ThemeToggle"

export default function Header() {
  const [open, setOpen] = useState(false)
  const [noticesOpen, setNoticesOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const { data, currentUser, switchUser, openNotice, setDialog } = useApp()

  const notices = data.notices.filter(
    (notice) => notice.userId === currentUser.id,
  )
  const unread = notices.filter((notice) => !notice.read).length

  const isLanding = location.pathname === "/"

  const scrollToSection = (id: string) => {
    setOpen(false)
    if (isLanding) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    } else {
      navigate(`/#${id}`)
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }

  const handleNav = (path: string) => {
    navigate(path)
    setOpen(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const isExploreActive =
    location.pathname === "/discover" || location.pathname.startsWith("/items")
  const isRequirementsActive = location.pathname.startsWith("/requirements")
  const isActivityActive =
    location.pathname === "/activity" ||
    location.pathname.startsWith("/transactions")
  const isProfileActive = location.pathname === "/profile"

  return (
    <header className="site-header">
      <Logo />

      {isLanding ? (
        <nav
          className={open ? "nav open" : "nav"}
          aria-label="Public landing navigation"
        >
          <button type="button" onClick={() => scrollToSection("activities")}>
            Activities
          </button>
          <button type="button" onClick={() => scrollToSection("how-it-works")}>
            How It Works
          </button>
          <button type="button" onClick={() => scrollToSection("safety")}>
            Safety
          </button>
          <button type="button" onClick={() => scrollToSection("faq")}>
            FAQs
          </button>
          <Link to="/discover" onClick={() => setOpen(false)}>
            Explore Items
          </Link>
          <Link to="/requirements" onClick={() => setOpen(false)}>
            Requirements
          </Link>

          <div className="nav-actions">
            <ThemeToggle />
            <Button
              variant="secondary"
              to="/login"
              onClick={() => setOpen(false)}
            >
              Log In
            </Button>
            <Button
              variant="primary"
              to="/signup"
              onClick={() => setOpen(false)}
            >
              Sign Up <Icon name="arrow" size={16} />
            </Button>
            <Button
              variant="amber"
              onClick={() => handleNav("/discover")}
              className="demo-nav-btn"
            >
              Demo Catalog
            </Button>
            <label
              className="demo-switcher"
              title="Switch sample student profile for testing"
            >
              <span>Demo Persona</span>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  switchUser(e.target.value)
                  setOpen(false)
                }}
                aria-label="Switch demo student profile"
              >
                {data.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </nav>
      ) : (
        <nav
          className={open ? "nav open" : "nav"}
          aria-label="Primary application navigation"
        >
          <Link
            to="/discover"
            className={isExploreActive ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            Explore
          </Link>
          <Link
            to="/requirements"
            className={isRequirementsActive ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            Requirements
          </Link>
          <Link
            to="/activity"
            className={isActivityActive ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            My activity
          </Link>
          <Link
            to="/profile"
            className={isProfileActive ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Button variant="dark" to="/list-item" onClick={() => setOpen(false)}>
            <Icon name="plus" size={17} /> List an item
          </Button>

          <ThemeToggle />

          <div className="notice-wrap">
            <button
              type="button"
              className="notice-button"
              onClick={() => setNoticesOpen(!noticesOpen)}
              aria-label={`${unread} unread notifications`}
              aria-expanded={noticesOpen}
            >
              <Icon name="bell" />
              {unread > 0 && <i>{unread}</i>}
            </button>
            {noticesOpen && (
              <div className="notice-menu">
                <b>Notifications</b>
                {notices.length ? notices.slice(0, 5).map((notice) => (
                    <button
                      type="button"
                      className={notice.read ? "" : "unread"}
                      key={notice.id}
                      onClick={() => {
                        openNotice(notice.id)
                        setNoticesOpen(false)
                      }}
                    >
                      <span>{notice.text}</span>
                      <small>
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </small>
                    </button>
                  )) : <p>No updates yet.</p>}
              </div>
            )}
          </div>

          <label className="demo-switcher">
            <span>Demo User · Simulated</span>
            <select
              value={currentUser.id}
              onChange={(event) => switchUser(event.target.value)}
              aria-label="Switch demo user"
            >
              {data.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
        </nav>
      )}

      <button
        type="button"
        className="menu-btn"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation menu"
      >
        <Icon name={open ? "close" : "menu"} />
      </button>
    </header>
  )
}
