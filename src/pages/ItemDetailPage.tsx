import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import Button from "../components/common/Button"
import Icon from "../components/common/Icon"
import Status from "../components/common/Status"
import { useApp } from "../context/AppContext"
import { dateOffset, displayDate, getUserRatingStats, userFor } from "../store"

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, currentUser, submitBorrowRequest } = useApp()

  const item = data.items.find((candidate) => candidate.id === id)

  const [from, setFrom] = useState(dateOffset(1))
  const [until, setUntil] = useState(dateOffset(2))
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  if (!item) {
    return (
      <main className="page">
        <div className="empty" style={{ margin: "60px auto", maxWidth: 540 }}>
          <span className="empty-orbit">
            <Icon name="box" size={32} />
          </span>
          <span className="eyebrow" style={{ color: "var(--amber-hover)" }}>
            Item Not Found
          </span>
          <h2>We couldn&apos;t find that item</h2>
          <p>
            The item you requested (ID: <code>{id}</code>) does not exist, may
            have been unlisted, or the link might be misspelled.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginTop: 16,
            }}
          >
            <Button variant="primary" to="/discover">
              Browse Shared Items <Icon name="arrow" size={16} />
            </Button>
            <Button variant="secondary" to="/">
              Back to Home
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const owner = userFor(data, item.ownerId)
  const ownItem = item.ownerId === currentUser.id
  const ownerStats = getUserRatingStats(data, owner.id)

  const send = () => {
    setBusy(true)
    setError("")
    const result = submitBorrowRequest({
      itemId: item.id,
      borrowerId: currentUser.id,
      requestedFrom: from,
      requestedUntil: until,
      message: message.trim(),
    })
    setBusy(false)
    if (!result.ok) return setError(result.error)
    setDone(true)
  }

  if (done) {
    return (
      <main className="page success-page">
        <div className="success-mark">
          <Icon name="check" size={36} />
        </div>
        <span className="eyebrow">Request Submitted</span>
        <h1>Sent to {owner.name.split(" ")[0]}</h1>
        <p>
          Your request has been stored in local demo state. Switch to{" "}
          {owner.name} in the top-right demo menu to approve or decline it.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Button to="/activity">
            View in My Activity <Icon name="arrow" size={16} />
          </Button>
          <Button variant="secondary" to="/discover">
            Keep exploring
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="page detail-page">
      <Link to="/discover" className="back-link">
        ← Back to all items
      </Link>

      <div className="detail-layout">
        <div className="detail-image">
          <img src={item.image} alt={item.name} />
          <span className="photo-credit">
            Shared by {owner.name.split(" ")[0]} ({owner.hostel})
          </span>
        </div>

        <div className="detail-copy">
          <div className="item-meta">
            <span>{item.category}</span>
            <span>{item.condition} condition</span>
          </div>
          <Status status={item.availabilityStatus} />
          <h1>{item.name}</h1>
          <p className="description">{item.description}</p>

          <div className="owner-panel">
            <Link to={`/profile/${owner.id}`} className="owner-avatar-link">
              <span className="owner-avatar">{owner.avatar}</span>
            </Link>
            <div>
              <small>Lender profile</small>
              <Link to={`/profile/${owner.id}`} className="owner-name-link">
                <b>{owner.name}</b>
              </Link>
              <span>
                {owner.hostel} · Room {owner.roomNumber} ·{" "}
                {ownerStats.reviewCount > 0 ? (
                  <>
                    ★ {ownerStats.averageRating} ({ownerStats.reviewCount}{" "}
                    {ownerStats.reviewCount === 1 ? "review" : "reviews"})
                  </>
                ) : (
                  "New resident · 0 reviews"
                )}
              </span>
            </div>
            <Link
              to={`/profile/${owner.id}`}
              className="trusted"
              title={`View ${owner.name}'s verified reviews`}
            >
              <Icon name="shield" size={15} /> Verified Neighbour
            </Link>
          </div>

          <div className="borrow-box">
            <h3>Choose your borrowing window</h3>
            <p className="availability-copy">
              Owner&apos;s availability: {displayDate(item.availableFrom)} to{" "}
              {displayDate(item.availableUntil)}
            </p>

            <div className="field-pair">
              <label>
                Pick-up Date
                <input
                  type="date"
                  min={dateOffset(0)}
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label>
                Return By
                <input
                  type="date"
                  min={from}
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                />
              </label>
            </div>

            <label>
              Note to {owner.name.split(" ")[0]} <span>(Optional)</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi! I need this for tomorrow's lab session and will return it right after..."
              />
            </label>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <Button
              onClick={send}
              disabled={
                busy || ownItem || item.availabilityStatus !== "available"
              }
              className="wide"
            >
              {busy ? (
                "Submitting request…"
              ) : ownItem ? (
                "This is your listing"
              ) : item.availabilityStatus !== "available" ? (
                "Currently unavailable"
              ) : (
                <>
                  Request to borrow <Icon name="arrow" size={16} />
                </>
              )}
            </Button>
            <small>
              Submitting records a real demo request. It does not reserve the
              item until the owner approves.
            </small>
          </div>
        </div>
      </div>
    </main>
  )
}
