import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useApp } from "../../context/AppContext"
import { User } from "../../store"
import Button from "./Button"
import Icon from "./Icon"

export default function Modal() {
  const navigate = useNavigate()
  const {
    dialog,
    setDialog,
    currentUser,
    updateProfile,
    resetDemoData,
    switchUser,
    setFlash,
  } = useApp()

  const [profile, setProfile] = useState<User>(currentUser)
  const [issue, setIssue] = useState("")

  useEffect(() => {
    setProfile(currentUser)
  }, [currentUser, dialog])

  if (!dialog) return null

  const close = () => setDialog(null)

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          className="modal-close"
          onClick={close}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>

        {dialog === "auth" && (
          <div>
            <span className="eyebrow" style={{ color: "var(--amber-hover)" }}>
              Phase 1A Preview
            </span>
            <h2 id="modal-title">Student Authentication</h2>
            <p style={{ marginTop: 8 }}>
              Full institutional email authentication (requiring verified{" "}
              <b>@college.edu</b> email addresses and password hashing) is
              scheduled for <b>Phase 4</b>.
            </p>
            <p style={{ marginTop: 12 }}>
              In the meantime, the entire application is{" "}
              <b>100% interactive right now</b>. You can explore listings,
              submit borrow requests, approve handovers, and publish items using
              our pre-configured demo student profiles (Aisha, Mira, and Kabir).
            </p>
            <div className="modal-actions" style={{ marginTop: 24 }}>
              <Button variant="secondary" onClick={close}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  switchUser("user-aisha")
                  close()
                  navigate("/discover")
                }}
              >
                Launch Demo as Aisha <Icon name="arrow" size={16} />
              </Button>
            </div>
          </div>
        )}

        {dialog === "reset" && (
          <>
            <span className="eyebrow">Reset Storage</span>
            <h2 id="modal-title">Reset demo data?</h2>
            <p>
              This removes any items, requests, or profile edits stored in this
              browser and restores the default sample student community.
            </p>
            <div className="modal-actions">
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button onClick={resetDemoData}>Reset data</Button>
            </div>
          </>
        )}

        {dialog === "profile" && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              updateProfile(profile)
            }}
          >
            <span className="eyebrow">Edit Profile</span>
            <h2 id="modal-title">Update your details</h2>
            <label>
              Full Name
              <input
                required
                value={profile.name}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    name: e.target.value,
                    avatar: e.target.value
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase(),
                  })
                }
              />
            </label>
            <div className="field-pair">
              <label>
                Hostel Building
                <input
                  required
                  value={profile.hostel}
                  onChange={(e) =>
                    setProfile({ ...profile, hostel: e.target.value })
                  }
                />
              </label>
              <label>
                Room Number
                <input
                  required
                  value={profile.roomNumber}
                  onChange={(e) =>
                    setProfile({ ...profile, roomNumber: e.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Short Bio
              <textarea
                required
                minLength={10}
                value={profile.bio}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
              />
            </label>
            <div className="modal-actions">
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        )}

        {dialog === "report" && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              close()
              setFlash({
                type: "success",
                text: "Report acknowledged locally. No server was contacted.",
              })
            }}
          >
            <span className="eyebrow">Student Support</span>
            <h2 id="modal-title">Report an issue</h2>
            <p>
              This prototype acknowledges reports locally. Genuine ticketing
              will connect to campus administration in a later phase.
            </p>
            <label>
              What happened?
              <textarea
                required
                minLength={10}
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="Describe the concern clearly..."
              />
            </label>
            <div className="modal-actions">
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button type="submit">Acknowledge</Button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
