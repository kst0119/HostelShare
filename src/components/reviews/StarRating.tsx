import { KeyboardEvent, useState } from "react"
import Icon from "../common/Icon"

const RATING_LABELS: Record<number, string> = {
  1: "1 star — Poor",
  2: "2 stars — Fair",
  3: "3 stars — Good",
  4: "4 stars — Very Good",
  5: "5 stars — Excellent",
}

export type StarRatingProps = {
  interactive: true
  value: number
  onChange: (rating: number) => void
  disabled?: boolean
  id?: string
  size?: number
} | {
  interactive?: false
  value?: never
  onChange?: never
  rating: number | null
  size?: number
  showNumber?: boolean
  reviewCount?: number
  className?: string
}

export default function StarRating(props: StarRatingProps) {
  if (props.interactive) {
    const { value, onChange, disabled, id, size = 28 } = props
    const [hoverRating, setHoverRating] = useState<number | null>(null)

    const activeRating = hoverRating !== null ? hoverRating : value

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return
      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault()
        const next = Math.min(5, (value || 0) + 1)
        onChange(next)
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault()
        const prev = Math.max(1, (value || 1) - 1)
        onChange(prev)
      }
    }

    return (
      <div className="star-rating-interactive" id={id}>
        <div
          className="star-buttons-row"
          role="radiogroup"
          aria-label="Star rating from 1 to 5 stars"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= activeRating
            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={value === star}
                aria-label={RATING_LABELS[star]}
                disabled={disabled}
                className={`star-btn ${isFilled ? "active" : ""}`}
                onClick={() => onChange(star)}
                onMouseEnter={() => !disabled && setHoverRating(star)}
                onMouseLeave={() => !disabled && setHoverRating(null)}
              >
                <Icon
                  name="star"
                  size={size}
                  fill={isFilled ? "currentColor" : "none"}
                />
              </button>
            )
          })}
        </div>
        <span className="star-label-text" aria-live="polite">
          {activeRating > 0
            ? RATING_LABELS[activeRating]
            : "Click to rate or use arrow keys (1–5 stars)"}
        </span>
      </div>
    )
  }

  // Read-only display mode
  const {
    rating,
    size = 16,
    showNumber = false,
    reviewCount,
    className = "",
  } = props

  if (rating === null || rating === undefined) {
    return (
      <div className={`star-rating-display empty-rating ${className}`}>
        <span className="no-rating-text">No reviews yet</span>
      </div>
    )
  }

  const rounded = Math.round(rating)

  return (
    <div
      className={`star-rating-display ${className}`}
      aria-label={`${rating} out of 5 stars`}
    >
      <div className="star-icons-row" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= rounded
          return (
            <span
              key={star}
              className={`display-star ${isFilled ? "active" : "inactive"}`}
            >
              <Icon
                name="star"
                size={size}
                fill={isFilled ? "currentColor" : "none"}
              />
            </span>
          )
        })}
      </div>
      {showNumber && <span className="rating-number">{rating.toFixed(1)}</span>}
      {reviewCount !== undefined && (
        <span className="review-count">
          ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  )
}
