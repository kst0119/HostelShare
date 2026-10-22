import { useNavigate } from "react-router-dom"
import Button from "../components/common/Button"
import Icon from "../components/common/Icon"
import SectionTitle from "../components/common/SectionTitle"
import Status from "../components/common/Status"
import ItemCard from "../components/items/ItemCard"
import { useApp } from "../context/AppContext"

export default function HomePage() {
  const navigate = useNavigate()
  const { data, setDialog, toggleSaveItem } = useApp()
  const featured = data.items.slice(0, 4)

  return (
    <main className="landing-wrap">
      {/* 1. Hero Section */}
      <section className="landing-hero">
        <div className="hero-copy">
          <div className="hero-badge">
            <i /> Campus Resource Sharing · Peer-to-Peer
          </div>
          <h1>
            Borrow what you need.
            <br />
            Lend what you don&apos;t.
            <br />
            <em>Connect with your hostel.</em>
          </h1>
          <p className="hero-lead">
            A trustworthy community platform for college hostel residents to
            borrow everyday items, share underused gear, and post campus
            requirements—without leaving your hostel block.
          </p>

          <div className="hero-cta-group">
            <Button variant="primary" to="/signup">
              Sign Up <Icon name="arrow" size={17} />
            </Button>
            <Button variant="secondary" to="/login">
              Log In
            </Button>
            <Button variant="dark" to="/discover">
              Explore Demo Catalog
            </Button>
            <Button
              variant="text"
              onClick={() => {
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              How It Works ↓
            </Button>
          </div>

          <div className="hero-prototype-notice">
            <Icon name="shield" size={16} />
            <span>
              <b>Phase 3A Interactive Preview:</b> Explore shared items, post
              campus requirements, offer items to neighbours, and simulate
              exchanges with pre-loaded student profiles.
            </span>
          </div>
        </div>

        {/* Hero Showcase Card */}
        <div className="hero-showcase">
          <div className="showcase-header">
            <span>Live Campus Exchange Preview</span>
            <Status status="borrowed" />
          </div>
          <div className="showcase-active-card">
            <img
              src={data.items[3]?.image || featured[0]?.image}
              alt="Laptop presentation kit"
            />
            <div>
              <span className="eyebrow" style={{ marginBottom: 4 }}>
                Active Loan
              </span>
              <h4>{data.items[3]?.name || "Laptop presentation kit"}</h4>
              <p>Lender: Kabir Shah · Cedar Hall 108</p>
              <p>Borrower: Aisha Singh · Maple House 218</p>
            </div>
          </div>
          <div className="showcase-timeline">
            <div className="showcase-step done">
              <i>✓</i>
              <span>Request approved & item reserved</span>
              <small>Confirmed</small>
            </div>
            <div className="showcase-step current">
              <i>2</i>
              <span>Physical handover at Maple House lobby</span>
              <small>Active Loan</small>
            </div>
            <div className="showcase-step next">
              <i>3</i>
              <span>Return scheduled before seminar</span>
              <small>Due in 2 days</small>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Activities Section */}
      <section className="landing-section alt-bg" id="activities">
        <div className="section-head">
          <span className="eyebrow">Platform Capabilities</span>
          <h2>Three core ways HostelShare works for students</h2>
          <p>
            Everything you need for student life is already on campus.
            HostelShare gives you structured, accountable ways to access and
            share resources.
          </p>
        </div>

        <div className="activities-grid">
          <div className="activity-card">
            <div className="activity-icon-wrap borrow">
              <Icon name="box" size={24} />
            </div>
            <h3>Borrow with ease</h3>
            <p>
              Need a scientific calculator for tomorrow&apos;s exam, an iron, a
              guitar, or an HDMI cable? Find items already sitting in rooms
              nearby instead of buying brand new.
            </p>
            <div className="activity-examples">
              <b>Frequent items:</b>
              Scientific calculators, lab coats, noise-cancelling headphones,
              reference books, sports racquets.
            </div>
          </div>

          <div className="activity-card">
            <div className="activity-icon-wrap lend">
              <Icon name="refresh" size={24} />
            </div>
            <h3>Lend idle resources</h3>
            <p>
              Have textbooks, presentation adapters, or tools gathering dust in
              your cupboard? List them in seconds, define availability dates,
              and approve only requests you trust.
            </p>
            <div className="activity-examples">
              <b>You stay in control:</b>
              You choose who borrows, approve requested dates, and review lender
              profiles before handing anything over.
            </div>
          </div>

          <div className="activity-card">
            <div className="activity-icon-wrap request">
              <Icon name="message" size={24} />
            </div>
            <h3>Post campus requirements</h3>
            <p>
              Can&apos;t find what you need listed? Broadcast an open
              requirement to your hostel block so neighbours can offer theirs.
              No more frantic group-chat messages.
            </p>
            <div className="activity-examples">
              <b>Example needs:</b>
              &ldquo;Looking for an HDMI to USB-C adapter for tonight&apos;s
              project presentation at 6 PM.&rdquo;
            </div>
            <div style={{ marginTop: 16 }}>
              <Button variant="secondary" to="/requirements">
                View Requirements Board <Icon name="arrow" size={15} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works */}
      <section className="landing-section" id="how-it-works">
        <div className="section-head">
          <span className="eyebrow">Simple Workflow</span>
          <h2>From &ldquo;Does anyone have...&rdquo; to sorted in 4 steps</h2>
          <p>
            Every transaction is transparent, accountable, and documented from
            first request to final return.
          </p>
        </div>

        <div className="how-steps-grid">
          <div className="how-step-card">
            <div className="how-step-number">01</div>
            <h3>Browse or post</h3>
            <p>
              Search active hostel listings by category or broadcast a
              requirement for something specific you need.
            </p>
          </div>
          <div className="how-step-card">
            <div className="how-step-number">02</div>
            <h3>Request with dates</h3>
            <p>
              Pick pick-up and return dates that fit your schedule, add a polite
              note, and submit to the owner.
            </p>
          </div>
          <div className="how-step-card">
            <div className="how-step-number">03</div>
            <h3>Common-area handover</h3>
            <p>
              Meet in a designated public hostel area (lobby, floor study
              lounge) to inspect and hand over the item.
            </p>
          </div>
          <div className="how-step-card">
            <div className="how-step-number">04</div>
            <h3>Return on schedule</h3>
            <p>
              Return the item on time in good condition, confirm receipt, and
              maintain your community trust rating.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Curated Active Listings */}
      <section className="landing-section alt-bg">
        <SectionTitle
          eyebrow="Fresh from the halls"
          aside={
            <Button variant="text" to="/discover">
              View all listings in Explore <Icon name="arrow" size={16} />
            </Button>
          }
        >
          Useful things, ready to borrow right now
        </SectionTitle>
        <div className="editorial-grid">
          {featured.map((item, index) => (
            <ItemCard
              key={item.id}
              item={item}
              saved={data.savedItemIds.includes(item.id)}
              save={toggleSaveItem}
              index={index}
            />
          ))}
        </div>
      </section>

      {/* 5. Campus Benefits */}
      <section className="landing-section">
        <div className="section-head">
          <span className="eyebrow">Practical Impact</span>
          <h2>Designed specifically for hostel living</h2>
          <p>
            Sharing resources makes everyday college life more affordable, less
            cluttered, and more connected.
          </p>
        </div>

        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon">
              <Icon name="sparkles" size={22} />
            </div>
            <div className="benefit-copy">
              <h3>Save student money each semester</h3>
              <p>
                Avoid paying full retail for items you only need for one exam
                week, lab module, or short-term project.
              </p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">
              <Icon name="box" size={22} />
            </div>
            <div className="benefit-copy">
              <h3>Declutter compact hostel rooms</h3>
              <p>
                Hostel rooms have limited storage. Sharing ensures you have
                access to tools and equipment without cramming your cupboards.
              </p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">
              <Icon name="refresh" size={22} />
            </div>
            <div className="benefit-copy">
              <h3>Reduce campus waste</h3>
              <p>
                Give useful items multiple lifecycles across student batches
                instead of letting them sit unused or discarded at year-end.
              </p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">
              <Icon name="heart" size={22} />
            </div>
            <div className="benefit-copy">
              <h3>Build neighbourly community trust</h3>
              <p>
                Transform a hallway of closed doors into a collaborative,
                supportive hostel network where neighbours help neighbours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Trust & Safety Guidelines */}
      <section className="landing-section" id="safety">
        <div className="safety-box">
          <div className="section-head" style={{ marginBottom: 20 }}>
            <span className="eyebrow" style={{ color: "var(--amber)" }}>
              Trust & Safety First
            </span>
            <h2>Sensible ground rules for hostel exchanges</h2>
            <p>
              HostelShare is built on mutual respect and accountability.
              Following these core rules keeps every interaction safe and
              smooth.
            </p>
          </div>

          <div className="safety-rules-grid">
            <div className="safety-rule-card">
              <h4>1. Meet in public spaces</h4>
              <p>
                Always hand over items in well-lit hostel common areas: main
                lobbies, floor study lounges, or reception desks.
              </p>
            </div>
            <div className="safety-rule-card">
              <h4>2. Inspect condition together</h4>
              <p>
                Check functionality, cords, and cleanliness together at pick-up
                so expectations are aligned upfront.
              </p>
            </div>
            <div className="safety-rule-card">
              <h4>3. Agree on firm return dates</h4>
              <p>
                Choose realistic return windows. Never keep a neighbour waiting
                when they might need their gear back.
              </p>
            </div>
            <div className="safety-rule-card">
              <h4>4. Treat gear with care</h4>
              <p>
                Keep borrowed goods safe and dry. In the rare event of an issue,
                communicate openly with the owner right away.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Student FAQs */}
      <section className="landing-section alt-bg" id="faq">
        <div className="section-head">
          <span className="eyebrow">Clear Answers</span>
          <h2>Frequently asked questions</h2>
          <p>
            Everything you need to know about peer-to-peer resource sharing on
            campus.
          </p>
        </div>

        <div className="faq-grid">
          <div className="faq-card">
            <h4>Is HostelShare free for students?</h4>
            <p>
              Yes. HostelShare is built as a peer-to-peer student resource
              sharing platform. Students lend and borrow freely to help one
              another without rental fees.
            </p>
          </div>

          <div className="faq-card">
            <h4>What happens if an item gets damaged?</h4>
            <p>
              Borrowers are expected to replace or repair damaged items.
              Inspecting items together during handover ensures mutual agreement
              on pre-existing condition.
            </p>
          </div>

          <div className="faq-card">
            <h4>Where should we meet for handovers?</h4>
            <p>
              Always choose neutral, public areas—such as the hostel ground
              floor reception, study lounge, or common recreation area.
            </p>
          </div>

          <div className="faq-card">
            <h4>Can I lend to students in other hostel blocks?</h4>
            <p>
              Yes. Listings display the owner&apos;s hostel building (e.g. Maple
              House, Cedar Hall) so you can pick whatever is closest and most
              convenient.
            </p>
          </div>

          <div className="faq-card">
            <h4>How will student accounts be verified?</h4>
            <p>
              In Phase 4, we will introduce institutional email verification
              (@college.edu) to ensure every user is an enrolled student
              resident.
            </p>
          </div>

          <div className="faq-card">
            <h4>How can I test the prototype right now?</h4>
            <p>
              Use the demo user switcher in the top navigation to switch between
              Aisha, Mira, and Kabir. You can test submitting, approving, and
              returning loans immediately.
            </p>
          </div>
        </div>
      </section>

      {/* 8. Call to Action Banner */}
      <section className="landing-section">
        <div className="landing-cta-banner">
          <h2>Ready to experience hostel sharing?</h2>
          <p>
            Step into the live interactive prototype right now. Explore
            listings, test borrow requests, or simulate adding your own item.
          </p>
          <div className="banner-buttons">
            <Button variant="amber" to="/signup">
              Create Student Account <Icon name="arrow" size={17} />
            </Button>
            <Button variant="secondary" to="/login">
              Log In
            </Button>
            <Button
              variant="dark"
              onClick={() => {
                navigate("/discover")
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
            >
              Explore Live Demo
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
