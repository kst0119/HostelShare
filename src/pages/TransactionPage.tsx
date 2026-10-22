import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import Button from "../components/common/Button"
import Icon from "../components/common/Icon"
import SectionTitle from "../components/common/SectionTitle"
import Status from "../components/common/Status"
import ReviewCard from "../components/reviews/ReviewCard"
import ReviewForm from "../components/reviews/ReviewForm"
import { useApp } from "../context/AppContext"
import {
  canUserReviewTransaction,
  displayDate,
  getUserRatingStats,
  itemFor,
  userFor,
} from "../store"

export default function TransactionPage() {
  const { id } = useParams<{ id: string }>()
  const { data, currentUser, mutateTransaction } = useApp()
  const [verified, setVerified] = useState(false)

  const transaction = data.transactions.find((candidate) => candidate.id === id)

  if (!transaction) {
    return (
      <main className="page">
        <div className="empty" style={{ margin: "60px auto", maxWidth: 540 }}>
          <span className="empty-orbit">
            <Icon name="refresh" size={32} />
          </span>
          <span className="eyebrow" style={{ color: "var(--amber-hover)" }}>
            Transaction Not Found
          </span>
          <h2>We couldn&apos;t find that transaction</h2>
          <p>
            The transaction with ID <code>{id}</code> does not exist or may have
            been cleared in a demo reset.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginTop: 16,
            }}
          >
            <Button variant="primary" to="/activity">
              Back to My Activity <Icon name="arrow" size={16} />
            </Button>
            <Button variant="secondary" to="/discover">
              Explore Items
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const item = itemFor(data, transaction.itemId)
  const borrower = userFor(data, transaction.borrowerId)
  const owner = userFor(data, transaction.ownerId)
  const returned = transaction.status === "returned"

  const isBorrower = currentUser.id === transaction.borrowerId
  const isOwner = currentUser.id === transaction.ownerId
  const isParticipant = isBorrower || isOwner

  const otherParticipantId = isBorrower
    ? transaction.ownerId
    : transaction.borrowerId
  const otherParticipant = isParticipant
    ? userFor(data, otherParticipantId)
    : null

  const borrowerStats = getUserRatingStats(data, borrower.id)
  const ownerStats = getUserRatingStats(data, owner.id)

  const userReviewCheck = canUserReviewTransaction(
    data,
    transaction.id,
    currentUser.id,
  )
  const userReviewed = !!userReviewCheck.existingReview

  const otherReview = isParticipant
    ? (data.reviews || []).find(
        (r) =>
          r.transactionId === transaction.id &&
          r.reviewerId === otherParticipantId,
      )
    : null

  return (
    <main className="page transaction-page">
      <Link to="/activity" className="back-link">
        ← Back to My Activity
      </Link>

      <div className="transaction-head">
        <div>
          <span className="eyebrow">
            Transaction #{transaction.id.slice(-8)}
          </span>
          <h1>{returned ? "Exchange complete" : "Transaction in progress"}</h1>
          <p>
            Inspect the physical item together and confirm handover in common
            hostel spaces.
          </p>
        </div>
        <Status status={transaction.status} />
      </div>

      <div className="transaction-grid">
        <section className="exchange-card">
          <div className="people">
            <div>
              <Link
                to={`/profile/${borrower.id}`}
                className="person-profile-link"
                title={`View ${borrower.name}'s profile`}
              >
                <span className="owner-avatar">{borrower.avatar}</span>
                <small>Borrower</small>
                <b>{borrower.name}</b>
              </Link>
              <p>
                {borrower.hostel} · Room {borrower.roomNumber}
              </p>
              <small className="participant-rating-stat">
                {borrowerStats.reviewCount > 0 ? (
                  <>
                    ★ {borrowerStats.averageRating} ({borrowerStats.reviewCount}{" "}
                    {borrowerStats.reviewCount === 1 ? "review" : "reviews"})
                  </>
                ) : (
                  "New resident · 0 reviews"
                )}
              </small>
            </div>
            <span className="exchange-line">
              <i />
              <Icon name="arrow" size={16} />
              <i />
            </span>
            <div>
              <Link
                to={`/profile/${owner.id}`}
                className="person-profile-link"
                title={`View ${owner.name}'s profile`}
              >
                <span className="owner-avatar lender">{owner.avatar}</span>
                <small>Lender</small>
                <b>{owner.name}</b>
              </Link>
              <p>
                {owner.hostel} · Room {owner.roomNumber}
              </p>
              <small className="participant-rating-stat">
                {ownerStats.reviewCount > 0 ? (
                  <>
                    ★ {ownerStats.averageRating} ({ownerStats.reviewCount}{" "}
                    {ownerStats.reviewCount === 1 ? "review" : "reviews"})
                  </>
                ) : (
                  "New resident · 0 reviews"
                )}
              </small>
            </div>
          </div>

          <div className="transaction-item">
            <img src={item.image} alt={item.name} />
            <div>
              <small>Shared resource</small>
              <h3>{item.name}</h3>
              <span>{item.condition} condition</span>
            </div>
            <div>
              <small>Due back</small>
              <b>{displayDate(transaction.dueAt)}</b>
            </div>
          </div>

          <div className="timeline">
            <div className="done">
              <i>✓</i>
              <span>
                <b>Request approved</b>
                <small>Item reserved by lender</small>
              </span>
            </div>
            <div
              className={
                transaction.handoverAt
                  ? "done"
                  : transaction.status === "approved"
                    ? "current"
                    : ""
              }
            >
              <i>{transaction.handoverAt ? "✓" : "2"}</i>
              <span>
                <b>Handover confirmed</b>
                <small>
                  {transaction.handoverAt
                    ? new Date(transaction.handoverAt).toLocaleString()
                    : "Waiting for common-area meetup"}
                </small>
              </span>
            </div>
            <div
              className={
                returned
                  ? "done"
                  : transaction.status === "return_pending"
                    ? "current"
                    : ""
              }
            >
              <i>{returned ? "✓" : "3"}</i>
              <span>
                <b>Return confirmed</b>
                <small>
                  {transaction.returnedAt
                    ? new Date(transaction.returnedAt).toLocaleString()
                    : `Due ${displayDate(transaction.dueAt)}`}
                </small>
              </span>
            </div>
          </div>
        </section>

        <aside className="verify-card">
          <span className="eyebrow" style={{ color: "var(--amber)" }}>
            Action Station
          </span>
          <h2>
            {returned
              ? "Safe and sound"
              : transaction.status === "approved"
                ? "Ready for handover?"
                : transaction.status === "borrowed"
                  ? "Time to return?"
                  : "Confirm receipt"}
          </h2>
          <p>
            Acting as <b>{currentUser.name}</b>.
          </p>

          {transaction.status === "approved" && !verified && (
            <>
              <div
                className="qr"
                aria-label="Simulated QR verification pattern"
              >
                {Array.from({ length: 49 }).map((_, index) => (
                  <i
                    key={index}
                    className={
                      [
                        0, 1, 2, 7, 9, 14, 15, 16, 32, 33, 34, 39, 41, 46, 47,
                        48,
                      ].includes(index) || (index * 7) % 11 < 4
                        ? "dark"
                        : ""
                    }
                  />
                ))}
              </div>
              <Button
                variant="amber"
                className="wide"
                onClick={() => setVerified(true)}
              >
                Simulate code verification <Icon name="arrow" size={16} />
              </Button>
            </>
          )}

          {transaction.status === "approved" && verified && (
            <div className="verified-box">
              <div className="success-mark">
                <Icon name="check" size={24} />
              </div>
              <h3>Code verified</h3>
              <p>
                Inspect the physical item together before confirming handover.
              </p>
              <Button
                variant="amber"
                className="wide"
                onClick={() => mutateTransaction("handover", transaction.id)}
              >
                Confirm handover
              </Button>
            </div>
          )}

          {transaction.status === "borrowed" && (
            <div className="verified-box">
              <p>
                Initiating a return signals the lender that you are ready to
                hand back the item.
              </p>
              <Button
                variant="amber"
                className="wide"
                onClick={() =>
                  mutateTransaction("initiate-return", transaction.id)
                }
              >
                Start return process
              </Button>
            </div>
          )}

          {transaction.status === "return_pending" && (
            <div className="verified-box">
              <p>
                Confirm only after the physical item has been returned and
                checked.
              </p>
              <Button
                variant="amber"
                className="wide"
                onClick={() =>
                  mutateTransaction("confirm-return", transaction.id)
                }
              >
                Confirm item received back
              </Button>
            </div>
          )}

          {returned && (
            <div className="verified-box">
              <div className="success-mark">
                <Icon name="check" size={24} />
              </div>
              <h3>Transaction completed</h3>
              <p>The shared item is returned and safely archived.</p>
              {isParticipant && !userReviewed && (
                <Button
                  variant="amber"
                  className="wide"
                  onClick={() => {
                    document
                      .getElementById("review")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }}
                  style={{ marginTop: 8 }}
                >
                  Rate & review exchange{" "}
                  <Icon name="star" size={16} fill="currentColor" />
                </Button>
              )}
              {isParticipant && userReviewed && (
                <div className="review-status-pill" style={{ marginTop: 8 }}>
                  <Icon name="check" size={14} /> You submitted feedback
                </div>
              )}
              <Button
                variant="secondary"
                to="/activity"
                style={{ marginTop: 8 }}
              >
                View in activity history
              </Button>
            </div>
          )}

          <div className="safety-note">
            <Icon name="shield" size={16} />
            <span>Always exchange in public hostel common areas.</span>
          </div>
        </aside>
      </div>

      {returned && (
        <section className="transaction-reviews-section" id="review">
          <SectionTitle eyebrow="Community Standing">
            Exchange Feedback & Reviews
          </SectionTitle>

          <div className="transaction-reviews-grid">
            <div className="review-form-wrapper">
              <ReviewForm transaction={transaction} />
            </div>

            {otherParticipant && (
              <div className="peer-review-display">
                <div className="subhead">
                  <h3>Review from {otherParticipant.name}</h3>
                  <span className="role-tag">
                    {otherParticipant.id === transaction.borrowerId
                      ? "Borrower"
                      : "Lender"}
                  </span>
                </div>
                {otherReview ? (
                  <ReviewCard review={otherReview} data={data} />
                ) : (
                  <div className="pending-review-box">
                    <Icon name="clock" size={22} />
                    <div>
                      <b>Awaiting peer review</b>
                      <p>
                        {otherParticipant.name.split(" ")[0]} has not submitted
                        their review for this exchange yet. Switch demo users to
                        submit as {otherParticipant.name.split(" ")[0]}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  )
}
