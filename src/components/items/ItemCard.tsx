import { useNavigate } from "react-router-dom"
import { useApp } from "../../context/AppContext"
import { Item, userFor } from "../../store"
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
        <Status status={item.availabilityStatus} />
        <button
          type="button"
          className={`heart ${isSaved ? "saved" : ""}`}
          aria-label={`${isSaved ? "Remove" : "Save"} ${item.name}`}
          onClick={(event) => {
            event.stopPropagation()
            handleSave(item.id)
          }}
        >
          <Icon name="heart" size={18} />
        </button>
      </div>
      <div className="item-card-body">
        <div className="item-meta">
          <span>{item.category}</span>
          <span>{item.condition}</span>
        </div>
        <h3>{item.name}</h3>
        <div className="owner-row">
          <span className="mini-avatar">{owner.avatar}</span>
          <span>
            <b>{owner.name}</b>
            <small>
              {owner.hostel} · Room {owner.roomNumber}
            </small>
          </span>
          <Icon name="arrow" size={16} />
        </div>
      </div>
    </article>
  )
}
