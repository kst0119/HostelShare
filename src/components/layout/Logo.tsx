import { Link } from "react-router-dom"

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label="HostelShare home">
      <span className="logo-mark" aria-hidden="true">
        <svg
          width="34"
          height="34"
          viewBox="0 0 34 34"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="34" height="34" rx="9" fill="var(--forest)" />
          <path
            d="M7 14L17 6.5L27 14"
            stroke="var(--amber)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12.5" cy="20.5" r="2.8" fill="var(--sage)" />
          <circle cx="21.5" cy="20.5" r="2.8" fill="var(--amber)" />
          <path
            d="M12.5 20.5C12.5 17.5 21.5 17.5 21.5 20.5"
            stroke="var(--sage)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="logo-text">
        Hostel<span>Share</span>
      </span>
    </Link>
  )
}
