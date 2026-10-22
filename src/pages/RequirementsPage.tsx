import { FormEvent, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import Button from "../components/common/Button"
import Icon from "../components/common/Icon"
import Status from "../components/common/Status"
import { useApp } from "../context/AppContext"
import {
  Category,
  dateOffset,
  displayDate,
  Requirement,
  RequirementOffer,
  userFor,
} from "../store"

export default function RequirementsPage() {
  const { id: urlSelectedId } = useParams<{ id?: string }>()
  const {
    data,
    currentUser,
    postRequirement,
    cancelUserRequirement,
    fulfillUserRequirement,
    submitRequirementOffer,
    decideOffer,
  } = useApp()

  // Filters & Search state
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [statusFilter, setStatusFilter] =
    useState<"All" | "open" | "fulfilled" | "cancelled">("open")
  const [myOnly, setMyOnly] = useState(false)
  const [sort, setSort] = useState<"newest" | "needed_soonest" | "title">(
    "newest",
  )

  // Modal / Form states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRequirementId, setSelectedRequirementId] =
    useState<string | null>(urlSelectedId || null)
  const [offeringRequirementId, setOfferingRequirementId] =
    useState<string | null>(null)

  // Create Requirement form state
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    category: "Study" as Category,
    neededBy: dateOffset(1),
    returnDate: dateOffset(3),
  })
  const [createError, setCreateError] = useState("")
  const [createBusy, setCreateBusy] = useState(false)

  // Offer form state
  const [offerForm, setOfferForm] = useState({
    selectedItemId: "",
    customItemName: "",
    message: "",
  })
  const [offerError, setOfferError] = useState("")
  const [offerBusy, setOfferBusy] = useState(false)

  const categories = [
    "All",
    "Study",
    "Electronics",
    "Everyday",
    "Sports",
    "Other",
  ]

  // Available items owned by current user for quick selection in offer
  const userAvailableItems = useMemo(() => {
    return data.items.filter(
      (item) =>
        item.ownerId === currentUser.id &&
        item.availabilityStatus === "available",
    )
  }, [data.items, currentUser.id])

  // Filtered requirements list
  const filteredRequirements = useMemo(() => {
    return data.requirements
      .filter((req) => {
        // Category filter
        if (category !== "All" && req.category !== category) return false

        // Status filter
        if (statusFilter !== "All" && req.status !== statusFilter) return false

        // My requirements only filter
        if (myOnly && req.authorId !== currentUser.id) return false

        // Search query filter (title, description, author name)
        if (query.trim()) {
          const author = userFor(data, req.authorId)
          const searchHaystack =
            `${req.title} ${req.description} ${req.category} ${author.name}`.toLowerCase()
          if (!searchHaystack.includes(query.toLowerCase())) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sort === "needed_soonest") {
          return a.neededBy.localeCompare(b.neededBy)
        }
        if (sort === "title") {
          return a.title.localeCompare(b.title)
        }
        // Newest first default
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [data, category, statusFilter, myOnly, query, sort, currentUser.id])

  // Selected requirement for detail view
  const activeRequirement = useMemo(() => {
    const targetId = selectedRequirementId || urlSelectedId
    if (!targetId) return null
    return data.requirements.find((req) => req.id === targetId) || null
  }, [data.requirements, selectedRequirementId, urlSelectedId])

  // Target requirement for making an offer
  const offeringRequirement = useMemo(() => {
    if (!offeringRequirementId) return null
    return (
      data.requirements.find((req) => req.id === offeringRequirementId) || null
    )
  }, [data.requirements, offeringRequirementId])

  // Handlers for creating a requirement
  const handleCreateSubmit = (event: FormEvent) => {
    event.preventDefault()
    setCreateError("")

    if (!createForm.title.trim() || createForm.title.trim().length < 3) {
      setCreateError("Please enter a title of at least 3 characters.")
      return
    }

    if (
      !createForm.description.trim() ||
      createForm.description.trim().length < 10
    ) {
      setCreateError(
        "Please provide a helpful description of at least 10 characters.",
      )
      return
    }

    if (!createForm.neededBy) {
      setCreateError("Please choose when you need this item.")
      return
    }

    if (createForm.neededBy < dateOffset(0)) {
      setCreateError("The date needed cannot be in the past.")
      return
    }

    if (createForm.returnDate && createForm.returnDate < createForm.neededBy) {
      setCreateError("Return date must be on or after the date needed.")
      return
    }

    setCreateBusy(true)
    const result = postRequirement({
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      category: createForm.category,
      authorId: currentUser.id,
      neededBy: createForm.neededBy,
      returnDate: createForm.returnDate || undefined,
    })
    setCreateBusy(false)

    if (!result.ok) {
      setCreateError(result.error)
      return
    }

    // Reset form and close modal
    setCreateForm({
      title: "",
      description: "",
      category: "Study",
      neededBy: dateOffset(1),
      returnDate: dateOffset(3),
    })
    setShowCreateModal(false)
  }

  // Handlers for submitting an offer
  const handleOfferSubmit = (event: FormEvent) => {
    event.preventDefault()
    setOfferError("")

    if (!offeringRequirement) return

    if (!offerForm.selectedItemId && !offerForm.customItemName.trim()) {
      setOfferError(
        "Select an item from your listings or enter the name of the item you can lend.",
      )
      return
    }

    if (!offerForm.message.trim() || offerForm.message.trim().length < 6) {
      setOfferError(
        "Please include a friendly note with your offer (at least 6 characters).",
      )
      return
    }

    setOfferBusy(true)
    const result = submitRequirementOffer(offeringRequirement.id, {
      itemId: offerForm.selectedItemId || undefined,
      itemName: offerForm.customItemName.trim() || undefined,
      message: offerForm.message.trim(),
      availableFrom: offeringRequirement.neededBy,
      availableUntil: offeringRequirement.returnDate,
    })
    setOfferBusy(false)

    if (!result.ok) {
      setOfferError(result.error)
      return
    }

    // Reset form and close offer modal
    setOfferForm({
      selectedItemId: "",
      customItemName: "",
      message: "",
    })
    setOfferingRequirementId(null)
  }

  return (
    <main className="page requirements-page">
      {/* 1. Header & Hero Bar */}
      <section className="discover-head">
        <div>
          <span className="eyebrow">Campus Needs & Requests</span>
          <h1>Requirements Board</h1>
          <p>
            Can&apos;t find what you need in Explore? Post a requirement and let
            hostel neighbours lend a hand.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div className="demo-banner">
            <Icon name="user" />
            <span>
              <b>Demo Mode Active</b>
              Browsing as {currentUser.name} ({currentUser.hostel})
            </span>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setCreateError("")
              setShowCreateModal(true)
            }}
          >
            <Icon name="plus" size={17} /> Post a Requirement
          </Button>
        </div>
      </section>

      {/* 2. Simulation Disclaimer Banner */}
      <div className="requirements-disclaimer">
        <Icon name="shield" size={18} />
        <div>
          <b>Client-Side Prototype (Phase 3A):</b> Requirements and offers are
          stored in your browser session via local storage. Data does not sync
          across different physical devices or remote backend servers.
        </div>
      </div>

      {/* 3. Search Bar */}
      <section className="search-wrap">
        <Icon name="search" size={22} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by required item, description, or student name…"
          aria-label="Search requirements"
        />
        {query ? (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <Icon name="close" size={16} />
          </button>
        ) : (
          <kbd>Live Filter</kbd>
        )}
      </section>

      {/* 4. Filter Line */}
      <div className="filter-line">
        <div className="category-row">
          {categories.map((name) => (
            <button
              type="button"
              key={name}
              className={category === name ? "selected" : ""}
              onClick={() => setCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="status-filter-group">
          <label className="status-label">
            Status:
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "All" | "open" | "fulfilled" | "cancelled",
                )
              }
              aria-label="Filter requirements by status"
            >
              <option value="open">Open Only</option>
              <option value="All">All Statuses</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <label className="check-control">
            <input
              type="checkbox"
              checked={myOnly}
              onChange={(e) => setMyOnly(e.target.checked)}
            />
            My posts only
          </label>
        </div>
      </div>

      {/* 5. Results Count & Sort Bar */}
      <div className="results-bar">
        <p>
          <b>{filteredRequirements.length} requirements</b> found in campus
          community
        </p>
        <label>
          Sort by{" "}
          <select
            value={sort}
            onChange={(e) =>
              setSort(e.target.value as "newest" | "needed_soonest" | "title")
            }
          >
            <option value="newest">Newest first</option>
            <option value="needed_soonest">Needed soonest</option>
            <option value="title">A–Z Title</option>
          </select>
        </label>
      </div>

      {/* 6. Requirements Cards Grid */}
      {filteredRequirements.length ? (
        <div className="requirements-grid">
          {filteredRequirements.map((req) => {
            const author = userFor(data, req.authorId)
            const isOwner = req.authorId === currentUser.id
            const pendingOffersCount = req.offers.filter(
              (o) => o.status === "pending",
            ).length
            const userOffer = req.offers.find(
              (o) => o.offeredById === currentUser.id,
            )

            return (
              <article
                key={req.id}
                className={`requirement-card ${req.status}`}
              >
                <div className="req-header">
                  <div className="req-badges">
                    <Status status={req.status} />
                    <span className="req-category-tag">{req.category}</span>
                  </div>
                  <time className="req-created">
                    {new Date(req.createdAt).toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>

                <h2 className="req-title">
                  <button
                    type="button"
                    className="req-title-btn"
                    onClick={() => setSelectedRequirementId(req.id)}
                  >
                    {req.title}
                  </button>
                </h2>

                <p className="req-desc">{req.description}</p>

                <div className="req-dates-box">
                  <div className="req-date-item">
                    <Icon name="clock" size={15} />
                    <span>
                      <small>Needed by</small>
                      <b>{displayDate(req.neededBy)}</b>
                    </span>
                  </div>
                  {req.returnDate && (
                    <div className="req-date-item">
                      <Icon name="arrow" size={14} />
                      <span>
                        <small>Expected return</small>
                        <b>{displayDate(req.returnDate)}</b>
                      </span>
                    </div>
                  )}
                </div>

                <div className="req-author-bar">
                  <div className="req-author-info">
                    <span className="mini-avatar">{author.avatar}</span>
                    <div>
                      <b>{author.name}</b>
                      <small>
                        {author.hostel} · Room {author.roomNumber}
                      </small>
                    </div>
                  </div>

                  {req.offers.length > 0 && (
                    <span
                      className="req-offers-pill"
                      title={`${req.offers.length} total offers submitted`}
                    >
                      <Icon name="sparkles" size={13} />
                      {req.offers.length}{" "}
                      {req.offers.length === 1 ? "offer" : "offers"}
                    </span>
                  )}
                </div>

                {/* Offer feedback for current user */}
                {!isOwner && userOffer && (
                  <div className={`user-offer-feedback ${userOffer.status}`}>
                    <small>Your offer status:</small>
                    <Status status={userOffer.status} />
                  </div>
                )}

                {/* Action Footer */}
                <div className="req-actions">
                  <Button
                    variant="secondary"
                    className="req-btn-sm"
                    onClick={() => setSelectedRequirementId(req.id)}
                  >
                    View Details
                  </Button>

                  {isOwner ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {req.status === "open" && (
                        <>
                          <Button
                            variant="text"
                            className="req-btn-sm text-danger"
                            onClick={() => cancelUserRequirement(req.id)}
                            title="Cancel this requirement"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="amber"
                            className="req-btn-sm"
                            onClick={() => fulfillUserRequirement(req.id)}
                            title="Mark this requirement as fulfilled"
                          >
                            Mark Fulfilled
                          </Button>
                        </>
                      )}
                      {pendingOffersCount > 0 && req.status === "open" && (
                        <Button
                          variant="primary"
                          className="req-btn-sm"
                          onClick={() => setSelectedRequirementId(req.id)}
                        >
                          Review {pendingOffersCount}{" "}
                          {pendingOffersCount === 1 ? "Offer" : "Offers"}
                        </Button>
                      )}
                    </div>
                  ) : req.status === "open" ? (
                    <Button
                      variant="primary"
                      className="req-btn-sm"
                      disabled={!!userOffer && userOffer.status === "pending"}
                      onClick={() => {
                        setOfferError("")
                        setOfferForm({
                          selectedItemId: "",
                          customItemName: "",
                          message: "",
                        })
                        setOfferingRequirementId(req.id)
                      }}
                    >
                      {userOffer && userOffer.status === "pending"
                        ? "Offer Submitted"
                        : "Offer Item"}
                    </Button>
                  ) : (
                    <span className="req-closed-note">
                      {req.status === "fulfilled"
                        ? "Need fulfilled"
                        : "Requirement closed"}
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="empty">
          <span className="empty-orbit">
            <Icon name="search" size={28} />
          </span>
          <h2>No requirements found</h2>
          <p>
            {query || category !== "All" || statusFilter !== "open" || myOnly
              ? "Try clearing or adjusting your search filters to view more campus posts."
              : "No campus requirements have been posted yet. Be the first to post what you need!"}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("")
                setCategory("All")
                setStatusFilter("open")
                setMyOnly(false)
              }}
            >
              Clear all filters
            </Button>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Icon name="plus" size={16} /> Post a Requirement
            </Button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: Create Requirement Modal
          ========================================================================= */}
      {showCreateModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setShowCreateModal(false)
          }
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-req-title"
            style={{ maxWidth: 560 }}
          >
            <button
              className="modal-close"
              onClick={() => setShowCreateModal(false)}
              aria-label="Close dialog"
            >
              <Icon name="close" />
            </button>

            <form onSubmit={handleCreateSubmit}>
              <span className="eyebrow">Campus Sharing Board</span>
              <h2 id="create-req-title">Post a Requirement</h2>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  margin: "4px 0 16px",
                }}
              >
                Posting as <b>{currentUser.name}</b> ({currentUser.hostel} ·
                Room {currentUser.roomNumber}). Neighbours in your hostel can
                offer matching items.
              </p>

              <label>
                What item do you need?
                <input
                  required
                  autoFocus
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, title: e.target.value })
                  }
                  placeholder="e.g. TI-84 Plus Graphing Calculator, Badminton racquets, HDMI adapter"
                />
              </label>

              <div className="field-pair">
                <label>
                  Category
                  <select
                    value={createForm.category}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        category: e.target.value as Category,
                      })
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
                  Date Needed By
                  <input
                    type="date"
                    required
                    min={dateOffset(0)}
                    value={createForm.neededBy}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, neededBy: e.target.value })
                    }
                  />
                </label>
              </div>

              <label>
                Estimated Return Date{" "}
                <span style={{ fontWeight: 400, color: "var(--muted)" }}>
                  (Optional)
                </span>
                <input
                  type="date"
                  min={createForm.neededBy || dateOffset(0)}
                  value={createForm.returnDate}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, returnDate: e.target.value })
                  }
                />
              </label>

              <label>
                Description & Context
                <textarea
                  required
                  minLength={10}
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Explain what specific model/condition is required, what class or event it is for, and when you can return it..."
                  rows={4}
                />
              </label>

              {createError && (
                <p
                  className="form-error"
                  role="alert"
                  style={{ marginTop: 12 }}
                >
                  {createError}
                </p>
              )}

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <Button
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createBusy}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={createBusy}>
                  {createBusy ? "Publishing…" : "Post Requirement"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: View Requirement Details & Offers Modal
          ========================================================================= */}
      {activeRequirement && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setSelectedRequirementId(null)
          }
        >
          <section
            className="modal req-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-req-title"
            style={{ maxWidth: 680, maxHeight: "90vh", overflowY: "auto" }}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedRequirementId(null)}
              aria-label="Close details"
            >
              <Icon name="close" />
            </button>

            <div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Status status={activeRequirement.status} />
                <span className="req-category-tag">
                  {activeRequirement.category}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    marginLeft: "auto",
                  }}
                >
                  Posted on{" "}
                  {displayDate(activeRequirement.createdAt.slice(0, 10))}
                </span>
              </div>

              <h2
                id="detail-req-title"
                style={{ fontSize: 24, marginBottom: 12 }}
              >
                {activeRequirement.title}
              </h2>

              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "var(--charcoal)",
                  marginBottom: 20,
                }}
              >
                {activeRequirement.description}
              </p>

              {/* Timing & Dates */}
              <div className="detail-dates-strip">
                <div>
                  <small>Needed By</small>
                  <b>{displayDate(activeRequirement.neededBy)}</b>
                </div>
                {activeRequirement.returnDate && (
                  <div>
                    <small>Expected Return</small>
                    <b>{displayDate(activeRequirement.returnDate)}</b>
                  </div>
                )}
                <div>
                  <small>Current Status</small>
                  <b style={{ textTransform: "capitalize" }}>
                    {activeRequirement.status}
                  </b>
                </div>
              </div>

              {/* Requester Profile Panel */}
              {(() => {
                const author = userFor(data, activeRequirement.authorId)
                const isOwner = activeRequirement.authorId === currentUser.id
                return (
                  <div className="owner-panel" style={{ margin: "20px 0" }}>
                    <span className="owner-avatar">{author.avatar}</span>
                    <div>
                      <small>Requested by</small>
                      <b>
                        {author.name} {isOwner && "(You)"}
                      </b>
                      <span>
                        {author.hostel} · Room {author.roomNumber} ·{" "}
                        {author.rating} community rating
                      </span>
                    </div>
                    {isOwner && activeRequirement.status === "open" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button
                          variant="text"
                          className="req-btn-sm text-danger"
                          onClick={() => {
                            cancelUserRequirement(activeRequirement.id)
                            setSelectedRequirementId(null)
                          }}
                        >
                          Cancel Post
                        </Button>
                        <Button
                          variant="amber"
                          className="req-btn-sm"
                          onClick={() => {
                            fulfillUserRequirement(activeRequirement.id)
                            setSelectedRequirementId(null)
                          }}
                        >
                          Mark Fulfilled
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Offers Section */}
              <div className="req-offers-section">
                <div className="subhead" style={{ marginBottom: 14 }}>
                  <h3 style={{ fontSize: 18, margin: 0 }}>
                    Offers ({activeRequirement.offers.length})
                  </h3>
                  <span>
                    {activeRequirement.status === "open"
                      ? "Neighbours willing to lend"
                      : "Archived offers"}
                  </span>
                </div>

                {activeRequirement.offers.length > 0 ? (
                  <div className="offers-list">
                    {activeRequirement.offers.map((offer: RequirementOffer) => {
                      const offerer = userFor(data, offer.offeredById)
                      const isOwner =
                        activeRequirement.authorId === currentUser.id
                      const isOfferer = offer.offeredById === currentUser.id
                      const catalogItem = offer.itemId
                        ? data.items.find((i) => i.id === offer.itemId)
                        : null

                      return (
                        <div
                          key={offer.id}
                          className={`offer-card ${offer.status}`}
                        >
                          <div className="offer-header">
                            <div className="offer-offerer">
                              <span className="mini-avatar">
                                {offerer.avatar}
                              </span>
                              <div>
                                <b>
                                  {offerer.name} {isOfferer && "(You)"}
                                </b>
                                <small>
                                  {offerer.hostel} · Room {offerer.roomNumber}
                                </small>
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                              }}
                            >
                              <Status status={offer.status} />
                              <time
                                style={{ fontSize: 11, color: "var(--muted)" }}
                              >
                                {displayDate(offer.createdAt.slice(0, 10))}
                              </time>
                            </div>
                          </div>

                          <div className="offer-body">
                            <div className="offer-item-badge">
                              <Icon name="box" size={14} />
                              <span>
                                Offered: <strong>{offer.itemName}</strong>
                              </span>
                            </div>
                            {catalogItem && (
                              <Link
                                to={`/items/${catalogItem.id}`}
                                className="offer-catalog-link"
                                target="_blank"
                                rel="noreferrer"
                              >
                                View listed item details →
                              </Link>
                            )}
                            <p className="offer-msg">
                              &ldquo;{offer.message}&rdquo;
                            </p>
                          </div>

                          {/* Owner Decision Controls */}
                          {isOwner &&
                            activeRequirement.status === "open" &&
                            offer.status === "pending" && (
                              <div className="offer-actions">
                                <Button
                                  variant="secondary"
                                  className="req-btn-sm"
                                  onClick={() =>
                                    decideOffer(
                                      activeRequirement.id,
                                      offer.id,
                                      "declined",
                                    )
                                  }
                                >
                                  Decline
                                </Button>
                                <Button
                                  variant="primary"
                                  className="req-btn-sm"
                                  onClick={() => {
                                    decideOffer(
                                      activeRequirement.id,
                                      offer.id,
                                      "accepted",
                                    )
                                    setSelectedRequirementId(null)
                                  }}
                                >
                                  <Icon name="check" size={14} /> Accept Offer &
                                  Reserve
                                </Button>
                              </div>
                            )}

                          {offer.status === "accepted" && (
                            <div className="offer-accepted-banner">
                              <Icon name="check" size={16} />
                              <span>
                                This offer was accepted. An active transaction
                                has been initialized in My Activity for physical
                                common-area handover.
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="small-empty">
                    <Icon name="clock" />
                    <span>
                      <b>No offers submitted yet.</b> When campus neighbours
                      express interest, their offers will appear here for
                      review.
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons at bottom of modal */}
              <div className="modal-actions" style={{ marginTop: 24 }}>
                <Button
                  variant="secondary"
                  onClick={() => setSelectedRequirementId(null)}
                >
                  Close
                </Button>
                {activeRequirement.authorId !== currentUser.id &&
                  activeRequirement.status === "open" && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        const targetId = activeRequirement.id
                        setSelectedRequirementId(null)
                        setOfferError("")
                        setOfferForm({
                          selectedItemId: "",
                          customItemName: "",
                          message: "",
                        })
                        setOfferingRequirementId(targetId)
                      }}
                    >
                      Make an Offer
                    </Button>
                  )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: Submit Offer Modal
          ========================================================================= */}
      {offeringRequirement && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setOfferingRequirementId(null)
          }
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-modal-title"
            style={{ maxWidth: 560 }}
          >
            <button
              className="modal-close"
              onClick={() => setOfferingRequirementId(null)}
              aria-label="Close dialog"
            >
              <Icon name="close" />
            </button>

            <form onSubmit={handleOfferSubmit}>
              <span className="eyebrow">Lend to a Neighbour</span>
              <h2 id="offer-modal-title">Offer an Item</h2>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  margin: "4px 0 16px",
                }}
              >
                Offering to{" "}
                <b>{userFor(data, offeringRequirement.authorId).name}</b> for:{" "}
                <strong>&ldquo;{offeringRequirement.title}&rdquo;</strong>
              </p>

              {userAvailableItems.length > 0 && (
                <label>
                  Choose from your listed cupboard{" "}
                  <span style={{ fontWeight: 400, color: "var(--muted)" }}>
                    (Optional)
                  </span>
                  <select
                    value={offerForm.selectedItemId}
                    onChange={(e) => {
                      const selected = userAvailableItems.find(
                        (i) => i.id === e.target.value,
                      )
                      setOfferForm({
                        ...offerForm,
                        selectedItemId: e.target.value,
                        customItemName: selected
                          ? selected.name
                          : offerForm.customItemName,
                      })
                    }}
                  >
                    <option value="">— Select an existing listed item —</option>
                    {userAvailableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.condition})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                Item Name / Model
                <input
                  required
                  value={offerForm.customItemName}
                  onChange={(e) =>
                    setOfferForm({
                      ...offerForm,
                      customItemName: e.target.value,
                    })
                  }
                  placeholder="e.g. Casio scientific calculator FX-991ES or 5m Cat6 cable"
                />
              </label>

              <label>
                Note to{" "}
                {userFor(data, offeringRequirement.authorId).name.split(" ")[0]}
                <textarea
                  required
                  minLength={6}
                  value={offerForm.message}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, message: e.target.value })
                  }
                  placeholder="Tell them about the item, condition, and where/when in the hostel you can hand it over..."
                  rows={4}
                />
              </label>

              <div className="offer-timing-preview">
                <Icon name="clock" size={15} />
                <span>
                  Needed from:{" "}
                  <b>{displayDate(offeringRequirement.neededBy)}</b>
                  {offeringRequirement.returnDate
                    ? ` to ${displayDate(offeringRequirement.returnDate)}`
                    : " (Short-term borrow)"}
                </span>
              </div>

              {offerError && (
                <p
                  className="form-error"
                  role="alert"
                  style={{ marginTop: 12 }}
                >
                  {offerError}
                </p>
              )}

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <Button
                  variant="secondary"
                  onClick={() => setOfferingRequirementId(null)}
                  disabled={offerBusy}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={offerBusy}>
                  {offerBusy ? "Sending Offer…" : "Send Offer"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
