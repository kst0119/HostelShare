export type Category = "Study" | "Electronics" | "Everyday" | "Sports" | "Other";
export type AvailabilityStatus = "available" | "reserved" | "borrowed";
export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";
export type TransactionStatus = "approved" | "borrowed" | "return_pending" | "returned";

export type User = {
  id: string;
  name: string;
  hostel: string;
  roomNumber: string;
  avatar: string;
  rating: number;
  bio: string;
};

export type Item = {
  id: string;
  name: string;
  description: string;
  category: Category;
  image: string;
  condition: string;
  ownerId: string;
  availabilityStatus: AvailabilityStatus;
  availableFrom: string;
  availableUntil: string;
};

export type BorrowRequest = {
  id: string;
  itemId: string;
  borrowerId: string;
  ownerId: string;
  requestedFrom: string;
  requestedUntil: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
};

export type Transaction = {
  id: string;
  requestId: string;
  itemId: string;
  borrowerId: string;
  ownerId: string;
  status: TransactionStatus;
  handoverAt: string | null;
  dueAt: string;
  returnedAt: string | null;
};

export type Notice = {
  id: string;
  userId: string;
  text: string;
  target: "activity" | "transaction";
  transactionId?: string;
  read: boolean;
  createdAt: string;
};

export type AppData = {
  version: 3;
  users: User[];
  items: Item[];
  requests: BorrowRequest[];
  transactions: Transaction[];
  notices: Notice[];
  savedItemIds: string[];
};

export type Result<T = AppData> = { ok: true; data: T; message: string } | { ok: false; error: string };

const photos = {
  calculator: "https://images.unsplash.com/photo-1685038955804-3de172e7ff35?auto=format&fit=crop&w=1200&q=85",
  headphones: "https://images.unsplash.com/photo-1511377107391-116a9d5d20b5?auto=format&fit=crop&w=1200&q=85",
  books: "https://images.unsplash.com/photo-1517090823101-30a5937ceb3c?auto=format&fit=crop&w=1200&q=85",
  desk: "https://images.unsplash.com/photo-1428223501723-d821c5d00ca3?auto=format&fit=crop&w=1200&q=85",
  mouse: "https://images.unsplash.com/photo-1668035626412-420df3662985?auto=format&fit=crop&w=1200&q=85",
  study: "https://images.unsplash.com/photo-1701453031437-b8e2d3f5dd9d?auto=format&fit=crop&w=1200&q=85",
};

export const STORAGE_KEY = "hostelshare-data-v3";
export const CURRENT_USER_KEY = "hostelshare-demo-user-v1";

export function dateOffset(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function createSeedData(): AppData {
  const users: User[] = [
    { id: "user-aisha", name: "Aisha Singh", hostel: "Maple House", roomNumber: "218", avatar: "AS", rating: 4.9, bio: "Product design student, serial note-sharer, and the person with a charger for everything." },
    { id: "user-mira", name: "Mira Nair", hostel: "Maple House", roomNumber: "214", avatar: "MN", rating: 4.8, bio: "Economics student and careful keeper of useful things." },
    { id: "user-kabir", name: "Kabir Shah", hostel: "Cedar Hall", roomNumber: "108", avatar: "KS", rating: 4.7, bio: "Music, electronics, and always happy to help." },
  ];
  const items: Item[] = [
    { id: "item-calculator", name: "Casio scientific calculator", category: "Study", condition: "Like new", ownerId: "user-mira", availabilityStatus: "available", image: photos.calculator, description: "Reliable FX-991ES Plus with a fresh battery. Perfect for exam week or lab calculations.", availableFrom: dateOffset(0), availableUntil: dateOffset(30) },
    { id: "item-headphones", name: "Noise-cancelling headphones", category: "Electronics", condition: "Good", ownerId: "user-kabir", availabilityStatus: "available", image: photos.headphones, description: "Comfortable over-ear headphones with a wired connection and travel pouch.", availableFrom: dateOffset(0), availableUntil: dateOffset(20) },
    { id: "item-books", name: "Introduction to economics set", category: "Study", condition: "Loved", ownerId: "user-aisha", availabilityStatus: "available", image: photos.books, description: "Core reading plus tidy semester notes tucked inside. Please keep them dry.", availableFrom: dateOffset(0), availableUntil: dateOffset(45) },
    { id: "item-kit", name: "Laptop presentation kit", category: "Electronics", condition: "Great", ownerId: "user-kabir", availabilityStatus: "borrowed", image: photos.desk, description: "Laptop stand, HDMI adapter and wireless presenter for seminar days.", availableFrom: dateOffset(4), availableUntil: dateOffset(40) },
    { id: "item-mouse", name: "Wireless mouse", category: "Electronics", condition: "Like new", ownerId: "user-mira", availabilityStatus: "available", image: photos.mouse, description: "Compact Bluetooth mouse, silent click, charged and ready.", availableFrom: dateOffset(0), availableUntil: dateOffset(25) },
    { id: "item-stationery", name: "Exam survival stationery", category: "Other", condition: "New", ownerId: "user-aisha", availabilityStatus: "available", image: photos.study, description: "Calculator, pouch, ruler and the little bits you always forget.", availableFrom: dateOffset(0), availableUntil: dateOffset(18) },
  ];
  const requests: BorrowRequest[] = [
    { id: "request-seed-active", itemId: "item-kit", borrowerId: "user-aisha", ownerId: "user-kabir", requestedFrom: dateOffset(-1), requestedUntil: dateOffset(2), message: "For my studio presentation.", status: "approved", createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: "request-seed-history", itemId: "item-headphones", borrowerId: "user-mira", ownerId: "user-kabir", requestedFrom: dateOffset(-12), requestedUntil: dateOffset(-10), message: "For a library session.", status: "approved", createdAt: new Date(Date.now() - 86400000 * 14).toISOString() },
  ];
  const transactions: Transaction[] = [
    { id: "transaction-seed-active", requestId: "request-seed-active", itemId: "item-kit", borrowerId: "user-aisha", ownerId: "user-kabir", status: "borrowed", handoverAt: new Date(Date.now() - 86400000).toISOString(), dueAt: dateOffset(2), returnedAt: null },
    { id: "transaction-seed-history", requestId: "request-seed-history", itemId: "item-headphones", borrowerId: "user-mira", ownerId: "user-kabir", status: "returned", handoverAt: new Date(Date.now() - 86400000 * 12).toISOString(), dueAt: dateOffset(-10), returnedAt: new Date(Date.now() - 86400000 * 10).toISOString() },
  ];
  return {
    version: 3,
    users,
    items,
    requests,
    transactions,
    notices: [
      { id: "notice-seed", userId: "user-aisha", text: "Laptop presentation kit is due soon.", target: "transaction", transactionId: "transaction-seed-active", read: false, createdAt: new Date().toISOString() },
    ],
    savedItemIds: [],
  };
}

function isValidData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<AppData>;
  return data.version === 3 && Array.isArray(data.users) && Array.isArray(data.items) && Array.isArray(data.requests) && Array.isArray(data.transactions);
}

export function loadData(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createSeedData();
    const parsed: unknown = JSON.parse(saved);
    return isValidData(parsed) ? parsed : createSeedData();
  } catch {
    return createSeedData();
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createItem(data: AppData, item: Omit<Item, "id" | "availabilityStatus">): Result {
  if (!item.name.trim() || item.description.trim().length < 12) return { ok: false, error: "Add a clear name and a description of at least 12 characters." };
  if (!item.image) return { ok: false, error: "Add a photo before publishing." };
  if (!item.availableFrom || !item.availableUntil || item.availableFrom > item.availableUntil) return { ok: false, error: "Availability end date must be on or after the start date." };
  const created: Item = { ...item, id: `item-${crypto.randomUUID()}`, availabilityStatus: "available" };
  return { ok: true, data: { ...data, items: [created, ...data.items] }, message: `${created.name} is now listed.` };
}

export function createBorrowRequest(data: AppData, input: Omit<BorrowRequest, "id" | "status" | "createdAt" | "ownerId">): Result {
  const item = data.items.find(candidate => candidate.id === input.itemId);
  if (!item) return { ok: false, error: "This item no longer exists." };
  if (item.ownerId === input.borrowerId) return { ok: false, error: "You cannot borrow your own item. Switch demo users to test another borrower." };
  if (item.availabilityStatus !== "available") return { ok: false, error: "This item is already reserved or borrowed." };
  if (!input.requestedFrom || !input.requestedUntil) return { ok: false, error: "Choose both a start and return date." };
  if (input.requestedFrom < dateOffset(0)) return { ok: false, error: "The borrowing period cannot begin in the past." };
  if (input.requestedFrom > input.requestedUntil) return { ok: false, error: "Return date must be after the start date." };
  if (input.requestedFrom < item.availableFrom || input.requestedUntil > item.availableUntil) return { ok: false, error: `Choose dates between ${item.availableFrom} and ${item.availableUntil}.` };
  const duplicate = data.requests.some(request => request.itemId === item.id && request.borrowerId === input.borrowerId && request.status === "pending");
  if (duplicate) return { ok: false, error: "You already have a pending request for this item." };
  const activeLoan = data.transactions.some(transaction => transaction.itemId === item.id && transaction.status !== "returned");
  if (activeLoan) return { ok: false, error: "This item already has an active loan." };
  const request: BorrowRequest = { ...input, id: `request-${crypto.randomUUID()}`, ownerId: item.ownerId, status: "pending", createdAt: new Date().toISOString() };
  const borrower = data.users.find(user => user.id === input.borrowerId);
  const notice: Notice = { id: `notice-${crypto.randomUUID()}`, userId: item.ownerId, text: `${borrower?.name || "A student"} requested ${item.name}.`, target: "activity", read: false, createdAt: new Date().toISOString() };
  return { ok: true, data: { ...data, requests: [request, ...data.requests], notices: [notice, ...data.notices] }, message: `Request sent to ${data.users.find(user => user.id === item.ownerId)?.name}.` };
}

export function decideRequest(data: AppData, requestId: string, actorId: string, decision: "approved" | "rejected"): Result {
  const request = data.requests.find(candidate => candidate.id === requestId);
  if (!request) return { ok: false, error: "Request not found." };
  if (request.ownerId !== actorId) return { ok: false, error: "Only the item owner can decide this request." };
  if (request.status !== "pending") return { ok: false, error: "This request has already been decided." };
  const item = data.items.find(candidate => candidate.id === request.itemId);
  if (!item) return { ok: false, error: "The requested item no longer exists." };
  if (decision === "approved" && item.availabilityStatus !== "available") return { ok: false, error: "This item is no longer available to approve." };

  let requests = data.requests.map(candidate => candidate.id === requestId ? { ...candidate, status: decision } : candidate);
  let items = data.items;
  let transactions = data.transactions;
  if (decision === "approved") {
    requests = requests.map(candidate => candidate.itemId === request.itemId && candidate.id !== requestId && candidate.status === "pending" ? { ...candidate, status: "rejected" } : candidate);
    items = items.map(candidate => candidate.id === request.itemId ? { ...candidate, availabilityStatus: "reserved" } : candidate);
    transactions = [{ id: `transaction-${crypto.randomUUID()}`, requestId: request.id, itemId: request.itemId, borrowerId: request.borrowerId, ownerId: request.ownerId, status: "approved", handoverAt: null, dueAt: request.requestedUntil, returnedAt: null }, ...transactions];
  }
  const notice: Notice = { id: `notice-${crypto.randomUUID()}`, userId: request.borrowerId, text: `${item.name} request ${decision === "approved" ? "approved" : "declined"}.`, target: decision === "approved" ? "transaction" : "activity", transactionId: transactions.find(transaction => transaction.requestId === request.id)?.id, read: false, createdAt: new Date().toISOString() };
  return { ok: true, data: { ...data, requests, items, transactions, notices: [notice, ...data.notices] }, message: decision === "approved" ? "Request approved and item reserved." : "Request declined." };
}

export function recordHandover(data: AppData, transactionId: string, actorId: string): Result {
  const transaction = data.transactions.find(candidate => candidate.id === transactionId);
  if (!transaction) return { ok: false, error: "Transaction not found." };
  if (![transaction.ownerId, transaction.borrowerId].includes(actorId)) return { ok: false, error: "Only the borrower or owner can confirm this handover." };
  if (transaction.status !== "approved") return { ok: false, error: "This handover is not ready to confirm." };
  const transactions = data.transactions.map(candidate => candidate.id === transactionId ? { ...candidate, status: "borrowed", handoverAt: new Date().toISOString() } as Transaction : candidate);
  const items = data.items.map(candidate => candidate.id === transaction.itemId ? { ...candidate, availabilityStatus: "borrowed" } as Item : candidate);
  return { ok: true, data: { ...data, transactions, items }, message: "Handover recorded. The item is now currently borrowed." };
}

export function initiateReturn(data: AppData, transactionId: string, actorId: string): Result {
  const transaction = data.transactions.find(candidate => candidate.id === transactionId);
  if (!transaction) return { ok: false, error: "Transaction not found." };
  if (![transaction.ownerId, transaction.borrowerId].includes(actorId)) return { ok: false, error: "Only the borrower or owner can initiate a return." };
  if (transaction.status !== "borrowed") return { ok: false, error: "Only a borrowed item can be returned." };
  const transactions = data.transactions.map(candidate => candidate.id === transactionId ? { ...candidate, status: "return_pending" } as Transaction : candidate);
  const otherUser = actorId === transaction.ownerId ? transaction.borrowerId : transaction.ownerId;
  const item = data.items.find(candidate => candidate.id === transaction.itemId);
  const notice: Notice = { id: `notice-${crypto.randomUUID()}`, userId: otherUser, text: `Return confirmation needed for ${item?.name}.`, target: "transaction", transactionId, read: false, createdAt: new Date().toISOString() };
  return { ok: true, data: { ...data, transactions, notices: [notice, ...data.notices] }, message: "Return started. The other student can now confirm it." };
}

export function confirmReturn(data: AppData, transactionId: string, actorId: string): Result {
  const transaction = data.transactions.find(candidate => candidate.id === transactionId);
  if (!transaction) return { ok: false, error: "Transaction not found." };
  if (![transaction.ownerId, transaction.borrowerId].includes(actorId)) return { ok: false, error: "Only a participant can confirm this return." };
  if (transaction.status !== "return_pending") return { ok: false, error: "Start the return before confirming it." };
  const transactions = data.transactions.map(candidate => candidate.id === transactionId ? { ...candidate, status: "returned", returnedAt: new Date().toISOString() } as Transaction : candidate);
  const items = data.items.map(candidate => candidate.id === transaction.itemId ? { ...candidate, availabilityStatus: "available" } as Item : candidate);
  return { ok: true, data: { ...data, transactions, items }, message: "Return confirmed. The item is available again." };
}

export function toggleSaved(data: AppData, itemId: string): AppData {
  const savedItemIds = data.savedItemIds.includes(itemId) ? data.savedItemIds.filter(id => id !== itemId) : [...data.savedItemIds, itemId];
  return { ...data, savedItemIds };
}

export function markNoticeRead(data: AppData, noticeId: string): AppData {
  return { ...data, notices: data.notices.map(notice => notice.id === noticeId ? { ...notice, read: true } : notice) };
}
