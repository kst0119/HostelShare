import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  AppData, BorrowRequest, Category, CURRENT_USER_KEY, createBorrowRequest, createItem, createSeedData,
  dateOffset, decideRequest, Item, loadData, markNoticeRead, recordHandover, Result, saveData,
  STORAGE_KEY, toggleSaved, Transaction, User, confirmReturn, initiateReturn,
} from "./store";

type Page = "home" | "discover" | "detail" | "list" | "activity" | "transaction" | "profile";
type Flash = { type: "success" | "error"; text: string } | null;
type Dialog = "reset" | "profile" | "report" | null;

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    plus: <path d="M12 5v14M5 12h14" />, user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5a5.5 5.5 0 0 0 1.1-8.9Z" />,
    check: <path d="m5 12 4 4L19 6" />, clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    chevron: <path d="m9 18 6-6-6-6" />, menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />, upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5" /><path d="M5 15v5h14v-5" /></>,
    shield: <><path d="M12 3 5 6v5c0 4.6 2.9 8 7 10 4.1-2 7-5.4 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-5" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Button({ children, variant = "primary", onClick, type = "button", disabled, className = "" }: {
  children: ReactNode; variant?: "primary" | "secondary" | "text" | "dark"; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  return <button className={`btn btn-${variant} ${className}`} onClick={onClick} type={type} disabled={disabled}>{children}</button>;
}

function Logo({ go }: { go: (page: Page) => void }) {
  return <button className="logo" onClick={() => go("home")} aria-label="HostelShare home"><span className="logo-mark"><i /><i /></span><span>Hostel<span>Share</span></span></button>;
}

function userFor(data: AppData, id: string) { return data.users.find(user => user.id === id)!; }
function itemFor(data: AppData, id: string) { return data.items.find(item => item.id === id)!; }
function displayDate(value: string) { return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }

function Status({ status }: { status: Item["availabilityStatus"] | Transaction["status"] | BorrowRequest["status"] }) {
  const text: Record<string, string> = { available: "Available now", reserved: "Reserved", borrowed: "Currently borrowed", pending: "Awaiting reply", approved: "Ready for handover", return_pending: "Return confirmation", returned: "Returned", rejected: "Declined", cancelled: "Cancelled" };
  return <span className={`status ${status}`}><i />{text[status]}</span>;
}

function SectionTitle({ eyebrow, children, aside }: { eyebrow?: string; children: ReactNode; aside?: ReactNode }) {
  return <div className="section-title"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{children}</h2></div>{aside}</div>;
}

function Header({ page, go, data, currentUser, switchUser, openNotice }: {
  page: Page; go: (p: Page) => void; data: AppData; currentUser: User; switchUser: (id: string) => void; openNotice: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const notices = data.notices.filter(notice => notice.userId === currentUser.id);
  const unread = notices.filter(notice => !notice.read).length;
  const navigate = (p: Page) => { go(p); setOpen(false); };
  return <header className="site-header">
    <Logo go={go} />
    <nav className={open ? "nav open" : "nav"} aria-label="Primary navigation">
      <button className={page === "discover" ? "active" : ""} onClick={() => navigate("discover")}>Explore</button>
      <button className={page === "activity" || page === "transaction" ? "active" : ""} onClick={() => navigate("activity")}>My activity</button>
      <button className={page === "profile" ? "active" : ""} onClick={() => navigate("profile")}>Profile</button>
      <Button variant="dark" onClick={() => navigate("list")}><Icon name="plus" size={17} /> List an item</Button>
      <div className="notice-wrap">
        <button className="notice-button" onClick={() => setNoticesOpen(!noticesOpen)} aria-label={`${unread} unread notifications`} aria-expanded={noticesOpen}><Icon name="bell" />{unread > 0 && <i>{unread}</i>}</button>
        {noticesOpen && <div className="notice-menu"><b>Notifications</b>{notices.length ? notices.slice(0, 5).map(notice => <button className={notice.read ? "" : "unread"} key={notice.id} onClick={() => { openNotice(notice.id); setNoticesOpen(false); }}><span>{notice.text}</span><small>{new Date(notice.createdAt).toLocaleDateString()}</small></button>) : <p>No updates yet.</p>}</div>}
      </div>
      <label className="demo-switcher"><span>Demo user · not authenticated</span><select value={currentUser.id} onChange={event => switchUser(event.target.value)} aria-label="Switch demo user">{data.users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
    </nav>
    <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu"><Icon name={open ? "close" : "menu"} /></button>
  </header>;
}

function Toast({ flash, dismiss }: { flash: Flash; dismiss: () => void }) {
  if (!flash) return null;
  return <div className={`toast ${flash.type}`} role={flash.type === "error" ? "alert" : "status"}><Icon name={flash.type === "success" ? "check" : "close"} /><span>{flash.text}</span><button onClick={dismiss} aria-label="Dismiss message"><Icon name="close" size={16} /></button></div>;
}

function ItemCard({ item, data, select, saved, save, index = 0 }: { item: Item; data: AppData; select: (item: Item) => void; saved: boolean; save: (id: string) => void; index?: number }) {
  const owner = userFor(data, item.ownerId);
  return <article className={`item-card item-${index % 4}`} onClick={() => select(item)} tabIndex={0} onKeyDown={event => event.key === "Enter" && select(item)}>
    <div className="item-image"><img src={item.image} alt={item.name} /><Status status={item.availabilityStatus} /><button className={`heart ${saved ? "saved" : ""}`} aria-label={`${saved ? "Remove" : "Save"} ${item.name}`} onClick={event => { event.stopPropagation(); save(item.id); }}><Icon name="heart" size={18} /></button></div>
    <div className="item-meta"><span>{item.category}</span><span>{item.condition}</span></div><h3>{item.name}</h3>
    <div className="owner-row"><span className="mini-avatar">{owner.avatar}</span><span><b>{owner.name}</b><small>{owner.hostel} · {owner.roomNumber}</small></span><Icon name="arrow" /></div>
  </article>;
}

function Home({ go, data, select, save }: { go: (p: Page) => void; data: AppData; select: (i: Item) => void; save: (id: string) => void }) {
  const featured = data.items.slice(0, 4);
  return <main>
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow">Your campus, better connected</span><h1>Need something?<br />Your hostel probably <em>has it.</em></h1><p>Borrow useful things from students just a few doors away. Spend less, waste less, and know your neighbours a little better.</p><div className="hero-actions"><Button onClick={() => go("discover")}>Explore shared items <Icon name="arrow" /></Button><Button variant="text" onClick={() => go("list")}>List an item <Icon name="plus" /></Button></div><div className="community-proof"><div className="faces">{data.users.map(user => <span key={user.id}>{user.avatar}</span>)}<span>+</span></div><p><b>Demo campus community</b><br />Switch students to test both sides</p></div></div>
      <div className="hero-art"><div className="hero-arch"><img src={featured[0].image} alt="Calculator and stationery on a study desk" /></div><div className="hero-small"><img src={featured[1].image} alt="Headphones ready to borrow" /><span>{data.items.filter(item => item.availabilityStatus === "available").length} items ready</span></div><div className="float-note"><span className="mini-avatar">HS</span><p><b>One shared item</b><br />is one less thing to buy</p><Icon name="check" /></div><div className="scribble">share<br /><i>more</i></div></div>
    </section>
    <section className="how"><SectionTitle eyebrow="Simple by design">From “does anyone have…”<br />to “sorted.”</SectionTitle><div className="steps"><div><span>01</span><Icon name="search" /><h3>Find it nearby</h3><p>Search useful things already sitting in your hostel.</p></div><div><span>02</span><Icon name="clock" /><h3>Ask to borrow</h3><p>Choose valid dates and send the owner a friendly note.</p></div><div><span>03</span><Icon name="heart" /><h3>Return the good</h3><p>Meet, exchange, confirm the return. Community works.</p></div></div></section>
    <section className="curated"><SectionTitle eyebrow="Fresh from the halls" aside={<Button variant="text" onClick={() => go("discover")}>View everything <Icon name="arrow" /></Button>}>Useful things, ready to roam.</SectionTitle><div className="editorial-grid">{featured.map((item, index) => <ItemCard key={item.id} item={item} data={data} select={select} saved={data.savedItemIds.includes(item.id)} save={save} index={index} />)}</div></section>
    <section className="trust-band"><div className="trust-art"><img src={data.items[2].image} alt="A book ready to be shared" /><span>Good things<br />go around.</span></div><div className="trust-copy"><span className="eyebrow">Built on neighbourly trust</span><h2>More than borrowing.<br />It’s belonging.</h2><p>Clear histories, community feedback, and transparent demo trust signals help everyone understand an exchange. They are not identity verification.</p><div className="trust-stats"><div><b>{data.transactions.length}</b><span>demo exchanges</span></div><div><b>{data.transactions.filter(t => t.status === "returned").length}</b><span>completed returns</span></div><div><b>{data.users.length}</b><span>demo students</span></div></div><Button variant="secondary" onClick={() => go("profile")}>How trust works <Icon name="arrow" /></Button></div></section>
  </main>;
}

function Discover({ data, currentUser, select, save }: { data: AppData; currentUser: User; select: (i: Item) => void; save: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Recommended");
  const [availableOnly, setAvailableOnly] = useState(false);
  const categories = ["All", "Study", "Electronics", "Everyday", "Sports", "Other"];
  const filtered = useMemo(() => {
    const result = data.items.filter(item => (category === "All" || item.category === category) && (!availableOnly || item.availabilityStatus === "available") && `${item.name} ${item.description} ${userFor(data, item.ownerId).name}`.toLowerCase().includes(query.toLowerCase()));
    return [...result].sort((a, b) => sort === "Available first" ? Number(b.availabilityStatus === "available") - Number(a.availabilityStatus === "available") : sort === "A–Z" ? a.name.localeCompare(b.name) : 0);
  }, [data, query, category, sort, availableOnly]);
  return <main className="page">
    <section className="discover-head"><div><span className="eyebrow">{new Date().toLocaleDateString("en", { weekday: "long", day: "numeric", month: "long" })}</span><h1>Good morning, {currentUser.name.split(" ")[0]}.</h1><p>What would make today a little easier?</p></div><div className="demo-banner"><Icon name="user" /><span><b>Local demo mode</b>Browsing as {currentUser.name}</span></div></section>
    <section className="search-wrap"><Icon name="search" size={24} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search calculators, chargers, books…" aria-label="Search items" /><kbd>Live</kbd></section>
    <div className="filter-line"><div className="category-row">{categories.map(name => <button key={name} className={category === name ? "selected" : ""} onClick={() => setCategory(name)}>{name}</button>)}</div><label className="check-control"><input type="checkbox" checked={availableOnly} onChange={event => setAvailableOnly(event.target.checked)} />Available only</label></div>
    <div className="results-bar"><p><b>{filtered.length} things</b> found near {currentUser.hostel}</p><label>Sort by <select value={sort} onChange={event => setSort(event.target.value)}><option>Recommended</option><option>Available first</option><option>A–Z</option></select></label></div>
    {filtered.length ? <div className="editorial-grid discovery-grid">{filtered.map((item, index) => <ItemCard key={item.id} item={item} data={data} select={select} saved={data.savedItemIds.includes(item.id)} save={save} index={index} />)}</div> : <div className="empty"><span className="empty-orbit"><Icon name="search" size={28} /></span><h2>Nothing hiding under that name.</h2><p>Try a broader search or clear the availability filter.</p><Button variant="secondary" onClick={() => { setQuery(""); setCategory("All"); setAvailableOnly(false); }}>Clear all filters</Button></div>}
  </main>;
}

function Detail({ data, item, currentUser, submit, go }: { data: AppData; item: Item; currentUser: User; submit: (input: { itemId: string; borrowerId: string; requestedFrom: string; requestedUntil: string; message: string }) => Result; go: (p: Page) => void }) {
  const owner = userFor(data, item.ownerId);
  const [from, setFrom] = useState(dateOffset(1));
  const [until, setUntil] = useState(dateOffset(2));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const send = () => {
    setBusy(true); setError("");
    const result = submit({ itemId: item.id, borrowerId: currentUser.id, requestedFrom: from, requestedUntil: until, message: message.trim() });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setDone(true);
  };
  if (done) return <main className="page success-page"><div className="success-mark"><Icon name="check" size={38} /></div><span className="eyebrow">Request stored</span><h1>It’s in {owner.name.split(" ")[0]}’s hands now.</h1><p>Switch to {owner.name} in the demo-user control to approve or decline it.</p><div><Button onClick={() => go("activity")}>See my activity <Icon name="arrow" /></Button><Button variant="text" onClick={() => go("discover")}>Keep exploring</Button></div></main>;
  const ownItem = item.ownerId === currentUser.id;
  return <main className="page detail-page"><button className="back-link" onClick={() => go("discover")}>← Back to shared items</button><div className="detail-layout">
    <div className="detail-image"><img src={item.image} alt={item.name} /><span className="photo-credit">Shared by {owner.name.split(" ")[0]}</span></div>
    <div className="detail-copy"><div className="item-meta"><span>{item.category}</span><span>{item.condition} condition</span></div><Status status={item.availabilityStatus} /><h1>{item.name}</h1><p className="description">{item.description}</p>
      <div className="owner-panel"><span className="owner-avatar">{owner.avatar}</span><div><small>Meet your lender</small><b>{owner.name}</b><span>{owner.hostel} · {owner.roomNumber} · {owner.rating} rating</span></div><span className="trusted"><Icon name="shield" size={16} /> Demo profile</span></div>
      <div className="borrow-box"><h3>Choose your borrowing window</h3><p className="availability-copy">Available {displayDate(item.availableFrom)} to {displayDate(item.availableUntil)}</p><div className="field-pair"><label>Pick up<input type="date" min={dateOffset(0)} value={from} onChange={event => setFrom(event.target.value)} /></label><label>Return by<input type="date" min={from} value={until} onChange={event => setUntil(event.target.value)} /></label></div><label>Note to {owner.name.split(" ")[0]} <span>Optional</span><textarea value={message} onChange={event => setMessage(event.target.value)} placeholder="Hi! I need this for tomorrow's class…" /></label>{error && <p className="form-error" role="alert">{error}</p>}<Button onClick={send} disabled={busy || ownItem || item.availabilityStatus !== "available"} className="wide">{busy ? "Saving request…" : ownItem ? "This is your item" : item.availabilityStatus !== "available" ? "Unavailable right now" : <>Request to borrow <Icon name="arrow" /></>}</Button><small>Submitting stores a real local demo request. It does not reserve the item until approval.</small></div>
    </div>
  </div></main>;
}

function ListItem({ currentUser, add, go }: { currentUser: User; add: (item: Omit<Item, "id" | "availabilityStatus">) => Result; go: (p: Page) => void }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [form, setForm] = useState({ name: "", description: "", category: "Study" as Category, condition: "Great", image: "", from: dateOffset(0), until: dateOffset(30) });
  const fileRef = useRef<HTMLInputElement>(null);
  const update = (key: string, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  const next = () => {
    if (step === 1 && (!form.name.trim() || form.description.trim().length < 12)) return setError("Add a name and a description of at least 12 characters.");
    if (step === 2 && !form.image) return setError("Choose a clear photo before continuing.");
    setError(""); setStep(current => Math.min(3, current + 1));
  };
  const loadImage = (file?: File) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return setError("That image is larger than 8MB. Choose a smaller file.");
    const reader = new FileReader();
    reader.onload = () => { update("image", String(reader.result)); setError(""); };
    reader.onerror = () => setError("That photo could not be read. Try another file.");
    reader.readAsDataURL(file);
  };
  const publish = (event: FormEvent) => {
    event.preventDefault();
    const result = add({ name: form.name.trim(), description: form.description.trim(), category: form.category, condition: form.condition, image: form.image, ownerId: currentUser.id, availableFrom: form.from, availableUntil: form.until });
    if (!result.ok) return setError(result.error);
    setDone(form.name);
  };
  if (done) return <main className="page success-page"><div className="success-mark"><Icon name="check" size={38} /></div><span className="eyebrow">Now sharing</span><h1>{done} is live.</h1><p>The item is persisted and visible in Explore and on {currentUser.name.split(" ")[0]}’s profile.</p><div><Button onClick={() => go("discover")}>See it in Explore <Icon name="arrow" /></Button><Button variant="text" onClick={() => go("profile")}>View my listed items</Button></div></main>;
  return <main className="page listing-page"><div className="listing-intro"><span className="eyebrow">Pass it on</span><h1>What could your neighbour use?</h1><p>Listing as <b>{currentUser.name}</b>. You stay in control of every request.</p><div className="listing-quote">“The calculator I borrowed saved my stats exam.”<span>— Neha, Maple House</span></div></div>
    <form className="listing-form" onSubmit={publish}><div className="stepper">{[1, 2, 3].map(number => <div key={number} className={number <= step ? "active" : ""}><i>{number < step ? <Icon name="check" size={14} /> : number}</i><span>{["The item", "A good photo", "Availability"][number - 1]}</span></div>)}</div>
      {step === 1 && <div className="form-step"><span className="step-label">Step one of three</span><h2>Tell us about the item.</h2><label>What is it called?<input autoFocus value={form.name} onChange={event => update("name", event.target.value)} placeholder="e.g. Scientific calculator" /></label><label>What should borrowers know?<textarea value={form.description} onChange={event => update("description", event.target.value)} placeholder="Condition, what’s included, and anything to keep in mind…" /></label><div className="field-pair"><label>Category<select value={form.category} onChange={event => update("category", event.target.value)}><option>Study</option><option>Electronics</option><option>Everyday</option><option>Sports</option><option>Other</option></select></label><label>Condition<select value={form.condition} onChange={event => update("condition", event.target.value)}><option>Like new</option><option>Great</option><option>Good</option><option>Loved</option></select></label></div></div>}
      {step === 2 && <div className="form-step"><span className="step-label">Step two of three</span><h2>Show it in its best light.</h2><p>A clear photo builds confidence. Natural daylight works beautifully.</p><input className="file-input" type="file" accept="image/jpeg,image/png,image/webp" ref={fileRef} onChange={event => loadImage(event.target.files?.[0])} />{form.image ? <div className="upload-preview"><img src={form.image} alt="Your item preview" /><button type="button" onClick={() => fileRef.current?.click()}>Choose another</button></div> : <button type="button" className="upload-zone" onClick={() => fileRef.current?.click()}><Icon name="upload" size={30} /><b>Choose a photo</b><span>JPG, PNG or WebP · up to 8MB</span></button>}</div>}
      {step === 3 && <div className="form-step"><span className="step-label">Final step</span><h2>When can it go out?</h2><div className="field-pair"><label>Available from<input type="date" min={dateOffset(0)} value={form.from} onChange={event => update("from", event.target.value)} /></label><label>Available until<input type="date" min={form.from} value={form.until} onChange={event => update("until", event.target.value)} /></label></div><div className="review-strip"><img src={form.image} alt="" /><div><small>You’re listing</small><b>{form.name}</b><span>{form.condition} · {form.category}</span></div></div></div>}
      {error && <p className="form-error" role="alert">{error}</p>}<div className="form-nav">{step > 1 && <Button variant="text" onClick={() => { setStep(current => current - 1); setError(""); }}>← Back</Button>}<span />{step < 3 ? <Button onClick={next}>Continue <Icon name="arrow" /></Button> : <Button type="submit">Publish item <Icon name="check" /></Button>}</div>
    </form>
  </main>;
}

function Activity({ data, currentUser, decide, openTransaction, selectItem, go }: { data: AppData; currentUser: User; decide: (id: string, decision: "approved" | "rejected") => void; openTransaction: (id: string) => void; selectItem: (item: Item) => void; go: (p: Page) => void }) {
  const [tab, setTab] = useState<"overview" | "borrowing" | "lending" | "history">("overview");
  const incoming = data.requests.filter(request => request.ownerId === currentUser.id && request.status === "pending");
  const sent = data.requests.filter(request => request.borrowerId === currentUser.id && request.status === "pending");
  const active = data.transactions.filter(transaction => [transaction.ownerId, transaction.borrowerId].includes(currentUser.id) && transaction.status !== "returned");
  const history = data.transactions.filter(transaction => [transaction.ownerId, transaction.borrowerId].includes(currentUser.id) && transaction.status === "returned");
  const showIncoming = tab === "overview" || tab === "lending";
  const showSent = tab === "overview" || tab === "borrowing";
  const filteredActive = active.filter(transaction => tab === "lending" ? transaction.ownerId === currentUser.id : tab === "borrowing" ? transaction.borrowerId === currentUser.id : true);
  return <main className="page activity-page"><SectionTitle eyebrow="Borrowing, lending, belonging" aside={<Button variant="secondary" onClick={() => go("discover")}>Find something <Icon name="search" /></Button>}>My activity</SectionTitle>
    <div className="activity-tabs" role="tablist">{(["overview", "borrowing", "lending", "history"] as const).map(name => <button role="tab" aria-selected={tab === name} className={tab === name ? "active" : ""} onClick={() => setTab(name)} key={name}>{name[0].toUpperCase() + name.slice(1)}</button>)}</div>
    {tab === "history" ? <History data={data} transactions={history} /> : <>
      {showIncoming && <section className="incoming-section"><div className="subhead"><h2>Incoming requests</h2><span>{incoming.length} waiting</span></div>{incoming.length ? incoming.map(request => { const item = itemFor(data, request.itemId); const borrower = userFor(data, request.borrowerId); return <div className="request-row" key={request.id}><img src={item.image} alt="" /><div className="request-main"><span className="mini-avatar">{borrower.avatar}</span><p><b>{borrower.name}</b> would like to borrow <strong>{item.name}</strong><small>{displayDate(request.requestedFrom)}—{displayDate(request.requestedUntil)}{request.message && ` · “${request.message}”`}</small></p></div><div className="request-actions"><Button variant="secondary" onClick={() => decide(request.id, "rejected")}>Decline</Button><Button onClick={() => decide(request.id, "approved")}>Approve <Icon name="check" /></Button></div></div>; }) : <div className="small-empty"><Icon name="check" /><span><b>You’re all caught up.</b><br />New owner requests will appear here.</span></div>}</section>}
      <div className="activity-columns"><section><div className="subhead"><h2>In motion</h2><span>{filteredActive.length} active</span></div>{filteredActive.length ? filteredActive.map(transaction => { const item = itemFor(data, transaction.itemId); const other = userFor(data, transaction.ownerId === currentUser.id ? transaction.borrowerId : transaction.ownerId); return <div className="motion-card" key={transaction.id}><div className="motion-top"><img src={item.image} alt="" /><Status status={transaction.status} /></div><h3>{item.name}</h3><p>{transaction.ownerId === currentUser.id ? `Borrowed by ${other.name}` : `From ${other.name}`}</p><div className="due"><Icon name="clock" /><span><small>Due</small><b>{displayDate(transaction.dueAt)}</b></span></div><Button variant="dark" className="wide" onClick={() => openTransaction(transaction.id)}>Open transaction <Icon name="arrow" /></Button></div>; }) : <div className="paper-note"><span>Nothing in motion</span><h3>Active exchanges will live here.</h3><Button variant="text" onClick={() => go("discover")}>Explore items <Icon name="arrow" /></Button></div>}</section>
      <section>{showSent && <><div className="subhead"><h2>Sent requests</h2><span>{sent.length} pending</span></div>{sent.length ? <div className="sent-list">{sent.map(request => <button key={request.id} onClick={() => selectItem(itemFor(data, request.itemId))}><img src={itemFor(data, request.itemId).image} alt="" /><span><b>{itemFor(data, request.itemId).name}</b><small>Waiting for {userFor(data, request.ownerId).name}</small></span><Status status={request.status} /></button>)}</div> : <div className="small-empty"><Icon name="clock" /><span><b>No pending requests.</b><br />Requests you send will appear here.</span></div>}</>}<div className="history-list"><h3>Recently completed</h3>{history.slice(0, 3).map(transaction => <button key={transaction.id} onClick={() => openTransaction(transaction.id)}><span className="history-icon"><Icon name="check" /></span><p><b>{itemFor(data, transaction.itemId).name}</b><small>Returned {transaction.returnedAt ? new Date(transaction.returnedAt).toLocaleDateString() : ""}</small></p><Icon name="chevron" size={16} /></button>)}</div></section></div>
    </>}
  </main>;
}

function History({ data, transactions }: { data: AppData; transactions: Transaction[] }) {
  return <section className="full-history"><div className="subhead"><h2>Completed returns</h2><span>{transactions.length} recorded</span></div>{transactions.length ? transactions.map(transaction => <div key={transaction.id}><img src={itemFor(data, transaction.itemId).image} alt="" /><span><b>{itemFor(data, transaction.itemId).name}</b><small>{userFor(data, transaction.borrowerId).name} and {userFor(data, transaction.ownerId).name}</small></span><time>{transaction.returnedAt ? new Date(transaction.returnedAt).toLocaleString() : ""}</time><Status status="returned" /></div>) : <div className="empty"><h2>No completed exchanges yet.</h2><p>Confirmed returns will form your transaction history.</p></div>}</section>;
}

function TransactionPage({ data, transaction, currentUser, mutate, go }: { data: AppData; transaction: Transaction; currentUser: User; mutate: (action: "handover" | "initiate-return" | "confirm-return", id: string) => void; go: (p: Page) => void }) {
  const [verified, setVerified] = useState(false);
  const item = itemFor(data, transaction.itemId);
  const borrower = userFor(data, transaction.borrowerId);
  const owner = userFor(data, transaction.ownerId);
  const returned = transaction.status === "returned";
  return <main className="page transaction-page"><button className="back-link" onClick={() => go("activity")}>← Back to My activity</button><div className="transaction-head"><div><span className="eyebrow">Transaction · {transaction.id.slice(-8)}</span><h1>{returned ? "Safe and sound." : "One item, two neighbours."}</h1><p>This screen is shared by both demo users. QR-style verification is simulated and does not verify identity.</p></div><Status status={transaction.status} /></div>
    <div className="transaction-grid"><section className="exchange-card"><div className="people"><div><span className="owner-avatar">{borrower.avatar}</span><small>Borrower</small><b>{borrower.name}</b><p>{borrower.hostel} · {borrower.roomNumber}</p></div><span className="exchange-line"><i /><Icon name="arrow" /><i /></span><div><span className="owner-avatar lender">{owner.avatar}</span><small>Lender</small><b>{owner.name}</b><p>{owner.hostel} · {owner.roomNumber}</p></div></div><div className="transaction-item"><img src={item.image} alt={item.name} /><div><small>Sharing</small><h3>{item.name}</h3><span>{item.condition} condition</span></div><div><small>Due back</small><b>{displayDate(transaction.dueAt)}</b></div></div>
      <div className="timeline"><div className="done"><i><Icon name="check" /></i><span><b>Request approved</b><small>Item reserved</small></span></div><div className={transaction.handoverAt ? "done" : transaction.status === "approved" ? "current" : ""}><i>{transaction.handoverAt ? <Icon name="check" /> : "2"}</i><span><b>Handover confirmed</b><small>{transaction.handoverAt ? new Date(transaction.handoverAt).toLocaleString() : "Waiting to meet"}</small></span></div><div className={returned ? "done" : transaction.status === "return_pending" ? "current" : ""}><i>{returned ? <Icon name="check" /> : "3"}</i><span><b>Return confirmed</b><small>{transaction.returnedAt ? new Date(transaction.returnedAt).toLocaleString() : transaction.status === "return_pending" ? "Awaiting participant confirmation" : `Due ${displayDate(transaction.dueAt)}`}</small></span></div></div>
    </section><aside className="verify-card"><span className="eyebrow">{returned ? "Completed" : "Meet & verify"}</span><h2>{returned ? "Thanks for sharing well." : transaction.status === "approved" ? "Ready to hand it over?" : transaction.status === "borrowed" ? "Time to return it?" : "Confirm the return."}</h2><p>Acting as <b>{currentUser.name}</b>. Both participants are authorized in this local simulation.</p>
      {transaction.status === "approved" && !verified && <><div className="qr" aria-label="Decorative simulated QR pattern">{Array.from({ length: 49 }).map((_, index) => <i key={index} className={[0,1,2,7,9,14,15,16,32,33,34,39,41,46,47,48].includes(index) || (index * 7) % 11 < 4 ? "dark" : ""} />)}</div><Button className="wide" onClick={() => setVerified(true)}>Simulate code check <Icon name="arrow" /></Button></>}
      {transaction.status === "approved" && verified && <div className="verified-box"><div className="success-mark"><Icon name="check" /></div><h3>Demo check complete</h3><p>Inspect the physical item together before confirming.</p><Button className="wide" onClick={() => mutate("handover", transaction.id)}>Confirm handover</Button></div>}
      {transaction.status === "borrowed" && <div className="verified-box"><div className="return-symbol"><Icon name="arrow" size={30} /></div><p>Initiating a return asks the other participant to confirm receipt.</p><Button className="wide" onClick={() => mutate("initiate-return", transaction.id)}>Start return</Button></div>}
      {transaction.status === "return_pending" && <div className="verified-box"><div className="success-mark pending"><Icon name="clock" /></div><p>The physical return should happen before this confirmation.</p><Button className="wide" onClick={() => mutate("confirm-return", transaction.id)}>Confirm item received</Button></div>}
      {returned && <div className="verified-box"><div className="success-mark"><Icon name="check" /></div><h3>Return recorded</h3><Button variant="secondary" onClick={() => go("activity")}>View history</Button></div>}<small className="safety-note"><Icon name="shield" size={16} /> Meet in a shared area and inspect the item together.</small>
    </aside></div>
  </main>;
}

function Profile({ data, currentUser, select, save, openDialog }: { data: AppData; currentUser: User; select: (item: Item) => void; save: (id: string) => void; openDialog: (dialog: Dialog) => void }) {
  const mine = data.items.filter(item => item.ownerId === currentUser.id);
  const completed = data.transactions.filter(transaction => [transaction.ownerId, transaction.borrowerId].includes(currentUser.id) && transaction.status === "returned");
  return <main className="page profile-page"><section className="profile-hero"><div className="profile-avatar">{currentUser.avatar}<span><Icon name="check" size={15} /></span></div><div><span className="eyebrow">{currentUser.hostel} · Room {currentUser.roomNumber} · Demo identity</span><h1>{currentUser.name}</h1><p>{currentUser.bio}</p><div className="profile-chips"><span>{currentUser.rating} community rating</span><span>{completed.length} completed exchanges</span></div></div><Button variant="secondary" onClick={() => openDialog("profile")}>Edit profile</Button></section>
    <div className="profile-grid"><section className="trust-meter"><span className="eyebrow">Community trust</span><div className="meter-score"><b>{Math.round(currentUser.rating * 20)}</b><span>/ 100<br />Demo standing</span></div><div className="meter"><i /></div><p>This transparent demo indicator derives from the sample rating. It does not verify identity or guarantee a transaction.</p><ul><li><Icon name="check" /> {completed.length} confirmed returns</li><li><Icon name="check" /> Rating visible to neighbours</li><li><Icon name="check" /> Transaction history retained locally</li></ul></section><section className="profile-stats"><div><b>{mine.length}</b><span>Things listed</span></div><div><b>{data.transactions.filter(t => t.borrowerId === currentUser.id).length}</b><span>Things borrowed</span></div><div><b>{data.savedItemIds.length}</b><span>Things saved</span></div><blockquote>“Clear handovers and kind messages make sharing feel easy.”<cite>— HostelShare community note</cite></blockquote></section></div>
    <SectionTitle eyebrow="From your cupboard" aside={<span className="count">{mine.length} listed</span>}>Your shared items</SectionTitle>{mine.length ? <div className="editorial-grid">{mine.map((item, index) => <ItemCard key={item.id} item={item} data={data} select={select} saved={data.savedItemIds.includes(item.id)} save={save} index={index} />)}</div> : <div className="small-empty"><Icon name="plus" /><span><b>No personal listings yet.</b><br />Use List an item to share something.</span></div>}<div className="profile-footer"><button onClick={() => openDialog("report")}>Report an issue</button><button onClick={() => openDialog("reset")}>Reset demo data</button></div>
  </main>;
}

function Modal({ dialog, close, data, currentUser, updateProfile, reset, report }: { dialog: Dialog; close: () => void; data: AppData; currentUser: User; updateProfile: (user: User) => void; reset: () => void; report: (text: string) => void }) {
  const [profile, setProfile] = useState(currentUser);
  const [issue, setIssue] = useState("");
  if (!dialog) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && close()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close" onClick={close} aria-label="Close dialog"><Icon name="close" /></button>
    {dialog === "reset" && <><span className="eyebrow">Consequential action</span><h2 id="modal-title">Reset the local demo?</h2><p>This removes listed items, requests, transactions, saved items, and profile edits from this browser. It then restores the documented sample dataset.</p><div className="modal-actions"><Button variant="secondary" onClick={close}>Keep my data</Button><Button onClick={reset}>Reset demo data</Button></div></>}
    {dialog === "profile" && <form onSubmit={event => { event.preventDefault(); updateProfile(profile); }}><span className="eyebrow">Local demo profile</span><h2 id="modal-title">Edit your details</h2><label>Name<input required value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value, avatar: event.target.value.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase() })} /></label><div className="field-pair"><label>Hostel<input required value={profile.hostel} onChange={event => setProfile({ ...profile, hostel: event.target.value })} /></label><label>Room<input required value={profile.roomNumber} onChange={event => setProfile({ ...profile, roomNumber: event.target.value })} /></label></div><label>Short bio<textarea required minLength={12} value={profile.bio} onChange={event => setProfile({ ...profile, bio: event.target.value })} /></label><div className="modal-actions"><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit">Save profile</Button></div></form>}
    {dialog === "report" && <form onSubmit={event => { event.preventDefault(); report(issue); }}><span className="eyebrow">Local support simulation</span><h2 id="modal-title">Report an issue</h2><p>This prototype stores no support ticket. Your note is acknowledged locally and is not sent to a server.</p><label>What happened?<textarea required minLength={10} value={issue} onChange={event => setIssue(event.target.value)} placeholder="Describe the issue clearly…" /></label><div className="modal-actions"><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit">Acknowledge locally</Button></div></form>}
  </section></div>;
}

function Footer({ go }: { go: (p: Page) => void }) {
  return <footer><div><Logo go={go} /><p>Good things are better shared.</p></div><div><b>Explore</b><button onClick={() => go("discover")}>Browse items</button><button onClick={() => go("list")}>List an item</button></div><div><b>Your account</b><button onClick={() => go("profile")}>Profile and trust</button><button onClick={() => go("activity")}>My activity</button></div><div className="footer-note"><span>Made for hostel life.</span><small>Prototype · Local data · Simulated identities</small></div></footer>;
}

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem(CURRENT_USER_KEY) || "user-aisha");
  const [page, setPage] = useState<Page>("home");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [flash, setFlash] = useState<Flash>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const currentUser = userFor(data, data.users.some(user => user.id === currentUserId) ? currentUserId : data.users[0].id);
  useEffect(() => saveData(data), [data]);
  useEffect(() => { localStorage.setItem(CURRENT_USER_KEY, currentUser.id); }, [currentUser.id]);
  useEffect(() => { if (!flash) return; const timeout = window.setTimeout(() => setFlash(null), 4200); return () => clearTimeout(timeout); }, [flash]);
  const go = (next: Page) => { setPage(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const apply = (result: Result, successPage?: Page) => {
    if (!result.ok) { setFlash({ type: "error", text: result.error }); return false; }
    setData(result.data); setFlash({ type: "success", text: result.message }); if (successPage) go(successPage); return true;
  };
  const select = (item: Item) => { setSelectedItemId(item.id); go("detail"); };
  const openTransaction = (id: string) => { setSelectedTransactionId(id); go("transaction"); };
  const mutateTransaction = (action: "handover" | "initiate-return" | "confirm-return", id: string) => {
    const result = action === "handover" ? recordHandover(data, id, currentUser.id) : action === "initiate-return" ? initiateReturn(data, id, currentUser.id) : confirmReturn(data, id, currentUser.id);
    apply(result);
  };
  const openNotice = (id: string) => {
    const notice = data.notices.find(candidate => candidate.id === id);
    if (!notice) return;
    setData(current => markNoticeRead(current, id));
    if (notice.target === "transaction" && notice.transactionId) openTransaction(notice.transactionId); else go("activity");
  };
  const switchUser = (id: string) => { setCurrentUserId(id); setFlash({ type: "success", text: `Demo user switched to ${userFor(data, id).name}.` }); go(page === "detail" ? "discover" : page); };
  const selectedItem = data.items.find(item => item.id === selectedItemId);
  const selectedTransaction = data.transactions.find(transaction => transaction.id === selectedTransactionId);
  let content: ReactNode;
  if (page === "home") content = <Home go={go} data={data} select={select} save={id => setData(current => toggleSaved(current, id))} />;
  else if (page === "discover") content = <Discover data={data} currentUser={currentUser} select={select} save={id => setData(current => toggleSaved(current, id))} />;
  else if (page === "detail" && selectedItem) content = <Detail data={data} item={selectedItem} currentUser={currentUser} submit={input => { const result = createBorrowRequest(data, input); if (result.ok) { setData(result.data); setFlash({ type: "success", text: result.message }); } return result; }} go={go} />;
  else if (page === "list") content = <ListItem currentUser={currentUser} add={item => { const result = createItem(data, item); if (result.ok) { setData(result.data); setFlash({ type: "success", text: result.message }); } return result; }} go={go} />;
  else if (page === "activity") content = <Activity data={data} currentUser={currentUser} decide={(id, decision) => apply(decideRequest(data, id, currentUser.id, decision))} openTransaction={openTransaction} selectItem={select} go={go} />;
  else if (page === "transaction" && selectedTransaction) content = <TransactionPage data={data} transaction={selectedTransaction} currentUser={currentUser} mutate={mutateTransaction} go={go} />;
  else content = <Profile data={data} currentUser={currentUser} select={select} save={id => setData(current => toggleSaved(current, id))} openDialog={setDialog} />;
  return <div className="app"><Header page={page} go={go} data={data} currentUser={currentUser} switchUser={switchUser} openNotice={openNotice} /><div key={`${page}-${currentUser.id}`} className="page-enter">{content}</div>{page === "home" && <Footer go={go} />}<Toast flash={flash} dismiss={() => setFlash(null)} /><Modal dialog={dialog} close={() => setDialog(null)} data={data} currentUser={currentUser} updateProfile={user => { setData(current => ({ ...current, users: current.users.map(candidate => candidate.id === user.id ? user : candidate) })); setDialog(null); setFlash({ type: "success", text: "Profile changes saved locally." }); }} reset={() => { const fresh = createSeedData(); localStorage.removeItem(STORAGE_KEY); setData(fresh); setCurrentUserId("user-aisha"); setSelectedItemId(null); setSelectedTransactionId(null); setDialog(null); setFlash({ type: "success", text: "Demo data restored to its initial state." }); go("home"); }} report={() => { setDialog(null); setFlash({ type: "success", text: "Issue acknowledged locally. No support ticket was sent." }); }} /></div>;
}
