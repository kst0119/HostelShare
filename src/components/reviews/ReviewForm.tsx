import { useState } from "react"
import { useApp } from "../../context/AppContext"
import {
  canUserReviewTransaction,
  displayDate,
  itemFor,
  Transaction,
  userFor,
} from "../../store"
import Button from "../common/Button"
import Icon from "../common/Icon"
import StarRating from "./StarRating"

const MIN_COMMENT_LENGTH = 5
const MAX_COMMENT_LENGTH = 500

export default function ReviewForm({
  transaction,
  onReviewSubmitted,
}: {
  transaction: Transaction
  onReviewSubmitted?: () => void
}) {
  const { data, currentUser, submitReview } = useApp()
  const [rating, setRating] = useState<number>(0)
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const eligibility = canUserReviewTransaction(
    data,
    transaction.id,
    currentUser.id,
  )

  const item = itemFor(data, transaction.itemId)
  const isBorrower = transaction.borrowerId === currentUser.id
  const isOwner = transaction.ownerId === currentUser.id

  // If already reviewed, display existing review state clearly
  if (eligibility.existingReview) {
    const existing = eligibility.existingReview
    const recipient = userFor(data, existing.recipientId)

    return (
      <div
        className="review-submitted-card"
        role="region"
        aria-label="Review already submitted"
      >
        <div className="review-submitted-badge">
          <Icon name="check" size={18} />
          <span>Review Submitted</span>
        </div>
        <h3>Your review for {recipient.name}</h3>
        <p className="review-subhead">
          You reviewed this exchange on{" "}
          {displayDate(existing.createdAt.slice(0, 10))}.
        </p>

        <div className="existing-review-content">
          <div className="existing-review-stars">
            <StarRating rating={existing.rating} size={20} showNumber />
          </div>
          <p className="existing-review-comment">
            &ldquo;{existing.comment}&rdquo;
          </p>
        </div>

        <small className="review-immutable-note">
          Only one review is permitted per participant per completed transaction
          to ensure integrity.
        </small>
      </div>
    )
  }

  // If not eligible (e.g. not a participant or not returned)
  if (!eligibility.eligible || !eligibility.recipientId) {
    return (
      <div className="review-ineligible-card" role="alert">
        <Icon name="shield" size={20} />
        <div>
          <b>Review not available</b>
          <p>
            {eligibility.reason ||
              "Reviews are only available for participants of completed returns."}
          </p>
        </div>
      </div>
    )
  }

  const recipient = userFor(data, eligibility.recipientId)
  const recipientRole = isBorrower ? "Lender" : "Borrower"
  const currentUserRole = isBorrower ? "Borrower" : "Lender"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!rating || rating < 1 || rating > 5) {
      setError("Please choose a rating from 1 to 5 stars.")
      return
    }

    const trimmed = comment.trim()
    if (trimmed.length < MIN_COMMENT_LENGTH) {
      setError(
        `Please write a comment of at least ${MIN_COMMENT_LENGTH} characters.`,
      )
      return
    }

    if (trimmed.length > MAX_COMMENT_LENGTH) {
      setError(`Comment must not exceed ${MAX_COMMENT_LENGTH} characters.`)
      return
    }

    setBusy(true)
    const result = submitReview({
      transactionId: transaction.id,
      rating,
      comment: trimmed,
    })
    setBusy(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setSuccessMessage(result.message)
    if (onReviewSubmitted) {
      onReviewSubmitted()
    }
  }

  if (successMessage) {
    return (
      <div className="review-success-card" role="status">
        <div className="success-mark">
          <Icon name="check" size={28} />
        </div>
        <h3>Review submitted!</h3>
        <p>{successMessage}</p>
        <div className="submitted-summary">
          <StarRating rating={rating} size={18} showNumber />
          <p>&ldquo;{comment.trim()}&rdquo;</p>
        </div>
        <small>
          Your feedback is now visible on {recipient.name.split(" ")[0]}&apos;s
          profile.
        </small>
      </div>
    )
  }

  const remainingChars = MAX_COMMENT_LENGTH - comment.length
  const isCommentTooShort =
    comment.trim().length > 0 && comment.trim().length < MIN_COMMENT_LENGTH

  return (
    <form className="review-form-card" onSubmit={handleSubmit} noValidate>
      <div className="review-form-header">
        <span className="eyebrow" style={{ color: "var(--amber-hover)" }}>
          Peer Feedback
        </span>
        <h2>Rate your exchange with {recipient.name}</h2>
        <p>
          You exchanged <strong>{item.name}</strong> as the{" "}
          {currentUserRole.toLowerCase()}. Your review helps neighbours know
          what to expect when sharing items.
        </p>
      </div>

      <div className="recipient-preview-pill">
        <span className="mini-avatar">{recipient.avatar}</span>
        <div>
          <b>{recipient.name}</b>
          <small>
            {recipientRole} · {recipient.hostel} Room {recipient.roomNumber}
          </small>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor={`rating-${transaction.id}`} className="form-label">
          Overall rating <span className="required-star">*</span>
        </label>
        <StarRating
          interactive
          id={`rating-${transaction.id}`}
          value={rating}
          onChange={(newRating) => {
            setRating(newRating)
            if (error) setError("")
          }}
          disabled={busy}
        />
      </div>

      <div className="form-group">
        <div className="label-with-counter">
          <label htmlFor={`comment-${transaction.id}`} className="form-label">
            Written comment <span className="required-star">*</span>
          </label>
          <span
            className={`char-counter ${
              remainingChars < 30 ? "counter-warn" : ""
            }`}
            aria-live="polite"
          >
            {comment.length} / {MAX_COMMENT_LENGTH} chars (min{" "}
            {MIN_COMMENT_LENGTH})
          </span>
        </div>
        <textarea
          id={`comment-${transaction.id}`}
          rows={4}
          className={`review-textarea ${isCommentTooShort ? "input-warn" : ""}`}
          placeholder={
            isBorrower
              ? `How was ${recipient.name.split(" ")[0]} as a lender? Was the item in the described condition? Was pickup and return smooth?`
              : `How was ${recipient.name.split(" ")[0]} as a borrower? Did they treat the item with care and return it on time?`
          }
          value={comment}
          onChange={(e) => {
            setComment(e.target.value)
            if (error) setError("")
          }}
          maxLength={MAX_COMMENT_LENGTH}
          disabled={busy}
          aria-describedby={`comment-help-${transaction.id}`}
          required
        />
        <small id={`comment-help-${transaction.id}`} className="field-hint">
          Be honest, constructive, and helpful to the hostel community. Minimum{" "}
          {MIN_COMMENT_LENGTH} characters.
        </small>
      </div>

      {error && (
        <div className="form-error" role="alert">
          <Icon name="close" size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="review-form-actions">
        <Button
          type="submit"
          variant="amber"
          disabled={
            busy || !rating || comment.trim().length < MIN_COMMENT_LENGTH
          }
          className="wide"
        >
          {busy ? "Submitting review…" : "Submit Review"}
        </Button>
      </div>
    </form>
  )
}
