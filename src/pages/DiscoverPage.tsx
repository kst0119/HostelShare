import { useMemo, useState } from "react"
import Button from "../components/common/Button"
import Icon from "../components/common/Icon"
import ItemCard from "../components/items/ItemCard"
import { useApp } from "../context/AppContext"
import { useAuth } from "../context/AuthContext"
import { userFor } from "../store"

export default function DiscoverPage() {
  const {
    data,
    currentUser,
    toggleSaveItem,
    itemsLoading,
    itemsError,
    refreshItems,
  } = useApp()
  const { user } = useAuth()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [sort, setSort] = useState("Recommended")
  const [availableOnly, setAvailableOnly] = useState(false)

  const categories = [
    "All",
    "Study",
    "Electronics",
    "Everyday",
    "Sports",
    "Other",
  ]

  const filtered = useMemo(() => {
    const result = data.items.filter(
      (item) =>
        (category === "All" || item.category === category) &&
        (!availableOnly || item.availabilityStatus === "available") &&
        `${item.name} ${item.description} ${userFor(data, item.ownerId).name}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    return [...result].sort((a, b) =>
      sort === "Available first"
        ? Number(b.availabilityStatus === "available") -
          Number(a.availabilityStatus === "available")
        : sort === "A–Z"
          ? a.name.localeCompare(b.name)
          : 0,
    )
  }, [data, query, category, sort, availableOnly])

  return (
    <main className="page">
      <section className="discover-head">
        <div>
          <span className="eyebrow">
            {new Date().toLocaleDateString("en", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
          <h1>Explore Shared Items</h1>
          <p>Browsing campus resources available in your hostel community.</p>
        </div>
        {user ? (
          <div className="demo-banner live-banner">
            <Icon name="shield" />
            <span>
              <b>Live Database Active</b>
              Signed in as {currentUser.name} ({currentUser.hostel})
            </span>
          </div>
        ) : (
          <div className="demo-banner">
            <Icon name="user" />
            <span>
              <b>Demo Mode Active</b>
              Browsing as {currentUser.name} ({currentUser.hostel})
            </span>
          </div>
        )}
      </section>

      <section className="search-wrap">
        <Icon name="search" size={22} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search calculators, chargers, textbooks, adapters…"
          aria-label="Search items"
        />
        <kbd>Live Filter</kbd>
      </section>

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
        <label className="check-control">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(event) => setAvailableOnly(event.target.checked)}
          />
          Available only
        </label>
      </div>

      <div className="results-bar">
        <p>
          <b>{filtered.length} things</b> found near {currentUser.hostel}
        </p>
        <label>
          Sort by{" "}
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option>Recommended</option>
            <option>Available first</option>
            <option>A–Z</option>
          </select>
        </label>
      </div>

      {itemsLoading ? (
        <div className="empty" style={{ margin: "40px auto" }}>
          <span className="empty-orbit">
            <Icon name="box" size={32} />
          </span>
          <h2>Loading items…</h2>
          <p>Connecting to the campus inventory database.</p>
        </div>
      ) : itemsError ? (
        <div className="empty" style={{ margin: "40px auto" }}>
          <span
            className="empty-orbit"
            style={{ color: "var(--red, #e53e3e)" }}
          >
            <Icon name="close" size={28} />
          </span>
          <span
            className="eyebrow"
            style={{ color: "var(--red, #e53e3e)" }}
          >
            Database Error
          </span>
          <h2>Unable to load shared items</h2>
          <p>{itemsError}</p>
          <div style={{ marginTop: 14 }}>
            <Button variant="secondary" onClick={refreshItems}>
              Retry Connection
            </Button>
          </div>
        </div>
      ) : data.items.length === 0 ? (
        <div className="empty" style={{ margin: "40px auto" }}>
          <span className="empty-orbit">
            <Icon name="box" size={32} />
          </span>
          <span className="eyebrow">Empty Catalog</span>
          <h2>No items listed yet</h2>
          <p>
            No listings found in the campus database yet. Be the first to share
            an item with your hostel!
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginTop: 16,
            }}
          >
            <Button to="/list-item">
              <Icon name="plus" size={16} /> List an item
            </Button>
            <Button variant="secondary" onClick={refreshItems}>
              Refresh
            </Button>
          </div>
        </div>
      ) : filtered.length ? (
        <div className="editorial-grid">
          {filtered.map((item, index) => (
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
        <div className="empty">
          <span className="empty-orbit">
            <Icon name="search" size={28} />
          </span>
          <h2>Nothing found for &ldquo;{query}&rdquo;</h2>
          <p>
            Try searching for a general term like &ldquo;calculator&rdquo; or
            clearing your category filters.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setQuery("")
              setCategory("All")
              setAvailableOnly(false)
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}
    </main>
  )
}

