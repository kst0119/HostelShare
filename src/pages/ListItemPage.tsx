import { FormEvent, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import Button from "../components/common/Button"
import Icon from "../components/common/Icon"
import { useApp } from "../context/AppContext"
import { Category, dateOffset } from "../store"

export default function ListItemPage() {
  const navigate = useNavigate()
  const { currentUser, createItemListing } = useApp()

  const [step, setStep] = useState(1)
  const [error, setError] = useState("")
  const [done, setDone] = useState("")
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Study" as Category,
    condition: "Great",
    image: "",
    from: dateOffset(0),
    until: dateOffset(30),
  })

  const fileRef = useRef<HTMLInputElement>(null)
  const update = (key: string, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const next = () => {
    if (
      step === 1 &&
      (!form.name.trim() || form.description.trim().length < 12)
    ) {
      return setError(
        "Add a title and a helpful description of at least 12 characters.",
      )
    }
    if (step === 2 && !form.image) {
      return setError("Choose or upload a clear photo before continuing.")
    }
    setError("")
    setStep((current) => Math.min(3, current + 1))
  }

  const loadImage = (file?: File) => {
    if (!file) return
    if (file.size > 8 * 1024 * 1024)
      return setError("Image is larger than 8MB. Choose a smaller file.")
    const reader = new FileReader()
    reader.onload = () => {
      update("image", String(reader.result))
      setError("")
    }
    reader.onerror = () =>
      setError("Photo could not be loaded. Please try another image.")
    reader.readAsDataURL(file)
  }

  const publish = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      const result = await createItemListing({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        condition: form.condition,
        image: form.image,
        ownerId: currentUser.id,
        availableFrom: form.from,
        availableUntil: form.until,
      })
      setBusy(false)
      if (!result.ok) return setError(result.error || "Failed to publish listing.")
      setDone(form.name)
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : "Failed to publish listing.")
    }
  }

  if (done) {
    return (
      <main className="page success-page">
        <div className="success-mark">
          <Icon name="check" size={36} />
        </div>
        <span className="eyebrow">Listing Published</span>
        <h1>{done} is now available!</h1>
        <p>
          Your item is published and is now visible in the Explore
          catalogue and on your profile.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Button to="/discover">
            View in Explore <Icon name="arrow" size={16} />
          </Button>
          <Button variant="secondary" to="/profile">
            View on my profile
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="page listing-page">
      <div className="listing-intro">
        <span className="eyebrow">Share a Resource</span>
        <h1>What could a neighbour borrow?</h1>
        <p>
          Listing as <b>{currentUser.name}</b> ({currentUser.hostel}). You stay
          in full control of every request.
        </p>
        <div className="listing-quote">
          &ldquo;Sharing items sitting in our cupboard means less clutter in our
          room and less unnecessary buying on campus.&rdquo;
          <span>— Campus Sharing Principle</span>
        </div>
      </div>

      <form className="listing-form" onSubmit={publish}>
        <div className="stepper">
          {[1, 2, 3].map((number) => (
            <div key={number} className={number <= step ? "active" : ""}>
              <i>{number < step ? <Icon name="check" size={14} /> : number}</i>
              <span>
                {["Item Details", "Photo", "Availability"][number - 1]}
              </span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="form-step">
            <span className="step-label">Step 1 of 3</span>
            <h2>Tell us about the item</h2>
            <p>
              Clear descriptions help borrowers know what is included and how to
              use it safely.
            </p>
            <label>
              Item Title
              <input
                autoFocus
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Casio scientific calculator or HDMI adapter"
              />
            </label>
            <label>
              Description & Notes
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Condition, what cables/accessories are included, and anything important..."
              />
            </label>
            <div className="field-pair">
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) =>
                    update("category", e.target.value as Category)
                  }
                >
                  <option>Study</option>
                  <option>Electronics</option>
                  <option>Everyday</option>
                  <option>Sports</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Condition
                <select
                  value={form.condition}
                  onChange={(e) => update("condition", e.target.value)}
                >
                  <option>Like new</option>
                  <option>Great</option>
                  <option>Good</option>
                  <option>Loved</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <span className="step-label">Step 2 of 3</span>
            <h2>Add a clear photo</h2>
            <p>
              Good lighting and a clear picture reassure borrowers about the
              real physical condition.
            </p>
            <input
              className="file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              ref={fileRef}
              onChange={(e) => loadImage(e.target.files?.[0])}
            />
            {form.image ? (
              <div className="upload-preview">
                <img src={form.image} alt="Preview" />
                <button type="button" onClick={() => fileRef.current?.click()}>
                  Change photo
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="upload-zone"
                onClick={() => fileRef.current?.click()}
              >
                <Icon name="upload" size={32} />
                <b>Choose a photo from your computer</b>
                <span>JPG, PNG, or WebP up to 8MB</span>
              </button>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="form-step">
            <span className="step-label">Step 3 of 3</span>
            <h2>When is it available?</h2>
            <p>
              Set the date range during which neighbours can request this item.
            </p>
            <div className="field-pair">
              <label>
                Available from
                <input
                  type="date"
                  min={dateOffset(0)}
                  value={form.from}
                  onChange={(e) => update("from", e.target.value)}
                />
              </label>
              <label>
                Available until
                <input
                  type="date"
                  min={form.from}
                  value={form.until}
                  onChange={(e) => update("until", e.target.value)}
                />
              </label>
            </div>
            <div className="review-strip">
              <img src={form.image} alt="" />
              <div>
                <small>Ready to publish</small>
                <b>{form.name}</b>
                <span>
                  {form.condition} condition · {form.category}
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-nav">
          {step > 1 ? (
            <Button
              variant="secondary"
              onClick={() => {
                setStep((current) => current - 1)
                setError("")
              }}
            >
              ← Back
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button onClick={next}>
              Continue <Icon name="arrow" size={16} />
            </Button>
          ) : (
            <Button type="submit" disabled={busy}>
              {busy ? (
                "Publishing listing…"
              ) : (
                <>
                  Publish Listing <Icon name="check" size={16} />
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </main>
  )
}
