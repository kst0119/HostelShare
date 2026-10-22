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

  desk: "https://images.unsplash.com/photo-1428223501723-d821c5d00ca3?auto=format&fit=crop&w=1200&q=85",

  mouse:
    "https://images.unsplash.com/photo-1668035626412-420df3662985?auto=format&fit=crop&w=1200&q=85",

  study:
    "https://images.unsplash.com/photo-1701453031437-b8e2d3f5dd9d?auto=format&fit=crop&w=1200&q=85",
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
      rating: 4.9,
      bio: "Product design student, serial note-sharer, and the person with a charger for everything.",
    },

    {
      id: "user-mira",
      name: "Mira Nair",
      hostel: "Maple House",
      roomNumber: "214",
      avatar: "MN",
      rating: 4.8,
      bio: "Economics student and careful keeper of useful things.",
    },

    {
      id: "user-kabir",
      name: "Kabir Shah",
      hostel: "Cedar Hall",
      roomNumber: "108",
      avatar: "KS",
      rating: 4.7,
      bio: "Music, electronics, and always happy to help.",
    },
  ]

  const items: Item[] = [
    {
      id: "item-calculator",
      name: "Casio scientific calculator",
      category: "Study",
      condition: "Like new",
      ownerId: "user-mira",
      availabilityStatus: "available",
      image: photos.calculator,
      description:
        "Reliable FX-991ES Plus with a fresh battery. Perfect for exam week or lab calculations.",
      availableFrom: dateOffset(0),
      availableUntil: dateOffset(30),
    },

    {
      id: "item-headphones",
      name: "Noise-cancelling headphones",
      category: "Electronics",
      condition: "Good",
      ownerId: "user-kabir",
      availabilityStatus: "available",
      image: photos.headphones,
      description:
        "Comfortable over-ear headphones with a wired connection and travel pouch.",
      availableFrom: dateOffset(0),
      availableUntil: dateOffset(20),
    },

    {
      id: "item-books",
      name: "Introduction to economics set",
      category: "Study",
      condition: "Loved",
      ownerId: "user-aisha",
      availabilityStatus: "available",
      image: photos.books,
      description:
        "Core reading plus tidy semester notes tucked inside. Please keep them dry.",
      availableFrom: dateOffset(0),
      availableUntil: dateOffset(45),
    },

    {
      id: "item-kit",
      name: "Laptop presentation kit",
      category: "Electronics",
      condition: "Great",
      ownerId: "user-kabir",
      availabilityStatus: "borrowed",
      image: photos.desk,
      description:
        "Laptop stand, HDMI adapter and wireless presenter for seminar days.",
      availableFrom: dateOffset(4),
      availableUntil: dateOffset(40),
    },

    {
      id: "item-mouse",
      name: "Wireless mouse",
      category: "Electronics",
      condition: "Like new",
      ownerId: "user-mira",
      availabilityStatus: "available",
      image: photos.mouse,
      description: "Compact Bluetooth mouse, silent click, charged and ready.",
      availableFrom: dateOffset(0),
      availableUntil: dateOffset(25),
    },

    {
      id: "item-stationery",
      name: "Exam survival stationery",
      category: "Other",
      condition: "New",
      ownerId: "user-aisha",
      availabilityStatus: "available",
      image: photos.study,
      description:
        "Calculator, pouch, ruler and the little bits you always forget.",
      availableFrom: dateOffset(0),
      availableUntil: dateOffset(18),
    },
  ]

  const requests: BorrowRequest[] = [
    {
      id: "request-seed-active",
      itemId: "item-kit",
      borrowerId: "user-aisha",
      ownerId: "user-kabir",
      requestedFrom: dateOffset(-1),
      requestedUntil: dateOffset(2),
      message: "For my studio presentation.",
      status: "approved",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },

    {
      id: "request-seed-history",
      itemId: "item-headphones",
      borrowerId: "user-mira",
      ownerId: "user-kabir",
      requestedFrom: dateOffset(-12),
      requestedUntil: dateOffset(-10),
      message: "For a library session.",
      status: "approved",
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    },
  ]

  const transactions: Transaction[] = [
    {
      id: "transaction-seed-active",
      requestId: "request-seed-active",
      itemId: "item-kit",
      borrowerId: "user-aisha",
      ownerId: "user-kabir",
      status: "borrowed",
      handoverAt: new Date(Date.now() - 86400000).toISOString(),
      dueAt: dateOffset(2),
      returnedAt: null,
    },

    {
      id: "transaction-seed-history",
      requestId: "request-seed-history",
      itemId: "item-headphones",
      borrowerId: "user-mira",
      ownerId: "user-kabir",
      status: "returned",
      handoverAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      dueAt: dateOffset(-10),
      returnedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
  ]

  return {
    version: 4,

    users,

    items,

    requests,

    transactions,

    notices: [
      {
        id: "notice-seed",
        userId: "user-aisha",
        text: "Laptop presentation kit is due soon.",
        target: "transaction",
        transactionId: "transaction-seed-active",
        read: false,
        createdAt: new Date().toISOString(),
      },
    ],

    savedItemIds: [],

    requirements: createSeedRequirements(),

    reviews: [],
  }
}

export function createSeedRequirements(): Requirement[] {
  return [
    {
      id: "req-seed-calculator",
      title: "TI-84 or Casio graphing calculator for EE 201",
      description:
        "Need a graphing or scientific calculator for the electrical circuits midterm on Friday. Will return right after the exam in Maple lobby.",
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
          offeredById: "user-aisha",
          message:
            "I have my Casio FX-991ES Plus ready to lend! Fresh batteries and can meet at the Maple 2nd floor lounge.",
          itemId: "item-calculator",
          itemName: "Casio scientific calculator",
          status: "pending",
          createdAt: new Date(Date.now() - 43200000).toISOString(),
        },
      ],
    },
    {
      id: "req-seed-cable",
      title: "Long Ethernet cable (Cat6, 5m+) for LAN tournament",
      description:
        "The Wi-Fi in Maple 2nd floor gets spotty during weekend gaming tournaments. Looking for a Cat6 RJ-45 cable to plug directly into the wall port.",
      category: "Electronics",
      authorId: "user-aisha",
      neededBy: dateOffset(3),
      returnDate: dateOffset(5),
      status: "open",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      offers: [],
    },
    {
      id: "req-seed-badminton",
      title: "Badminton racquets pair for Saturday doubles",
      description:
        "Planning a morning doubles game at the campus sports complex this Saturday. Need two racquets with tight strings and good grips.",
      category: "Sports",
      authorId: "user-mira",
      neededBy: dateOffset(4),
      returnDate: dateOffset(4),
      status: "open",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      offers: [],
    },
    {
      id: "req-seed-adapter",
      title: "USB-C to HDMI adapter dongle",
      description:
        "Needed a multi-port display adapter for seminar presentation in Block C projector room.",
      category: "Electronics",
      authorId: "user-kabir",
      neededBy: dateOffset(-4),
      returnDate: dateOffset(-2),
      status: "fulfilled",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      offers: [
        {
          id: "offer-seed-fulfilled",
          requirementId: "req-seed-adapter",
          offeredById: "user-mira",
          message: "Brought my Multi-port adapter to Cedar lounge.",
          itemName: "USB-C Multi-port adapter",
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
    Array.isArray(data.items) &&
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
          requirements: Array.isArray(parsed.requirements)
            ? parsed.requirements
            : createSeedRequirements(),
          reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
        }
        saveData(migrated)
        return migrated
      }
    }

    return createSeedData()
  } catch {
    return createSeedData()
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
