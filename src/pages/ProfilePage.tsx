import { useParams } from "react-router-dom"
import Button from "../components/common/Button"
import Icon from "../components/common/Icon"
import SectionTitle from "../components/common/SectionTitle"
import ItemCard from "../components/items/ItemCard"
import ReviewCard from "../components/reviews/ReviewCard"
import StarRating from "../components/reviews/StarRating"
import { useApp } from "../context/AppContext"
import { getUserRatingStats } from "../store"

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { data, currentUser, switchUser, setDialog, toggleSaveItem } = useApp()

  const profileUser = id
    ? data.users.find((u) => u.id === id) || currentUser
    : currentUser

  const isOwnProfile = profileUser.id === currentUser.id

  const userItems = data.items.filter((item) => item.ownerId === profileUser.id)
  const completed = data.transactions.filter(
    (transaction) =>
      [transaction.ownerId, transaction.borrowerId].includes(profileUser.id) &&
      transaction.status === "returned",
  )

  const ratingStats = getUserRatingStats(data, profileUser.id)

  return (
    <main className="page profile-page">
      <section className="profile-hero">
        <div className="profile-avatar">
          {profileUser.avatar}
          <span>
            <Icon name="check" size={15} />
          </span>
        </div>
        <div>
          <span className="eyebrow">
            {profileUser.hostel} · Room {profileUser.roomNumber} · Verified
            Resident
          </span>
          <h1>{profileUser.name}</h1>
          <p>{profileUser.bio}</p>
          <div className="profile-chips">
            {ratingStats.reviewCount > 0 ? (
              <span className="profile-rating-chip">
                <Icon name="star" size={14} fill="currentColor" />{" "}
                <b>{ratingStats.averageRating}</b> community rating (
                {ratingStats.reviewCount}{" "}
                {ratingStats.reviewCount === 1 ? "review" : "reviews"})
              </span>
            ) : (
              <span className="profile-rating-chip no-reviews">
                No reviews yet · 0 reviews
              </span>
            )}
            <span>{completed.length} completed returns</span>
          </div>
        </div>
        {isOwnProfile ? (
          <Button variant="secondary" onClick={() => setDialog("profile")}>
            Edit profile
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => switchUser(profileUser.id)}
          >
            Switch to this demo user
          </Button>
        )}
      </section>

      <div className="profile-grid">
        <section className="trust-meter">
          <span className="eyebrow">Community Standing</span>
          <div className="meter-score">
            <b>
              {ratingStats.averageRating
                ? Math.round(ratingStats.averageRating * 20)
                : 90}
            </b>
            <span>/ 100 Demo Score</span>
          </div>
          <div className="meter">
            <i />
          </div>
          <p>
            Derived from on-time returns, verified campus identity, and
            neighbour ratings.
          </p>
          <ul>
            <li>
              <Icon name="check" size={16} /> {completed.length} verified
              returns recorded locally
            </li>
            <li>
              <Icon name="check" size={16} /> Campus profile visible to
              neighbours
            </li>
            <li>
              <Icon name="check" size={16} /> Safe hostel exchange participant
            </li>
          </ul>
        </section>

        <section className="profile-stats">
          <div>
            <b>{userItems.length}</b>
            <span>Items listed</span>
          </div>
          <div>
            <b>
              {
                data.transactions.filter((t) => t.borrowerId === profileUser.id)
                  .length
              }
            </b>
            <span>Items borrowed</span>
          </div>
          <div>
            <b>{ratingStats.reviewCount}</b>
            <span>Reviews received</span>
          </div>
          <blockquote>
            &ldquo;Clear handovers and on-time returns make sharing simple and
            pleasant for everyone in the hall.&rdquo;
            <cite>— HostelShare Community Guideline</cite>
          </blockquote>
        </section>
      </div>

      <section className="profile-reviews-section">
        <SectionTitle
          eyebrow="Peer Feedback"
          aside={
            <span className="count">
              {ratingStats.reviewCount}{" "}
              {ratingStats.reviewCount === 1 ? "review" : "reviews"} received
            </span>
          }
        >
          Ratings & Reviews
        </SectionTitle>

        {ratingStats.reviewCount > 0 ? (
          <div className="profile-reviews-wrapper">
            <div className="reviews-summary-banner">
              <div className="summary-score-box">
                <span className="big-rating-number">
                  {ratingStats.averageRating?.toFixed(1)}
                </span>
                <StarRating rating={ratingStats.averageRating} size={22} />
                <span className="summary-review-count">
                  Based on {ratingStats.reviewCount} verified{" "}
                  {ratingStats.reviewCount === 1 ? "review" : "reviews"}
                </span>
              </div>
              <div className="summary-info-box">
                <div className="verified-loans-pill">
                  <Icon name="shield" size={16} />
                  <span>100% verified peer exchanges</span>
                </div>
                <p>
                  Reviews can only be submitted by genuine borrowers or lenders
                  after an item has been safely returned and verified.
                </p>
              </div>
            </div>

            <div className="reviews-cards-list">
              {ratingStats.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} data={data} />
              ))}
            </div>
          </div>
        ) : (
          <div className="small-empty">
            <Icon name="star" />
            <span>
              <b>No reviews yet for {profileUser.name.split(" ")[0]}.</b>{" "}
              Reviews and star ratings from completed loan exchanges will appear
              here.
            </span>
          </div>
        )}
      </section>

      <SectionTitle
        eyebrow={
          isOwnProfile
            ? "Your Shared Cupboard"
            : `${profileUser.name.split(" ")[0]}'s Shared Cupboard`
        }
        aside={<span className="count">{userItems.length} listed</span>}
      >
        {isOwnProfile
          ? "Your listed items"
          : `${profileUser.name.split(" ")[0]}'s listed items`}
      </SectionTitle>
      {userItems.length ? (
        <div className="editorial-grid">
          {userItems.map((item, index) => (
            <ItemCard
              key={item.id}
              item={item}
              saved={data.savedItemIds.includes(item.id)}
              save={toggleSaveItem}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="small-empty">
          <Icon name="plus" />
          <span>
            <b>No items listed yet.</b>{" "}
            {isOwnProfile
              ? "Click “List an item” in the top bar to share something useful from your room."
              : `${profileUser.name.split(" ")[0]} has no items currently listed.`}
          </span>
        </div>
      )}

      {isOwnProfile && (
        <div className="profile-footer">
          <button type="button" onClick={() => setDialog("report")}>
            Report a concern
          </button>
          <button type="button" onClick={() => setDialog("reset")}>
            Reset demo data to initial state
          </button>
        </div>
      )}
    </main>
  )
}
