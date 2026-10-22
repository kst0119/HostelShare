import Button from "../components/common/Button"
import Icon from "../components/common/Icon"

export default function NotFoundPage() {
  return (
    <main className="page">
      <div
        className="empty"
        style={{
          margin: "80px auto",
          maxWidth: 580,
          textAlign: "center",
          padding: "48px 24px",
        }}
      >
        <span className="empty-orbit">
          <Icon name="search" size={32} />
        </span>
        <span
          className="eyebrow"
          style={{
            color: "var(--amber-hover)",
            fontSize: "13px",
            letterSpacing: "0.08em",
            marginBottom: "8px",
            display: "inline-block",
          }}
        >
          404 · Page Not Found
        </span>
        <h1 style={{ fontSize: "2rem", marginBottom: "16px" }}>
          We couldn&apos;t find that page
        </h1>
        <p
          style={{
            fontSize: "15px",
            lineHeight: 1.6,
            color: "var(--charcoal-soft)",
            marginBottom: "28px",
          }}
        >
          The link you followed may be broken or the URL might be mistyped.
          Everything you need in HostelShare is easily accessible from the main
          sections below.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button variant="primary" to="/discover">
            Explore Shared Items <Icon name="arrow" size={16} />
          </Button>
          <Button variant="secondary" to="/">
            Back to Home
          </Button>
        </div>

        <div
          style={{
            marginTop: "36px",
            paddingTop: "24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            fontSize: "14px",
          }}
        >
          <Button variant="text" to="/activity">
            My Activity
          </Button>
          <Button variant="text" to="/list-item">
            List an Item
          </Button>
          <Button variant="text" to="/profile">
            My Profile
          </Button>
        </div>
      </div>
    </main>
  )
}
