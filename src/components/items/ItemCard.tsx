import { useNavigate } from "react-router-dom"
import { useApp } from "../../context/AppContext"
import { getUserRatingStats, Item, userFor } from "../../store"
import Icon from "../common/Icon"
import Status from "../common/Status"

export default function ItemCard({
  item,
  select,
  saved: propSaved,
  save: propSave,
}: {
  item: Item
  select?: (item: Item) => void
  saved?: boolean
  save?: (id: string) => void
  index?: number
}) {
  const navigate = useNavigate()
  const { data, toggleSaveItem } = useApp()
  const owner = userFor(data, item.ownerId)
  const ownerStats = getUserRatingStats(data, owner.id)

  const isSaved =
    propSaved !== undefined ? propSaved : data.savedItemIds.includes(item.id)
  const handleSave = propSave || toggleSaveItem

  const handleSelect = () => {
    if (select) {
      select(item)
    } else {
      navigate(`/items/${item.id}`)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <article
      className="item-card"
      onClick={handleSelect}
      tabIndex={0}
      onKeyDown={(event) => event.key === "Enter" && handleSelect()}
      role="button"
      aria-label={`View details for ${item.name}`}
    >
      <div className="item-image">
        <img src={item.image} alt={item.name} loading="lazy" />
        <div className="card-badge-wrap">
          <Status status={item.availabilityStatus} />
        </div>
        <button
          type="button"
          className={`heart ${isSaved ? "saved" : ""}`}
          aria-label={`${isSaved ? "Remove" : "Save"} ${item.name}`}
          onClick={(event) => {
            event.stopPropagation()
            handleSave(item.id)
          }}
          title={isSaved ? "Saved to your list" : "Save item"}
        >
          <Icon name="heart" size={17} />
        </button>
      </div>
      <div className="item-card-body">
        <div className="item-meta">
          <span className="category-tag">{item.category}</span>
          <span className="condition-tag">{item.condition}</span>
        </div>
        <h3>{item.name}</h3>
        <div className="owner-row">
          <span className="mini-avatar" aria-hidden="true">
            {owner.avatar}
          </span>
          <div className="owner-meta">
            <div className="owner-name-line">
              <b>{owner.name}</b>
              {ownerStats.reviewCount > 0 && (
                <span
                  className="owner-rating"
                  title={`${ownerStats.averageRating} star community rating (${ownerStats.reviewCount} reviews)`}
                >
                  ★ {ownerStats.averageRating}
                </span>
              )}
            </div>
            <small>
              {owner.hostel} · Room {owner.roomNumber}
            </small>
          </div>
          <span className="card-arrow" aria-hidden="true">
            <Icon name="arrow" size={15} />
          </span>
        </div>
      </div>
    </article>
  )
}
