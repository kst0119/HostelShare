import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Button from "../components/common/Button"
import Icon from "../components/common/Icon"
import SectionTitle from "../components/common/SectionTitle"
import Status from "../components/common/Status"
import { useApp } from "../context/AppContext"
import {
  AppData,
  displayDate,
  itemFor,
  Transaction,
  User,
  userFor,
} from "../store"

function History({
  data,
  transactions,
  currentUser,
}: {
  data: AppData
  transactions: Transaction[]
  currentUser: User
}) {
  return (
    <section className="full-history">
      <div className="subhead">
        <h2>Completed returns</h2>
        <span>{transactions.length} recorded</span>
      </div>
      {transactions.length ? (
        transactions.map((transaction) => {
          const item = itemFor(data, transaction.itemId)
          const borrower = userFor(data, transaction.borrowerId)
          const owner = userFor(data, transaction.ownerId)
          const isParticipant = [
            transaction.borrowerId,
            transaction.ownerId,
          ].includes(currentUser.id)
          const userReview = isParticipant
            ? (data.reviews || []).find(
                (r) =>
                  r.transactionId === transaction.id &&
                  r.reviewerId === currentUser.id,
              )
            : null

          return (
            <div key={transaction.id} className="history-item-row">
              <img src={item.image} alt={item.name} />
              <div className="history-item-info">
                <b>{item.name}</b>
                <small>
                  Exchanged between {borrower.name} and {owner.name}
                </small>
              </div>
              <time>
                {transaction.returnedAt
                  ? new Date(transaction.returnedAt).toLocaleDateString()
                  : ""}
              </time>
              <div className="history-action-group">
                {isParticipant &&
                  (userReview ? (
                    <span
                      className="history-reviewed-tag"
                      title="You reviewed this exchange"
                    >
                      <Icon name="star" size={13} fill="currentColor" />{" "}
                      {userReview.rating}★
                    </span>
                  ) : (
                    <Button
                      variant="amber"
                      to={`/transactions/${transaction.id}#review`}
                      className="history-rate-btn"
                    >
                      Rate ★
                    </Button>
                  ))}
                <Button
                  variant="text"
                  to={`/transactions/${transaction.id}`}
                  className="history-link-btn"
                >
                  Details
                </Button>
              </div>
            </div>
          )
        })
      ) : (
        <div className="empty">
          <h2>No completed exchanges yet</h2>
          <p>
            When items are returned and confirmed by both parties, they are
            safely archived here.
          </p>
        </div>
      )}
    </section>
  )
}

export default function ActivityPage() {
  const navigate = useNavigate()
  const { data, currentUser, decideBorrowRequest } = useApp()

  const [tab, setTab] =
    useState<"overview" | "borrowing" | "lending" | "history">("overview")

  const incoming = data.requests.filter(
    (request) =>
      request.ownerId === currentUser.id && request.status === "pending",
  )
  const sent = data.requests.filter(
    (request) =>
      request.borrowerId === currentUser.id && request.status === "pending",
  )
  const active = data.transactions.filter(
    (transaction) =>
      [transaction.ownerId, transaction.borrowerId].includes(currentUser.id) &&
      transaction.status !== "returned",
  )
  const history = data.transactions.filter(
    (transaction) =>
      [transaction.ownerId, transaction.borrowerId].includes(currentUser.id) &&
      transaction.status === "returned",
  )

  const showIncoming = tab === "overview" || tab === "lending"
  const showSent = tab === "overview" || tab === "borrowing"
  const filteredActive = active.filter((transaction) =>
    tab === "lending"
      ? transaction.ownerId === currentUser.id
      : tab === "borrowing"
        ? transaction.borrowerId === currentUser.id
        : true,
  )

  return (
    <main className="page activity-page">
      <SectionTitle
        eyebrow="Exchanges & Requests"
        aside={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="secondary" to="/requirements">
              Requirements Board <Icon name="arrow" size={15} />
            </Button>
            <Button variant="secondary" to="/discover">
              Find something <Icon name="search" size={15} />
            </Button>
          </div>
        }
      >
        My Activity
      </SectionTitle>

      <div className="activity-tabs" role="tablist">
        {(["overview", "borrowing", "lending", "history"] as const).map(
          (name) => (
            <button
              type="button"
              role="tab"
              aria-selected={tab === name}
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
              key={name}
            >
              {name[0].toUpperCase() + name.slice(1)}
            </button>
          ),
        )}
      </div>

      {tab === "history" ? (
        <History data={data} transactions={history} currentUser={currentUser} />
      ) : (
        <>
          {showIncoming && (
            <section className="incoming-section">
              <div className="subhead">
                <h2>Incoming requests for your items</h2>
                <span>{incoming.length} waiting</span>
              </div>
              {incoming.length ? (
                incoming.map((request) => {
                  const item = itemFor(data, request.itemId)
                  const borrower = userFor(data, request.borrowerId)
                  return (
                    <div className="request-row" key={request.id}>
                      <img src={item.image} alt="" />
                      <div className="request-main">
                        <span className="mini-avatar">{borrower.avatar}</span>
                        <p>
                          <b>{borrower.name}</b> ({borrower.hostel}) wants to
                          borrow <strong>{item.name}</strong>
                          <small>
                            Dates: {displayDate(request.requestedFrom)} —{" "}
                            {displayDate(request.requestedUntil)}
                            {request.message ? ` · “${request.message}”` : ""}
                          </small>
                        </p>
                      </div>
                      <div className="request-actions">
                        <Button
                          variant="secondary"
                          onClick={() =>
                            decideBorrowRequest(request.id, "rejected")
                          }
                        >
                          Decline
                        </Button>
                        <Button
                          onClick={() =>
                            decideBorrowRequest(request.id, "approved")
                          }
                        >
                          Approve <Icon name="check" size={15} />
                        </Button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="small-empty">
                  <Icon name="check" />
                  <span>
                    <b>No pending incoming requests.</b> When other students
                    request your items, they will appear here.
                  </span>
                </div>
              )}
            </section>
          )}

          <div className="activity-columns">
            <section>
              <div className="subhead">
                <h2>In motion (Active Loans)</h2>
                <span>{filteredActive.length} active</span>
              </div>
              {filteredActive.length ? (
                filteredActive.map((transaction) => {
                  const item = itemFor(data, transaction.itemId)
                  const other = userFor(
                    data,
                    transaction.ownerId === currentUser.id
                      ? transaction.borrowerId
                      : transaction.ownerId,
                  )
                  return (
                    <div className="motion-card" key={transaction.id}>
                      <div className="motion-top">
                        <img src={item.image} alt="" />
                        <Status status={transaction.status} />
                      </div>
                      <h3>{item.name}</h3>
                      <p>
                        {transaction.ownerId === currentUser.id
                          ? `Lent to ${other.name}`
                          : `Borrowed from ${other.name}`}
                      </p>
                      <div className="due">
                        <Icon name="clock" size={16} />
                        <span>
                          <small>Due date</small>
                          <b>{displayDate(transaction.dueAt)}</b>
                        </span>
                      </div>
                      <Button
                        variant="dark"
                        className="wide"
                        to={`/transactions/${transaction.id}`}
                      >
                        Open transaction flow <Icon name="arrow" size={15} />
                      </Button>
                    </div>
                  )
                })
              ) : (
                <div className="paper-note">
                  <span>Nothing currently in motion</span>
                  <h3>Active exchanges will appear here.</h3>
                  <Button variant="text" to="/discover">
                    Browse shared items <Icon name="arrow" size={15} />
                  </Button>
                </div>
              )}
            </section>

            <section>
              {showSent && (
                <>
                  <div className="subhead">
                    <h2>Sent requests</h2>
                    <span>{sent.length} pending</span>
                  </div>
                  {sent.length ? (
                    <div className="sent-list">
                      {sent.map((request) => (
                        <button
                          type="button"
                          key={request.id}
                          onClick={() => navigate(`/items/${request.itemId}`)}
                        >
                          <img
                            src={itemFor(data, request.itemId).image}
                            alt=""
                          />
                          <span>
                            <b>{itemFor(data, request.itemId).name}</b>
                            <small>
                              Waiting for {userFor(data, request.ownerId).name}{" "}
                              to reply
                            </small>
                          </span>
                          <Status status={request.status} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="small-empty">
                      <Icon name="clock" />
                      <span>
                        <b>No outgoing pending requests.</b> Use Explore to find
                        items you need.
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Requirements & Offers Section in Activity */}
              <div style={{ marginTop: 32 }}>
                <div className="subhead">
                  <h2>Your requirements & offers</h2>
                  <span>
                    {data.requirements.filter(
                      (r) => r.authorId === currentUser.id,
                    ).length +
                      data.requirements.flatMap((r) =>
                        r.offers.filter(
                          (o) => o.offeredById === currentUser.id,
                        ),
                      ).length}{" "}
                    total
                  </span>
                </div>
                {(() => {
                  const userReqs = data.requirements.filter(
                    (r) => r.authorId === currentUser.id,
                  )
                  const userOffers = data.requirements.flatMap((req) =>
                    req.offers
                      .filter((o) => o.offeredById === currentUser.id)
                      .map((offer) => ({ req, offer })),
                  )
                  if (!userReqs.length && !userOffers.length) {
                    return (
                      <div className="small-empty">
                        <Icon name="message" />
                        <span>
                          <b>No posted requirements or offers yet.</b> Visit the{" "}
                          <Button
                            variant="text"
                            to="/requirements"
                            style={{
                              padding: "0 4px",
                              minHeight: "auto",
                              textDecoration: "underline",
                            }}
                          >
                            Requirements Board
                          </Button>
                          .
                        </span>
                      </div>
                    )
                  }
                  return (
                    <div className="sent-list">
                      {userReqs.map((r) => (
                        <button
                          type="button"
                          key={r.id}
                          onClick={() => navigate(`/requirements/${r.id}`)}
                        >
                          <div
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: 6,
                              background: "var(--sage-light)",
                              display: "grid",
                              placeItems: "center",
                              color: "var(--forest)",
                            }}
                          >
                            <Icon name="message" size={22} />
                          </div>
                          <span>
                            <b>{r.title}</b>
                            <small>
                              {r.offers.length}{" "}
                              {r.offers.length === 1 ? "offer" : "offers"} ·
                              Needed {displayDate(r.neededBy)}
                            </small>
                          </span>
                          <Status status={r.status} />
                        </button>
                      ))}
                      {userOffers.map(({ req, offer }) => (
                        <button
                          type="button"
                          key={offer.id}
                          onClick={() => navigate(`/requirements/${req.id}`)}
                        >
                          <div
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: 6,
                              background: "var(--amber-subtle)",
                              display: "grid",
                              placeItems: "center",
                              color: "var(--amber-hover)",
                            }}
                          >
                            <Icon name="box" size={22} />
                          </div>
                          <span>
                            <b>Offered: {offer.itemName}</b>
                            <small>For &ldquo;{req.title}&rdquo;</small>
                          </span>
                          <Status status={offer.status} />
                        </button>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </section>
          </div>
        </>
      )}
    </main>
  )
}
