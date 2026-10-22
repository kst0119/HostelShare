import { Link } from "react-router-dom"
import { AppData, displayDate, itemFor, Review, userFor } from "../../store"
import Icon from "../common/Icon"
import StarRating from "./StarRating"

export default function ReviewCard({
  review,
  data,
}: {
  review: Review
  data: AppData
}) {
  const reviewer = userFor(data, review.reviewerId)
  const transaction = data.transactions.find(
    (t) => t.id === review.transactionId,
  )
  const item = transaction ? itemFor(data, transaction.itemId) : null

  const isBorrowerReviewing =
    transaction && transaction.borrowerId === review.reviewerId

  return (
    <article className="review-card" aria-label={`Review by ${reviewer.name}`}>
      <div className="review-card-header">
        <Link
          to={`/profile/${reviewer.id}`}
          className="reviewer-identity-link"
          title={`View ${reviewer.name}'s profile`}
        >
          <span className="mini-avatar">{reviewer.avatar}</span>
          <div className="reviewer-info">
            <span className="reviewer-name">{reviewer.name}</span>
            <small className="reviewer-meta">
              {reviewer.hostel} · Room {reviewer.roomNumber}
            </small>
          </div>
        </Link>
        <div className="review-rating-block">
          <StarRating rating={review.rating} size={16} showNumber={false} />
          <time className="review-date" dateTime={review.createdAt}>
            {displayDate(review.createdAt.slice(0, 10))}
          </time>
        </div>
      </div>

      {item && (
        <div className="review-loan-context">
          <Icon name="box" size={14} />
          <span>
            {isBorrowerReviewing ? "Borrowed" : "Lent"}{" "}
            <strong>{item.name}</strong>
          </span>
          <span className="verified-badge">
            <Icon name="check" size={12} /> Verified loan
          </span>
        </div>
      )}

      <p className="review-comment">{review.comment}</p>
    </article>
  )
}
