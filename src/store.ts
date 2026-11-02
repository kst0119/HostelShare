export type Category = "Study" | "Electronics" | "Everyday" | "Sports" | "Other"

export type AvailabilityStatus = "available" | "reserved" | "borrowed"

export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled"

export type TransactionStatus = "approved" | "borrowed" | "return_pending" | "returned"

export type User = {
  id: string

  name: string

  hostel: string

  roomNumber: string

  avatar: string

  rating: number

  bio: string
}

export type Item = {
  id: string

  name: string

  description: string

  category: Category

  image: string

  condition: string

  ownerId: string

  availabilityStatus: AvailabilityStatus

  availableFrom: string

  availableUntil: string
}

export type BorrowRequest = {
  id: string

  itemId: string

  borrowerId: string

  ownerId: string

  requestedFrom: string

  requestedUntil: string

  message: string

  status: RequestStatus

  createdAt: string
}

export type Transaction = {
  id: string

  requestId: string

  itemId: string

  borrowerId: string

  ownerId: string

  status: TransactionStatus

  handoverAt: string | null

  dueAt: string

  returnedAt: string | null
}

export type RequirementStatus = "open" | "fulfilled" | "cancelled"

export type OfferStatus = "pending" | "accepted" | "declined"

export type RequirementOffer = {
  id: string
  requirementId: string
  offeredById: string
  message: string
  itemId?: string
  itemName?: string
  availableFrom?: string
  availableUntil?: string
  status: OfferStatus
  createdAt: string
}

export type Requirement = {
  id: string
  title: string
  description: string
  category: Category
  authorId: string
  neededBy: string
  returnDate?: string
  status: RequirementStatus
  createdAt: string
  offers: RequirementOffer[]
}

export type Notice = {
  id: string

  userId: string

  text: string

  target: "activity" | "transaction" | "requirements" | "profile"

  transactionId?: string

  requirementId?: string

  read: boolean

  createdAt: string
}

export type Review = {
  id: string
  transactionId: string
  reviewerId: string
  recipientId: string
  rating: number
  comment: string
  createdAt: string
}

export type AppData = {
  version: 4

  users: User[]

  items: Item[]

  requests: BorrowRequest[]

  transactions: Transaction[]

  notices: Notice[]

  savedItemIds: string[]

  requirements: Requirement[]

  reviews: Review[]
}

export type Result<T = AppData> =
  | {
      ok: true
      data: T
      message: string
    }
  | {
      ok: false
      error: string
    }

const photos = {
  calculator:
    "https://images.unsplash.com/photo-1685038955804-3de172e7ff35?auto=format&fit=crop&w=1200&q=85",
  headphones:
    "https://images.unsplash.com/photo-1511377107391-116a9d5d20b5?auto=format&fit=crop&w=1200&q=85",
  books:
    "https://images.unsplash.com/photo-1517090823101-30a5937ceb3c?auto=format&fit=crop&w=1200&q=85",
  desk:
    "https://images.unsplash.com/photo-1428223501723-d821c5d00ca3?auto=format&fit=crop&w=1200&q=85",
  mouse:
    "https://images.unsplash.com/photo-1668035626412-420df3662985?auto=format&fit=crop&w=1200&q=85",
  study:
    "https://images.unsplash.com/photo-1701453031437-b8e2d3f5dd9d?auto=format&fit=crop&w=1200&q=85",
  badminton:
    "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85",
  cricket:
    "https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=1200&q=85",
  iron:
    "https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=1200&q=85",
  kettle:
    "https://images.unsplash.com/photo-1594213114663-ddf4f240f08d?auto=format&fit=crop&w=1200&q=85",
  tools:
    "https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?auto=format&fit=crop&w=1200&q=85",
  drafting:
    "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1200&q=85",
  adapter:
    "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=1200&q=85",
}

export const STORAGE_KEY = "hostelshare-data-v4"
export const LEGACY_STORAGE_KEY_V3 = "hostelshare-data-v3"

export const CURRENT_USER_KEY = "hostelshare-demo-user-v1"

export function dateOffset(days: number) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function createSeedData(): AppData {
  const users: User[] = [
    {
      id: "user-aisha",
      name: "Aisha Singh",
      hostel: "Maple House",
      roomNumber: "218",
      avatar: "AS",
      rating: 4.95,
      bio: "3rd year Product Design & Computing. Badminton enthusiast, notes sharer, and the person with a spare charger or adapter for every laptop.",
    },
    {
      id: "user-kabir",
      name: "Kabir Shah",
      hostel: "Cedar Hall",
      roomNumber: "108",
      avatar: "KS",
      rating: 4.88,
      bio: "Electronics & Robotics senior. Weekend guitarist, lab equipment keeper, and always happy to lend presentation gear or calculators.",
    },
    {
      id: "user-mira",
      name: "Mira Nair",
      hostel: "Maple House",
      roomNumber: "214",
      avatar: "MN",
      rating: 4.9,
      bio: "Economics & Finance sophomore. Careful keeper of reference textbooks, exam stationery, and clean hostel appliances.",
    },
    {
      id: "user-rohan",
      name: "Rohan Verma",
      hostel: "Banyan Block",
      roomNumber: "305",
      avatar: "RV",
      rating: 4.75,
      bio: "CSE 3rd year. Coding late, playing LAN tournaments on weekends, and hoarding extra Ethernet cables, monitor dongles, and hotplates.",
    },
    {
      id: "user-ananya",
      name: "Ananya Sharma",
      hostel: "Cedar Hall",
      roomNumber: "112",
      avatar: "AS",
      rating: 5.0,
      bio: "Architecture & Urban Planning sophomore. Has an extensive drafting tool collection, cutting mats, steam iron, and keeps things tidy.",
    },
    {
      id: "user-arjun",
      name: "Arjun Patel",
      hostel: "Ashoka Hostel",
      roomNumber: "402",
      avatar: "AP",
      rating: 4.85,
      bio: "Mechanical Engineering senior. Hostel cricket captain, DIY fix-it person with a 24-piece toolkit and football gear.",
    },
  ]

  const items: Item[] = [
    {
      id: "item-calculator",
      name: "Casio FX-991CW ClassWiz Scientific Calculator",
      category: "Study",
      condition: "Like new",
      ownerId: "user-mira",
      availabilityStatus: "available",
      image: photos.calculator,
      description:
        "Natural textbook display, solar + battery, permitted in all university examinations. Includes slide-on protective case.",
      availableFrom: dateOffset(0),
      availableUntil: dateOffset(45),
    },
    {
      id: "item-math-book",
      name: "Higher Engineering Mathematics (B.S. Grewal, 44th Edition)",
      category: "Study",
      condition: "Good",
      ownerId: "user-arjun",
      availabilityStatus: "available",
      image: photos.books,
      description:
        "Standard reference for Calculus, Linear Algebra, and Differential Equations. Neatly highlighted with formula summary sheets tucked in.",
      availableFrom: dateOffset(0),
      availableUntil: dateOffset(60),
    },
    {
      id: "item-drafting-kit",
      name: "Architecture A2 Drafting Board & T-Square Kit",
      category: "Study",
      condition: "Great",
      ownerId: "user-ananya",
      availabilityStatus: "available",
      image: photos.drafting,
      description:
        "Parallel-motion A2 drawing board with acrylic drafting ruler and 45°/60° set squares. Essential for engineering drawing and studio reviews.",
      availableFrom: dateOffset(0),
      availableUntil: dateOffset(30),
    },
    {
      id: "item-gate-book",
      name: "GATE CSE Handbook & Topicwise Solved Papers",
      category: "Study",
      condition: "Great",
      ownerId: "user-rohan",
      availabilityStatus: "reserved",
      image: photos.study,
      description:
        "Complete formula sheets, algorithm quick-reference cards, and 15 years of topicwise solved papers for computer science engineering.",
      availableFrom: dateOffset(-1),
      availableUntil: dateOffset(30),
    },
    {
      id: "item-headphones",
      name: "Sony WH-1000XM4 Noise-Cancelling Headphones",
      category: "Electronics",
      condition: "Like new",
      ownerId: "user-kabir",
      availabilityStatus: "available",
      image: photos.headphones,
      description:
        "Industry-leading active noise cancellation. Perfect for exam crunch in the library or noisy hostel corridors. Includes 3.5mm aux cable and hard case.",
      availableFrom: dateOffset(0),
      availableUntil: dateOffset(20),
    },
    {
      id: "item-kit",
      name: "Laptop Presentation Kit (Stand, HDMI Cable & Clicker)",
      category: "Electronics",
      condition: "Great",
      ownerId: "user-kabir",
      availabilityStatus: "borrowed",
      image: photos.desk,
      description:
        "Adjustable aluminum laptop riser, 3m braided 4K HDMI cable, and Logitech wireless presentation clicker with laser pointer.",
      availableFrom: dateOffset(-2),
      availableUntil: dateOffset(30),
    },
    {
      id: "item-mouse",
      name: "Logitech MX Master 3S Ergonomic Wireless Mouse",
      category: "Electronics",
      condition: "Like new",
      ownerId: "user-mira",
      availabilityStatus: "available",
      image: photos.mouse,
      description:
        "Quiet electromagnetic scroll wheel, connects via Bluetooth or Logi Bolt receiver. 70-day battery on full charge.",
      availableFrom: dateOffset(0),
      availableUntil: dateOffset(30),
    },
    {
      id: "item-hub",
      name: "Anker 7-in-1 USB-C Hub (4K HDMI, SD & 100W PD)",
      category: "Electronics",
      condition: "Great",
      ownerId: "user-rohan",
      availabilityStatus: "available",
      image: photos.adapter,
      description:
        "Multiport adapter dongle for MacBooks and Type-C laptops. Features 4K@60Hz HDMI, 2x USB 3.0, SD/MicroSD slots, and 100W passthrough charging.",
      availableFrom: dateOffset(0),
      availableUntil: dateOffset(25),
    },
    {
      id: "item-badminton",
      name: "Yonex Nanoray 70 Light Badminton Racquets (Pair)",
      category: "Sports",
      condition: "Great",
      ownerId: "user-aisha",
      availabilityStatus: "available",
      image: photos.badminton,
      description:
        "Lightweight 77g graphite racquets strung at 26 lbs. Comes with a double padded thermal racquet cover and a tube of Mavis 350 nylon shuttles.",
      availableFrom: dateOffset(0),
      availableUntil: dateOffset(40),
    },
    {
      id: "item-cricket-bat",
      name: "SS Ton Kashmir Willow Tennis Ball Cricket Bat",
      category: "Sports",
      condition: "Good",
      ownerId: "user-kabir",
      availabilityStatus: "reserved",
      image: photos.cricket,
      description:
        "Light pickup, thick edges, full cane handle with chevron grip. Perfect for inter-hostel gully cricket and campus turf tournaments.",
      availableFrom: dateOffset(-1),
      availableUntil: dateOffset(20),
    },
    {
      id: "item-iron",
      name: "Philips Handheld Garment Steamer & Travel Iron",
      category: "Everyday",
      condition: "Like new",
      ownerId: "user-mira",
      availabilityStatus: "available",
      image: photos.iron,
      description:
        "Continuous steam up to 20g/min, safe on all fabrics from formals to blazers. Quick 35-second heat-up with 70ml detachable water tank.",
      availableFrom: dateOffset(0),
      availableUntil: dateOffset(35),
    },
    {
      id: "item-cooktop",
      name: "Pigeon Cruise Induction Cooktop with Stainless Steel Pot",
      category: "Everyday",
      condition: "Good",
      ownerId: "user-rohan",
      availabilityStatus: "borrowed",
      image: photos.kettle,
      description:
        "1800W induction plate with 7 Indian preset menus and auto-shutoff safety. Comes with compatible 2.5L steel pot and lid for late-night Maggi and chai.",
      availableFrom: dateOffset(-3),
      availableUntil: dateOffset(15),
    },
    {
      id: "item-tools",
      name: "Stanley 24-Piece Multi-Bit Screwdriver & Precision Tool Kit",
      category: "Other",
      condition: "Great",
      ownerId: "user-arjun",
      availabilityStatus: "available",
      image: photos.tools,
      description:
        "Compact ratchet screwdriver handle with magnetic extension and 24 hardened chrome vanadium bits for electronics, desks, and dorm repairs.",
      availableFrom: dateOffset(0),
      availableUntil: dateOffset(50),
    },
  ]

  const requests: BorrowRequest[] = [
    {
      id: "request-pending-incoming-aisha",
      itemId: "item-badminton",
      borrowerId: "user-rohan",
      ownerId: "user-aisha",
      requestedFrom: dateOffset(0),
      requestedUntil: dateOffset(1),
      message:
        "Hey Aisha! Banyan wing is playing a friendly doubles match against Cedar this evening at 6:30 PM. Could I borrow your Yonex racquets for a couple of hours? Will return right after!",
      status: "pending",
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: "request-pending-outgoing-aisha",
      itemId: "item-drafting-kit",
      borrowerId: "user-aisha",
      ownerId: "user-ananya",
      requestedFrom: dateOffset(2),
      requestedUntil: dateOffset(4),
      message:
        "Hi Ananya! We have our studio design jury review this Thursday. Would love to borrow your drafting board for preliminary layout mounting.",
      status: "pending",
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      id: "request-approved-cricket",
      itemId: "item-cricket-bat",
      borrowerId: "user-arjun",
      ownerId: "user-kabir",
      requestedFrom: dateOffset(0),
      requestedUntil: dateOffset(2),
      message:
        "Kabir, need your SS Ton bat for the Ashoka vs Banyan match tomorrow morning. Will return Sunday evening.",
      status: "approved",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "request-borrowed-kit",
      itemId: "item-kit",
      borrowerId: "user-aisha",
      ownerId: "user-kabir",
      requestedFrom: dateOffset(-2),
      requestedUntil: dateOffset(2),
      message:
        "Need the presentation clicker and HDMI cable for my design portfolio review in the main auditorium.",
      status: "approved",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "request-borrowed-cooktop",
      itemId: "item-cooktop",
      borrowerId: "user-kabir",
      ownerId: "user-rohan",
      requestedFrom: dateOffset(-3),
      requestedUntil: dateOffset(1),
      message:
        "Making chai and soup during hackathon prep tonight with the Cedar team. Will wash and return tomorrow.",
      status: "approved",
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: "request-return-pending-iron",
      itemId: "item-iron",
      borrowerId: "user-ananya",
      ownerId: "user-mira",
      requestedFrom: dateOffset(-2),
      requestedUntil: dateOffset(0),
      message:
        "Need to press my formal blazer for placement orientation tomorrow. Will handle with care!",
      status: "approved",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "request-returned-headphones",
      itemId: "item-headphones",
      borrowerId: "user-mira",
      ownerId: "user-kabir",
      requestedFrom: dateOffset(-12),
      requestedUntil: dateOffset(-9),
      message:
        "Need silent focus in the library for econometric model submissions. Will keep inside case.",
      status: "approved",
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    },
    {
      id: "request-returned-tools",
      itemId: "item-tools",
      borrowerId: "user-aisha",
      ownerId: "user-arjun",
      requestedFrom: dateOffset(-8),
      requestedUntil: dateOffset(-6),
      message:
        "Need screwdriver set to assemble my desk shelf and fix my table lamp.",
      status: "approved",
      createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    },
    {
      id: "request-rejected-hub",
      itemId: "item-hub",
      borrowerId: "user-arjun",
      ownerId: "user-rohan",
      requestedFrom: dateOffset(-5),
      requestedUntil: dateOffset(-4),
      message: "Need the hub for connecting an external backup disk.",
      status: "rejected",
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
    {
      id: "request-cancelled-calc",
      itemId: "item-calculator",
      borrowerId: "user-rohan",
      ownerId: "user-mira",
      requestedFrom: dateOffset(-4),
      requestedUntil: dateOffset(-2),
      message:
        "Found a wing mate with a spare calculator, cancelling so others can use it. Thanks Mira!",
      status: "cancelled",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ]

  const transactions: Transaction[] = [
    {
      id: "transaction-approved-cricket",
      requestId: "request-approved-cricket",
      itemId: "item-cricket-bat",
      borrowerId: "user-arjun",
      ownerId: "user-kabir",
      status: "approved",
      handoverAt: null,
      dueAt: dateOffset(2),
      returnedAt: null,
    },
    {
      id: "transaction-borrowed-kit",
      requestId: "request-borrowed-kit",
      itemId: "item-kit",
      borrowerId: "user-aisha",
      ownerId: "user-kabir",
      status: "borrowed",
      handoverAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      dueAt: dateOffset(2),
      returnedAt: null,
    },
    {
      id: "transaction-borrowed-cooktop",
      requestId: "request-borrowed-cooktop",
      itemId: "item-cooktop",
      borrowerId: "user-kabir",
      ownerId: "user-rohan",
      status: "borrowed",
      handoverAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      dueAt: dateOffset(1),
      returnedAt: null,
    },
    {
      id: "transaction-return-pending-iron",
      requestId: "request-return-pending-iron",
      itemId: "item-iron",
      borrowerId: "user-ananya",
      ownerId: "user-mira",
      status: "return_pending",
      handoverAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      dueAt: dateOffset(0),
      returnedAt: null,
    },
    {
      id: "transaction-returned-headphones",
      requestId: "request-returned-headphones",
      itemId: "item-headphones",
      borrowerId: "user-mira",
      ownerId: "user-kabir",
      status: "returned",
      handoverAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      dueAt: dateOffset(-9),
      returnedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    },
    {
      id: "transaction-returned-tools",
      requestId: "request-returned-tools",
      itemId: "item-tools",
      borrowerId: "user-aisha",
      ownerId: "user-arjun",
      status: "returned",
      handoverAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      dueAt: dateOffset(-6),
      returnedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
  ]

  const reviews: Review[] = [
    {
      id: "review-headphones-by-mira",
      transactionId: "transaction-returned-headphones",
      reviewerId: "user-mira",
      recipientId: "user-kabir",
      rating: 5,
      comment:
        "Kabir handed over the Sony XM4s with full battery, clean earcups, and the audio cable. The noise cancelling saved my econometrics revision. Highly recommended lender!",
      createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    },
    {
      id: "review-headphones-by-kabir",
      transactionId: "transaction-returned-headphones",
      reviewerId: "user-kabir",
      recipientId: "user-mira",
      rating: 5,
      comment:
        "Mira returned the headphones right on time at the Cedar lounge, neatly packed in the case. Super responsible borrower!",
      createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    },
    {
      id: "review-tools-by-aisha",
      transactionId: "transaction-returned-tools",
      reviewerId: "user-aisha",
      recipientId: "user-arjun",
      rating: 5,
      comment:
        "Arjun's Stanley toolkit had every single bit needed to assemble my drafting table and fix my desk lamp. Great person to have on campus!",
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
    {
      id: "review-tools-by-arjun",
      transactionId: "transaction-returned-tools",
      reviewerId: "user-arjun",
      recipientId: "user-aisha",
      rating: 5,
      comment:
        "Aisha returned the kit with all 24 bits in their slots and wiped down. 10/10 trustworthy hostel mate.",
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
  ]

  const notices: Notice[] = [
    {
      id: "notice-incoming-badminton",
      userId: "user-aisha",
      text: "Rohan Verma submitted a borrow request for your Yonex badminton racquets.",
      target: "activity",
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: "notice-due-presentation-kit",
      userId: "user-aisha",
      text: "Laptop presentation kit borrowed from Kabir is due back in 2 days.",
      target: "transaction",
      transactionId: "transaction-borrowed-kit",
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: "notice-review-arjun-aisha",
      userId: "user-aisha",
      text: "Arjun Patel left you a 5-star review for the Precision Tool Kit exchange.",
      target: "profile",
      read: true,
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
    {
      id: "notice-req-offer-aisha",
      userId: "user-aisha",
      text: "Rohan Verma offered an item for your requirement: Long Cat6 Ethernet cable.",
      target: "requirements",
      requirementId: "req-seed-cable",
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: "notice-kabir-handover",
      userId: "user-kabir",
      text: "Arjun Patel's request for SS Ton Cricket Bat was approved. Handover is ready.",
      target: "transaction",
      transactionId: "transaction-approved-cricket",
      read: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "notice-mira-return-confirm",
      userId: "user-mira",
      text: "Ananya Sharma initiated the return for Philips Garment Steamer. Please confirm receipt.",
      target: "transaction",
      transactionId: "transaction-return-pending-iron",
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ]

  return {
    version: 4,
    users,
    items,
    requests,
    transactions,
    notices,
    savedItemIds: ["item-calculator", "item-headphones"],
    requirements: createSeedRequirements(),
    reviews,
  }
}

export function createSeedRequirements(): Requirement[] {
  return [
    {
      id: "req-seed-calculator",
      title: "Casio FX-991CW or 991ES Plus for Electrical Circuits (EE201) midterm",
      description:
        "Need a scientific calculator for the electrical circuits midterm on Friday. Will return right after the exam in Maple lobby.",
      category: "Study",
      authorId: "user-kabir",
      neededBy: dateOffset(2),
      returnDate: dateOffset(3),
      status: "open",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      offers: [
        {
          id: "offer-seed-1",
          requirementId: "req-seed-calculator",
          offeredById: "user-mira",
          message:
            "I have my Casio FX-991CW ClassWiz ready to lend! Fresh batteries and can meet at the Maple lobby.",
          itemId: "item-calculator",
          itemName: "Casio scientific calculator",
          status: "pending",
          createdAt: new Date(Date.now() - 43200000).toISOString(),
        },
      ],
    },
    {
      id: "req-seed-cable",
      title: "Long Cat6 Ethernet Cable (5m+) for LAN tournament",
      description:
        "The Wi-Fi in Maple 2nd floor gets spotty during weekend tournaments. Looking for a Cat6 RJ-45 cable to plug directly into the wall port.",
      category: "Electronics",
      authorId: "user-aisha",
      neededBy: dateOffset(3),
      returnDate: dateOffset(5),
      status: "open",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      offers: [
        {
          id: "offer-seed-cable",
          requirementId: "req-seed-cable",
          offeredById: "user-rohan",
          message:
            "I have a 10m Cat6 blue patch cord! Can drop it off at Maple reception on my way to Banyan.",
          itemId: "item-hub",
          itemName: "Cat6 Ethernet cable",
          status: "pending",
          createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        },
      ],
    },
    {
      id: "req-seed-badminton",
      title: "Badminton racquets pair for Saturday evening doubles",
      description:
        "Planning a friendly doubles game at the campus sports complex this Saturday. Need two racquets with tight strings and good grips.",
      category: "Sports",
      authorId: "user-mira",
      neededBy: dateOffset(4),
      returnDate: dateOffset(4),
      status: "open",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      offers: [],
    },
    {
      id: "req-seed-drafting",
      title: "T-Square or A2 Drafting ruler for studio presentation",
      description:
        "Final design jury review coming up. Need a 60cm or 80cm clear acrylic T-square ruler for architectural board mounting.",
      category: "Study",
      authorId: "user-rohan",
      neededBy: dateOffset(2),
      returnDate: dateOffset(3),
      status: "open",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      offers: [],
    },
    {
      id: "req-seed-adapter",
      title: "USB-C Multiport Display Adapter for Project Presentation",
      description:
        "Needed a multi-port display adapter for seminar presentation in Block C projector room.",
      category: "Electronics",
      authorId: "user-arjun",
      neededBy: dateOffset(-4),
      returnDate: dateOffset(-2),
      status: "fulfilled",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      offers: [
        {
          id: "offer-seed-fulfilled",
          requirementId: "req-seed-adapter",
          offeredById: "user-rohan",
          message: "Brought my Anker 7-in-1 USB-C Hub to Cedar lounge.",
          itemId: "item-hub",
          itemName: "Anker USB-C Multi-Port Hub",
          status: "accepted",
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
      ],
    },
  ]
}

function isValidData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false

  const data = value as Partial<AppData>

  return (
    (data.version === 4 || data.version === 3) &&
    Array.isArray(data.users) &&
    data.users.length > 0 &&
    Array.isArray(data.items) &&
    data.items.length > 0 &&
    Array.isArray(data.requests) &&
    Array.isArray(data.transactions)
  )
}

export function loadData(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      const parsed: unknown = JSON.parse(saved)
      if (isValidData(parsed)) {
        return {
          ...parsed,
          version: 4,
          notices: Array.isArray(parsed.notices) ? parsed.notices : [],
          savedItemIds: Array.isArray(parsed.savedItemIds)
            ? parsed.savedItemIds
            : [],
          requirements: Array.isArray(parsed.requirements)
            ? parsed.requirements
            : createSeedRequirements(),
          reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
        }
      }
    }

    // Check legacy v3 data and migrate
    const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY_V3)
    if (legacySaved) {
      const parsed: unknown = JSON.parse(legacySaved)
      if (isValidData(parsed)) {
        const migrated: AppData = {
          ...parsed,
          version: 4,
          notices: Array.isArray(parsed.notices) ? parsed.notices : [],
          savedItemIds: Array.isArray(parsed.savedItemIds)
            ? parsed.savedItemIds
            : [],
          requirements: Array.isArray(parsed.requirements)
            ? parsed.requirements
            : createSeedRequirements(),
          reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
        }
        saveData(migrated)
        return migrated
      }
    }

    const fresh = createSeedData()
    saveData(fresh)
    return fresh
  } catch {
    const fresh = createSeedData()
    saveData(fresh)
    return fresh
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function createItem(
  data: AppData,
  item: Omit<Item, "id" | "availabilityStatus">,
): Result {
  if (!item.name.trim() || item.description.trim().length < 12)
    return {
      ok: false,
      error: "Add a clear name and a description of at least 12 characters.",
    }

  if (!item.image) return { ok: false, error: "Add a photo before publishing." }

  if (
    !item.availableFrom ||
    !item.availableUntil ||
    item.availableFrom > item.availableUntil
  )
    return {
      ok: false,
      error: "Availability end date must be on or after the start date.",
    }

  const created: Item = {
    ...item,
    id: `item-${crypto.randomUUID()}`,
    availabilityStatus: "available",
  }

  return {
    ok: true,
    data: { ...data, items: [created, ...data.items] },
    message: `${created.name} is now listed.`,
  }
}

export function updateItem(
  data: AppData,
  itemId: string,
  actorId: string,
  updates: Partial<Omit<Item, "id" | "ownerId">>,
): Result {
  const item = data.items.find((candidate) => candidate.id === itemId)
  if (!item) return { ok: false, error: "Item not found." }
  if (item.ownerId !== actorId)
    return { ok: false, error: "Only the owner can edit this listing." }

  if (updates.name !== undefined && updates.name.trim().length < 2)
    return { ok: false, error: "Add a clear name of at least 2 characters." }

  if (updates.description !== undefined && updates.description.trim().length < 10)
    return { ok: false, error: "Description must be at least 10 characters." }

  const fromDate = updates.availableFrom ?? item.availableFrom
  const untilDate = updates.availableUntil ?? item.availableUntil
  if (fromDate > untilDate)
    return { ok: false, error: "Availability end date must be on or after the start date." }

  const updatedItem: Item = {
    ...item,
    ...updates,
    name: updates.name ? updates.name.trim() : item.name,
    description: updates.description ? updates.description.trim() : item.description,
  }

  const items = data.items.map((candidate) =>
    candidate.id === itemId ? updatedItem : candidate,
  )

  return {
    ok: true,
    data: { ...data, items },
    message: `${updatedItem.name} updated.`,
  }
}

export function deleteItem(
  data: AppData,
  itemId: string,
  actorId: string,
): Result {
  const item = data.items.find((candidate) => candidate.id === itemId)
  if (!item) return { ok: false, error: "Item not found." }
  if (item.ownerId !== actorId)
    return { ok: false, error: "Only the owner can delete this listing." }

  const hasRequests = data.requests.some((r) => r.itemId === itemId)
  if (hasRequests)
    return {
      ok: false,
      error: "Cannot delete item: it has associated borrow requests or history.",
    }

  const items = data.items.filter((candidate) => candidate.id !== itemId)
  const savedItemIds = data.savedItemIds.filter((id) => id !== itemId)

  return {
    ok: true,
    data: { ...data, items, savedItemIds },
    message: `${item.name} removed from listings.`,
  }
}

export function createBorrowRequest(
  data: AppData,
  input: Omit<BorrowRequest, "id" | "status" | "createdAt" | "ownerId">,
): Result {
  const item = data.items.find((candidate) => candidate.id === input.itemId)

  if (!item) return { ok: false, error: "This item no longer exists." }

  if (item.ownerId === input.borrowerId)
    return {
      ok: false,
      error:
        "You cannot borrow your own item. Switch demo users to test another borrower.",
    }

  if (item.availabilityStatus !== "available")
    return { ok: false, error: "This item is already reserved or borrowed." }

  if (!input.requestedFrom || !input.requestedUntil)
    return { ok: false, error: "Choose both a start and return date." }

  if (input.requestedFrom < dateOffset(0))
    return {
      ok: false,
      error: "The borrowing period cannot begin in the past.",
    }

  if (input.requestedFrom > input.requestedUntil)
    return { ok: false, error: "Return date must be after the start date." }

  if (
    input.requestedFrom < item.availableFrom ||
    input.requestedUntil > item.availableUntil
  )
    return {
      ok: false,
      error: `Choose dates between ${item.availableFrom} and ${item.availableUntil}.`,
    }

  const duplicate = data.requests.some(
    (request) =>
      request.itemId === item.id &&
      request.borrowerId === input.borrowerId &&
      request.status === "pending",
  )

  if (duplicate)
    return {
      ok: false,
      error: "You already have a pending request for this item.",
    }

  const activeLoan = data.transactions.some(
    (transaction) =>
      transaction.itemId === item.id && transaction.status !== "returned",
  )

  if (activeLoan)
    return { ok: false, error: "This item already has an active loan." }

  const request: BorrowRequest = {
    ...input,
    id: `request-${crypto.randomUUID()}`,
    ownerId: item.ownerId,
    status: "pending",
    createdAt: new Date().toISOString(),
  }

  const borrower = data.users.find((user) => user.id === input.borrowerId)

  const notice: Notice = {
    id: `notice-${crypto.randomUUID()}`,
    userId: item.ownerId,
    text: `${borrower?.name || "A student"} requested ${item.name}.`,
    target: "activity",
    read: false,
    createdAt: new Date().toISOString(),
  }

  return {
    ok: true,
    data: {
      ...data,
      requests: [request, ...data.requests],
      notices: [notice, ...data.notices],
    },
    message: `Request sent to ${data.users.find((user) => user.id === item.ownerId)?.name}.`,
  }
}

export function decideRequest(
  data: AppData,
  requestId: string,
  actorId: string,
  decision: "approved" | "rejected",
): Result {
  const request = data.requests.find((candidate) => candidate.id === requestId)

  if (!request) return { ok: false, error: "Request not found." }

  if (request.ownerId !== actorId)
    return { ok: false, error: "Only the item owner can decide this request." }

  if (request.status !== "pending")
    return { ok: false, error: "This request has already been decided." }

  const item = data.items.find((candidate) => candidate.id === request.itemId)

  if (!item) return { ok: false, error: "The requested item no longer exists." }

  if (decision === "approved" && item.availabilityStatus !== "available")
    return { ok: false, error: "This item is no longer available to approve." }

  let requests = data.requests.map((candidate) =>
    candidate.id === requestId ? { ...candidate, status: decision } : candidate,
  )

  let items = data.items

  let transactions = data.transactions

  if (decision === "approved") {
    requests = requests.map((candidate) =>
      candidate.itemId === request.itemId &&
      candidate.id !== requestId &&
      candidate.status === "pending"
        ? { ...candidate, status: "rejected" }
        : candidate,
    )

    items = items.map((candidate) =>
      candidate.id === request.itemId
        ? { ...candidate, availabilityStatus: "reserved" }
        : candidate,
    )

    transactions = [
      {
        id: `transaction-${crypto.randomUUID()}`,
        requestId: request.id,
        itemId: request.itemId,
        borrowerId: request.borrowerId,
        ownerId: request.ownerId,
        status: "approved",
        handoverAt: null,
        dueAt: request.requestedUntil,
        returnedAt: null,
      },
      ...transactions,
    ]
  }

  const notice: Notice = {
    id: `notice-${crypto.randomUUID()}`,
    userId: request.borrowerId,
    text: `${item.name} request ${
      decision === "approved" ? "approved" : "declined"
    }.`,
    target: decision === "approved" ? "transaction" : "activity",
    transactionId: transactions.find(
      (transaction) => transaction.requestId === request.id,
    )?.id,
    read: false,
    createdAt: new Date().toISOString(),
  }

  return {
    ok: true,
    data: {
      ...data,
      requests,
      items,
      transactions,
      notices: [notice, ...data.notices],
    },
    message:
      decision === "approved"
        ? "Request approved and item reserved."
        : "Request declined.",
  }
}

export function recordHandover(
  data: AppData,
  transactionId: string,
  actorId: string,
): Result {
  const transaction = data.transactions.find(
    (candidate) => candidate.id === transactionId,
  )

  if (!transaction) return { ok: false, error: "Transaction not found." }

  if (![transaction.ownerId, transaction.borrowerId].includes(actorId))
    return {
      ok: false,
      error: "Only the borrower or owner can confirm this handover.",
    }

  if (transaction.status !== "approved")
    return { ok: false, error: "This handover is not ready to confirm." }

  const transactions = data.transactions.map((candidate) =>
    candidate.id === transactionId
      ? {
          ...candidate,
          status: "borrowed",
          handoverAt: new Date().toISOString(),
        } as Transaction
      : candidate,
  )

  const items = data.items.map((candidate) =>
    candidate.id === transaction.itemId
      ? { ...candidate, availabilityStatus: "borrowed" } as Item
      : candidate,
  )

  return {
    ok: true,
    data: { ...data, transactions, items },
    message: "Handover recorded. The item is now currently borrowed.",
  }
}

export function initiateReturn(
  data: AppData,
  transactionId: string,
  actorId: string,
): Result {
  const transaction = data.transactions.find(
    (candidate) => candidate.id === transactionId,
  )

  if (!transaction) return { ok: false, error: "Transaction not found." }

  if (![transaction.ownerId, transaction.borrowerId].includes(actorId))
    return {
      ok: false,
      error: "Only the borrower or owner can initiate a return.",
    }

  if (transaction.status !== "borrowed")
    return { ok: false, error: "Only a borrowed item can be returned." }

  const transactions = data.transactions.map((candidate) =>
    candidate.id === transactionId
      ? { ...candidate, status: "return_pending" } as Transaction
      : candidate,
  )

  const otherUser =
    actorId === transaction.ownerId
      ? transaction.borrowerId
      : transaction.ownerId

  const item = data.items.find(
    (candidate) => candidate.id === transaction.itemId,
  )

  const notice: Notice = {
    id: `notice-${crypto.randomUUID()}`,
    userId: otherUser,
    text: `Return confirmation needed for ${item?.name}.`,
    target: "transaction",
    transactionId,
    read: false,
    createdAt: new Date().toISOString(),
  }

  return {
    ok: true,
    data: { ...data, transactions, notices: [notice, ...data.notices] },
    message: "Return started. The other student can now confirm it.",
  }
}

export function confirmReturn(
  data: AppData,
  transactionId: string,
  actorId: string,
): Result {
  const transaction = data.transactions.find(
    (candidate) => candidate.id === transactionId,
  )

  if (!transaction) return { ok: false, error: "Transaction not found." }

  if (![transaction.ownerId, transaction.borrowerId].includes(actorId))
    return { ok: false, error: "Only a participant can confirm this return." }

  if (transaction.status !== "return_pending")
    return { ok: false, error: "Start the return before confirming it." }

  const transactions = data.transactions.map((candidate) =>
    candidate.id === transactionId
      ? {
          ...candidate,
          status: "returned",
          returnedAt: new Date().toISOString(),
        } as Transaction
      : candidate,
  )

  const items = data.items.map((candidate) =>
    candidate.id === transaction.itemId
      ? { ...candidate, availabilityStatus: "available" } as Item
      : candidate,
  )

  return {
    ok: true,
    data: { ...data, transactions, items },
    message: "Return confirmed. The item is available again.",
  }
}

export function toggleSaved(data: AppData, itemId: string): AppData {
  const savedItemIds = data.savedItemIds.includes(itemId)
    ? data.savedItemIds.filter((id) => id !== itemId)
    : [...data.savedItemIds, itemId]

  return { ...data, savedItemIds }
}

export function markNoticeRead(data: AppData, noticeId: string): AppData {
  return {
    ...data,
    notices: data.notices.map((notice) =>
      notice.id === noticeId ? { ...notice, read: true } : notice,
    ),
  }
}

export function userFor(data: AppData, id: string): User {
  return (
    data.users.find((user) => user.id === id) || {
      id,

      name: "Student",

      hostel: "Campus",

      roomNumber: "—",

      avatar: "ST",

      rating: 5.0,

      bio: "Hostel resident",
    }
  )
}

export function itemFor(data: AppData, id: string): Item {
  return (
    data.items.find((item) => item.id === id) || {
      id,

      name: "Unknown Item",

      description: "Item not found",

      category: "Other",

      image: "",

      condition: "Unknown",

      ownerId: "",

      availabilityStatus: "available",

      availableFrom: dateOffset(0),

      availableUntil: dateOffset(30),
    }
  )
}

export function displayDate(value: string): string {
  if (!value) return ""

  try {
    return new Intl.DateTimeFormat("en", {
      day: "numeric",

      month: "short",

      year: "numeric",
    }).format(new Date(`${value}T12:00:00`))
  } catch {
    return value
  }
}

export function requirementFor(
  data: AppData,
  id: string,
): Requirement | undefined {
  return data.requirements.find((req) => req.id === id)
}

export function createRequirement(
  data: AppData,
  input: Omit<Requirement, "id" | "status" | "createdAt" | "offers">,
): Result {
  if (!input.title || input.title.trim().length < 3) {
    return {
      ok: false,
      error:
        "Enter a descriptive title for what you need (at least 3 characters).",
    }
  }

  if (!input.description || input.description.trim().length < 10) {
    return {
      ok: false,
      error:
        "Provide a helpful description of what you need and why (at least 10 characters).",
    }
  }

  if (!input.neededBy) {
    return {
      ok: false,
      error: "Select the date by which you need this item.",
    }
  }

  if (input.neededBy < dateOffset(0)) {
    return {
      ok: false,
      error: "The date needed cannot be in the past.",
    }
  }

  if (input.returnDate && input.returnDate < input.neededBy) {
    return {
      ok: false,
      error: "The estimated return date must be on or after the date needed.",
    }
  }

  const requirement: Requirement = {
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    id: `req-${crypto.randomUUID()}`,
    status: "open",
    createdAt: new Date().toISOString(),
    offers: [],
  }

  return {
    ok: true,
    data: {
      ...data,
      requirements: [requirement, ...data.requirements],
    },
    message: `"${requirement.title}" has been posted to the Requirements Board.`,
  }
}

export function cancelRequirement(
  data: AppData,
  requirementId: string,
  actorId: string,
): Result {
  const req = data.requirements.find(
    (candidate) => candidate.id === requirementId,
  )

  if (!req) {
    return { ok: false, error: "Requirement not found." }
  }

  if (req.authorId !== actorId) {
    return {
      ok: false,
      error: "Only the student who posted this requirement can cancel it.",
    }
  }

  if (req.status !== "open") {
    return {
      ok: false,
      error: "Only open requirements can be cancelled.",
    }
  }

  // Set any pending offers to declined and notify offerers
  const declineNotices: Notice[] = req.offers
    .filter((o) => o.status === "pending")
    .map((o) => ({
      id: `notice-${crypto.randomUUID()}`,
      userId: o.offeredById,
      text: `The requirement "${req.title}" was cancelled by the requester.`,
      target: "requirements" as const,
      requirementId: req.id,
      read: false,
      createdAt: new Date().toISOString(),
    }))

  const requirements = data.requirements.map((candidate) =>
    candidate.id === requirementId
      ? {
          ...candidate,
          status: "cancelled" as RequirementStatus,
          offers: candidate.offers.map((offer) =>
            offer.status === "pending"
              ? { ...offer, status: "declined" as OfferStatus }
              : offer,
          ),
        }
      : candidate,
  )

  return {
    ok: true,
    data: {
      ...data,
      requirements,
      notices: [...declineNotices, ...data.notices],
    },
    message: "Requirement cancelled.",
  }
}

export function fulfillRequirement(
  data: AppData,
  requirementId: string,
  actorId: string,
): Result {
  const req = data.requirements.find(
    (candidate) => candidate.id === requirementId,
  )

  if (!req) {
    return { ok: false, error: "Requirement not found." }
  }

  if (req.authorId !== actorId) {
    return {
      ok: false,
      error:
        "Only the student who posted this requirement can mark it as fulfilled.",
    }
  }

  if (req.status !== "open") {
    return {
      ok: false,
      error: "This requirement is not currently open.",
    }
  }

  const requirements = data.requirements.map((candidate) =>
    candidate.id === requirementId
      ? { ...candidate, status: "fulfilled" as RequirementStatus }
      : candidate,
  )

  return {
    ok: true,
    data: { ...data, requirements },
    message: "Requirement marked as fulfilled. Glad your need was met!",
  }
}

export function createRequirementOffer(
  data: AppData,
  requirementId: string,
  input: {
    offeredById: string
    message: string
    itemId?: string
    itemName?: string
    availableFrom?: string
    availableUntil?: string
  },
): Result {
  const req = data.requirements.find(
    (candidate) => candidate.id === requirementId,
  )

  if (!req) {
    return { ok: false, error: "Requirement not found." }
  }

  if (req.status !== "open") {
    return {
      ok: false,
      error: "This requirement is no longer accepting offers.",
    }
  }

  if (req.authorId === input.offeredById) {
    return {
      ok: false,
      error:
        "You cannot make an offer on your own requirement. Switch demo users to test another offerer.",
    }
  }

  const hasPendingOffer = req.offers.some(
    (offer) =>
      offer.offeredById === input.offeredById && offer.status === "pending",
  )

  if (hasPendingOffer) {
    return {
      ok: false,
      error: "You already have a pending offer on this requirement.",
    }
  }

  if (!input.message || input.message.trim().length < 6) {
    return {
      ok: false,
      error:
        "Please provide a clear note explaining what you can lend and how to meet (at least 6 characters).",
    }
  }

  let itemName = input.itemName?.trim()
  if (input.itemId) {
    const catalogItem = data.items.find((i) => i.id === input.itemId)
    if (catalogItem) {
      itemName = catalogItem.name
    }
  }
  if (!itemName) {
    itemName = "Offered item"
  }

  const newOffer: RequirementOffer = {
    id: `offer-${crypto.randomUUID()}`,
    requirementId,
    offeredById: input.offeredById,
    message: input.message.trim(),
    itemId: input.itemId,
    itemName,
    availableFrom: input.availableFrom,
    availableUntil: input.availableUntil,
    status: "pending",
    createdAt: new Date().toISOString(),
  }

  const offerer = userFor(data, input.offeredById)
  const notice: Notice = {
    id: `notice-${crypto.randomUUID()}`,
    userId: req.authorId,
    text: `${offerer.name} offered ${itemName} for "${req.title}".`,
    target: "requirements",
    requirementId,
    read: false,
    createdAt: new Date().toISOString(),
  }

  const requirements = data.requirements.map((candidate) =>
    candidate.id === requirementId
      ? { ...candidate, offers: [newOffer, ...candidate.offers] }
      : candidate,
  )

  const author = userFor(data, req.authorId)
  return {
    ok: true,
    data: {
      ...data,
      requirements,
      notices: [notice, ...data.notices],
    },
    message: `Offer sent to ${author.name.split(" ")[0]}.`,
  }
}

export function decideRequirementOffer(
  data: AppData,
  requirementId: string,
  offerId: string,
  actorId: string,
  decision: "accepted" | "declined",
): Result {
  const req = data.requirements.find(
    (candidate) => candidate.id === requirementId,
  )

  if (!req) {
    return { ok: false, error: "Requirement not found." }
  }

  if (req.authorId !== actorId) {
    return {
      ok: false,
      error:
        "Only the student who posted this requirement can decide on offers.",
    }
  }

  if (req.status !== "open") {
    return {
      ok: false,
      error: "Offers cannot be decided on a closed or fulfilled requirement.",
    }
  }

  const offer = req.offers.find((candidate) => candidate.id === offerId)

  if (!offer) {
    return { ok: false, error: "Offer not found." }
  }

  if (offer.status !== "pending") {
    return {
      ok: false,
      error: "This offer has already been decided.",
    }
  }

  if (offer.offeredById === actorId) {
    return {
      ok: false,
      error: "You cannot accept your own offer.",
    }
  }

  let items = data.items
  let transactions = data.transactions
  let notices = data.notices

  let updatedOffers = req.offers.map((candidate) => {
    if (candidate.id === offerId) {
      return { ...candidate, status: decision as OfferStatus }
    }
    // If accepted, decline other pending offers for this requirement
    if (decision === "accepted" && candidate.status === "pending") {
      return { ...candidate, status: "declined" as OfferStatus }
    }
    return candidate
  })

  const author = userFor(data, req.authorId)
  const offerer = userFor(data, offer.offeredById)

  if (decision === "accepted") {
    // Determine linked item
    let linkedItemId = offer.itemId
    if (linkedItemId) {
      const existingItem = items.find((i) => i.id === linkedItemId)
      if (existingItem) {
        items = items.map((i) =>
          i.id === linkedItemId
            ? { ...i, availabilityStatus: "reserved" as AvailabilityStatus }
            : i,
        )
      } else {
        linkedItemId = undefined
      }
    }

    // If no existing catalog item was chosen, create one so the borrowing lifecycle works consistently
    if (!linkedItemId) {
      linkedItemId = `item-${crypto.randomUUID()}`
      const newItem: Item = {
        id: linkedItemId,
        name: offer.itemName || req.title,
        description:
          offer.message || `Provided in response to requirement: ${req.title}`,
        category: req.category,
        condition: "Good",
        ownerId: offer.offeredById,
        availabilityStatus: "reserved",
        image: photos.study,
        availableFrom: dateOffset(0),
        availableUntil: req.returnDate || dateOffset(30),
      }
      items = [newItem, ...items]
    }

    const transactionId = `transaction-${crypto.randomUUID()}`
    const transaction: Transaction = {
      id: transactionId,
      requestId: `offer-${offer.id}`,
      itemId: linkedItemId,
      borrowerId: req.authorId,
      ownerId: offer.offeredById,
      status: "approved",
      handoverAt: null,
      dueAt: req.returnDate || offer.availableUntil || dateOffset(7),
      returnedAt: null,
    }

    transactions = [transaction, ...transactions]

    const offererNotice: Notice = {
      id: `notice-${crypto.randomUUID()}`,
      userId: offer.offeredById,
      text: `${author.name} accepted your offer for "${req.title}"! Transaction is ready for handover.`,
      target: "transaction",
      transactionId,
      read: false,
      createdAt: new Date().toISOString(),
    }

    const authorNotice: Notice = {
      id: `notice-${crypto.randomUUID()}`,
      userId: req.authorId,
      text: `You accepted ${offerer.name}'s offer for "${req.title}". Meet in the hostel common area for exchange.`,
      target: "transaction",
      transactionId,
      read: false,
      createdAt: new Date().toISOString(),
    }

    notices = [offererNotice, authorNotice, ...notices]
  } else {
    // Offer declined notice
    const declineNotice: Notice = {
      id: `notice-${crypto.randomUUID()}`,
      userId: offer.offeredById,
      text: `${author.name} declined the offer for "${req.title}".`,
      target: "requirements",
      requirementId: req.id,
      read: false,
      createdAt: new Date().toISOString(),
    }
    notices = [declineNotice, ...notices]
  }

  const requirements = data.requirements.map((candidate) =>
    candidate.id === requirementId
      ? {
          ...candidate,
          status:
            decision === "accepted"
              ? "fulfilled" as RequirementStatus
              : candidate.status,
          offers: updatedOffers,
        }
      : candidate,
  )

  return {
    ok: true,
    data: {
      ...data,
      requirements,
      items,
      transactions,
      notices,
    },
    message:
      decision === "accepted"
        ? `Offer from ${offerer.name.split(" ")[0]} accepted! A borrowing transaction is now ready in My Activity.`
        : "Offer declined.",
  }
}

export function getUserRatingStats(data: AppData, userId: string): {
  averageRating: number | null
  reviewCount: number
  reviews: Review[]
} {
  const reviews = (data.reviews || []).filter((r) => r.recipientId === userId)
  if (reviews.length === 0) {
    return { averageRating: null, reviewCount: 0, reviews: [] }
  }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  const averageRating = Math.round((sum / reviews.length) * 10) / 10
  return { averageRating, reviewCount: reviews.length, reviews }
}

export function canUserReviewTransaction(
  data: AppData,
  transactionId: string,
  reviewerId: string,
): {
  eligible: boolean
  reason?: string
  recipientId?: string
  existingReview?: Review
} {
  const transaction = data.transactions.find((t) => t.id === transactionId)
  if (!transaction) {
    return { eligible: false, reason: "Transaction not found." }
  }

  if (transaction.status !== "returned") {
    return {
      eligible: false,
      reason: "Reviews are only allowed for completed, returned transactions.",
    }
  }

  const isBorrower = transaction.borrowerId === reviewerId
  const isOwner = transaction.ownerId === reviewerId

  if (!isBorrower && !isOwner) {
    return {
      eligible: false,
      reason: "Only participants in this transaction can leave a review.",
    }
  }

  const recipientId = isBorrower ? transaction.ownerId : transaction.borrowerId

  if (reviewerId === recipientId) {
    return {
      eligible: false,
      reason: "You cannot review yourself.",
    }
  }

  const existingReview = (data.reviews || []).find(
    (r) => r.transactionId === transactionId && r.reviewerId === reviewerId,
  )

  if (existingReview) {
    return {
      eligible: false,
      reason: "You have already submitted a review for this transaction.",
      recipientId,
      existingReview,
    }
  }

  return {
    eligible: true,
    recipientId,
  }
}

export function createReview(
  data: AppData,
  input: {
    transactionId: string
    reviewerId: string
    rating: number
    comment: string
  },
): Result {
  const check = canUserReviewTransaction(
    data,
    input.transactionId,
    input.reviewerId,
  )

  if (!check.eligible || !check.recipientId) {
    return {
      ok: false,
      error: check.reason || "Not eligible to review this transaction.",
    }
  }

  if (
    typeof input.rating !== "number" ||
    !Number.isInteger(input.rating) ||
    input.rating < 1 ||
    input.rating > 5
  ) {
    return {
      ok: false,
      error: "Please select a rating between 1 and 5 stars.",
    }
  }

  const trimmedComment = input.comment ? input.comment.trim() : ""
  if (trimmedComment.length < 5) {
    return {
      ok: false,
      error: "Please write a review comment (minimum 5 characters).",
    }
  }

  if (trimmedComment.length > 500) {
    return {
      ok: false,
      error: "Review comment cannot exceed 500 characters.",
    }
  }

  const newReview: Review = {
    id: `review-${crypto.randomUUID()}`,
    transactionId: input.transactionId,
    reviewerId: input.reviewerId,
    recipientId: check.recipientId,
    rating: input.rating,
    comment: trimmedComment,
    createdAt: new Date().toISOString(),
  }

  const updatedReviews = [newReview, ...(data.reviews || [])]

  // Recalculate recipient's average rating
  const recipientReviews = updatedReviews.filter(
    (r) => r.recipientId === check.recipientId,
  )
  const sum = recipientReviews.reduce((acc, r) => acc + r.rating, 0)
  const newAvg = Math.round((sum / recipientReviews.length) * 10) / 10

  const users = data.users.map((u) =>
    u.id === check.recipientId ? { ...u, rating: newAvg } : u,
  )

  const reviewer = userFor(data, input.reviewerId)
  const recipient = userFor(data, check.recipientId)
  const transaction = data.transactions.find(
    (t) => t.id === input.transactionId,
  )
  const item = transaction ? itemFor(data, transaction.itemId) : null

  const notice: Notice = {
    id: `notice-${crypto.randomUUID()}`,
    userId: check.recipientId,
    text: `${reviewer.name} left you a ${input.rating}-star review${
      item ? ` for "${item.name}"` : ""
    }.`,
    target: "profile",
    read: false,
    createdAt: new Date().toISOString(),
  }

  return {
    ok: true,
    data: {
      ...data,
      reviews: updatedReviews,
      users,
      notices: [notice, ...data.notices],
    },
    message: `Your review for ${recipient.name.split(" ")[0]} has been submitted.`,
  }
}
