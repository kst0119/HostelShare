import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import Button from "../components/common/Button"
import Icon from "../components/common/Icon"
import Status from "../components/common/Status"
import { useApp } from "../context/AppContext"
import {
  AvailabilityStatus,
  Category,
  dateOffset,
  displayDate,
  getUserRatingStats,
  userFor,
} from "../store"

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    data,
    currentUser,
    submitBorrowRequest,
    updateItemListing,
    deleteItemListing,
    itemsLoading,
  } = useApp()

  const item = data.items.find((candidate) => candidate.id === id)

  const [from, setFrom] = useState(dateOffset(1))
  const [until, setUntil] = useState(dateOffset(2))
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  // Owner listing management state
  const [isEditing, setIsEditing] = useState(false)
  const [editBusy, setEditBusy] = useState(false)
  const [editError, setEditError] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "Study" as Category,
    condition: "Great",
    image: "",
    availabilityStatus: "available" as AvailabilityStatus,
    availableFrom: dateOffset(0),
    availableUntil: dateOffset(30),
  })

  if (itemsLoading && !item) {
    return (
      <main className="page">
        <div className="empty" style={{ margin: "60px auto", maxWidth: 540 }}>
          <span className="empty-orbit">
            <Icon name="box" size={32} />
          </span>
          <h2>Loading item details…</h2>
          <p>Fetching listing from the community catalog.</p>
        </div>
      </main>
    )
  }

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

  const handleOpenEdit = () => {
    setEditForm({
      name: item.name,
      description: item.description,
      category: item.category,
      condition: item.condition,
      image: item.image,
      availabilityStatus: item.availabilityStatus,
      availableFrom: item.availableFrom,
      availableUntil: item.availableUntil,
    })
    setEditError("")
    setIsEditing(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditBusy(true)
    setEditError("")
    const res = await updateItemListing(item.id, editForm)
    setEditBusy(false)
    if (!res.ok) {
      setEditError(res.error || "Failed to update item.")
      return
    }
    setIsEditing(false)
  }

  const handleDelete = async () => {
    setDeleteBusy(true)
    setDeleteError("")
    const res = await deleteItemListing(item.id)
    setDeleteBusy(false)
    if (!res.ok) {
      setDeleteError(res.error || "Failed to delete item.")
      return
    }
    setShowDeleteConfirm(false)
    navigate("/discover")
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

          {ownItem ? (
            <div className="borrow-box">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <span className="eyebrow" style={{ margin: 0 }}>
                  Your Listing
                </span>
                <Status status={item.availabilityStatus} />
              </div>
              <h3 style={{ margin: "4px 0 8px" }}>Manage Your Listing</h3>
              <p className="availability-copy">
                Availability window: {displayDate(item.availableFrom)} to{" "}
                {displayDate(item.availableUntil)}
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginTop: 18,
                }}
              >
                <Button
                  variant="primary"
                  onClick={handleOpenEdit}
                  className="wide"
                >
                  Edit Listing Details
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDeleteError("")
                    setShowDeleteConfirm(true)
                  }}
                  className="wide"
                  style={{
                    color: "var(--red, #e53e3e)",
                    borderColor: "var(--red, #e53e3e)",
                  }}
                >
                  Delete Listing
                </Button>
              </div>
              <small style={{ marginTop: 14 }}>
                You are the verified owner of this listing. Only you can modify
                or delete it.
              </small>
            </div>
          ) : (
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
                disabled={busy || item.availabilityStatus !== "available"}
                className="wide"
              >
                {busy ? (
                  "Submitting request…"
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
          )}
        </div>
      </div>

      {isEditing && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) =>
            e.target === e.currentTarget && !editBusy && setIsEditing(false)
          }
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-listing-title"
          >
            <button
              className="modal-close"
              onClick={() => !editBusy && setIsEditing(false)}
              aria-label="Close dialog"
            >
              <Icon name="close" />
            </button>
            <span className="eyebrow">Owner Settings</span>
            <h2 id="edit-listing-title">Edit Listing</h2>
            <form onSubmit={handleSaveEdit}>
              <label>
                Item Title
                <input
                  required
                  minLength={2}
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </label>

              <label>
                Description
                <textarea
                  required
                  minLength={10}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                />
              </label>

              <div className="field-pair">
                <label>
                  Category
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        category: e.target.value as Category,
                      }))
                    }
                  >
                    <option value="Study">Study</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Everyday">Everyday</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  Condition
                  <select
                    value={editForm.condition}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, condition: e.target.value }))
                    }
                  >
                    <option value="Like new">Like new</option>
                    <option value="Great">Great</option>
                    <option value="Good">Good</option>
                    <option value="Loved">Loved</option>
                  </select>
                </label>
              </div>

              <div className="field-pair">
                <label>
                  Availability Status
                  <select
                    value={editForm.availabilityStatus}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        availabilityStatus: e.target
                          .value as AvailabilityStatus,
                      }))
                    }
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="borrowed">Borrowed</option>
                  </select>
                </label>

                <label>
                  Photo URL
                  <input
                    type="url"
                    required
                    value={editForm.image}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, image: e.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="field-pair">
                <label>
                  Available From
                  <input
                    type="date"
                    required
                    value={editForm.availableFrom}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        availableFrom: e.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Available Until
                  <input
                    type="date"
                    required
                    min={editForm.availableFrom}
                    value={editForm.availableUntil}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        availableUntil: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              {editError && (
                <p className="form-error" role="alert">
                  {editError}
                </p>
              )}

              <div className="modal-actions">
                <Button
                  variant="secondary"
                  type="button"
                  disabled={editBusy}
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={editBusy}>
                  {editBusy ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) =>
            e.target === e.currentTarget &&
            !deleteBusy &&
            setShowDeleteConfirm(false)
          }
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <button
              className="modal-close"
              onClick={() => !deleteBusy && setShowDeleteConfirm(false)}
              aria-label="Close dialog"
            >
              <Icon name="close" />
            </button>
            <span className="eyebrow" style={{ color: "var(--red, #e53e3e)" }}>
              Remove Listing
            </span>
            <h2 id="delete-dialog-title">Delete {item.name}?</h2>
            <p style={{ marginTop: 8 }}>
              Are you sure you want to remove this item listing? It will no
              longer appear in the campus catalog.
            </p>
            {deleteError && (
              <p className="form-error" role="alert">
                {deleteError}
              </p>
            )}
            <div className="modal-actions" style={{ marginTop: 24 }}>
              <Button
                variant="secondary"
                disabled={deleteBusy}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={deleteBusy}
                onClick={handleDelete}
                style={{
                  background: "var(--red, #e53e3e)",
                  borderColor: "var(--red, #e53e3e)",
                }}
              >
                {deleteBusy ? "Deleting…" : "Delete Listing"}
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

