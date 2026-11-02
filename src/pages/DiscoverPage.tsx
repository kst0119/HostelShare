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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: data.items.length }
    for (const item of data.items) {
      counts[item.category] = (counts[item.category] || 0) + 1
    }
    return counts
  }, [data.items])

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

  const hasActiveFilters = category !== "All" || availableOnly || query.trim().length > 0

  return (
    <main className="page discover-page">
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
          <p>
            Browse, borrow, and share resources within your campus hostel community.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {user ? (
            <div className="demo-banner live-banner">
              <Icon name="shield" />
              <span>
                <b>Live Database Active</b>
                {currentUser.name} ({currentUser.hostel})
              </span>
            </div>
          ) : (
            <div className="demo-banner">
              <Icon name="user" />
              <span>
                <b>Demo Persona</b>
                {currentUser.name} ({currentUser.hostel})
              </span>
            </div>
          )}
          <Button variant="primary" to="/list-item">
            <Icon name="plus" size={16} /> List an item
          </Button>
        </div>
      </section>

      <section className="search-wrap">
        <Icon name="search" size={20} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search calculators, headphones, sports kits, adapters by title, notes, or owner…"
          aria-label="Search items"
        />
        {query ? (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => setQuery("")}
            aria-label="Clear search text"
            title="Clear search text"
          >
            <Icon name="close" size={15} />
          </button>
        ) : (
          <kbd>Live Filter</kbd>
        )}
      </section>

      <div className="filter-line">
        <div className="category-row" role="tablist" aria-label="Item category filters">
          {categories.map((name) => {
            const count = categoryCounts[name] || 0
            return (
              <button
                type="button"
                key={name}
                className={category === name ? "selected" : ""}
                onClick={() => setCategory(name)}
                role="tab"
                aria-selected={category === name}
              >
                <span>{name}</span>
                <span className="pill-count">{count}</span>
              </button>
            )
          })}
        </div>
        <label className="check-control">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(event) => setAvailableOnly(event.target.checked)}
          />
          <span>Available only</span>
        </label>
      </div>

      <div className="results-bar">
        <div className="results-count-wrap">
          <p>
            <b>{filtered.length} {filtered.length === 1 ? "item" : "items"}</b> available across campus
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className="text-reset-link"
              onClick={() => {
                setQuery("")
                setCategory("All")
                setAvailableOnly(false)
              }}
            >
              Reset filters
            </button>
          )}
        </div>
        <label className="sort-control">
          <span>Sort by</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort catalog results"
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

