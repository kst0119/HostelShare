import { Link, useLocation, useNavigate } from "react-router-dom"
import Logo from "./Logo"

export default function Footer() {
  const location = useLocation()
  const navigate = useNavigate()

  const scrollToSection = (id: string) => {
    if (location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    } else {
      navigate(`/#${id}`)
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }

  return (
    <footer>
      <div className="footer-top">
        <div>
          <Logo />
          <p>
            Peer-to-peer resource sharing for college hostel students. Spend
            less, share more, and build a connected, supportive campus
            community.
          </p>
        </div>
        <div>
          <b>Explore</b>
          <Link to="/discover">Browse shared items</Link>
          <Link to="/requirements">Requirements board</Link>
          <Link to="/list-item">List an item</Link>
          <button type="button" onClick={() => scrollToSection("activities")}>
            Activities
          </button>
        </div>
        <div>
          <b>Trust & Safety</b>
          <button type="button" onClick={() => scrollToSection("safety")}>
            Handover rules
          </button>
          <button type="button" onClick={() => scrollToSection("faq")}>
            Student FAQs
          </button>
          <Link to="/profile">Community standing</Link>
        </div>
        <div>
          <b>Project Status</b>
          <p
            style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}
          >
            HostelShare Phase 2 (Client-Side Routing & Architecture).
            Client-side interactive prototype.
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 HostelShare · Designed for campus living</span>
        <span>Made with React 19 & Tailwind CSS v4</span>
      </div>
    </footer>
  )
}
