import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useNavigate } from "react-router-dom"
import {
  AppData,
  BorrowRequest,
  cancelRequirement,
  confirmReturn,
  createBorrowRequest,
  createItem,
  createRequirement,
  createRequirementOffer,
  createReview,
  createSeedData,
  CURRENT_USER_KEY,
  decideRequest,
  decideRequirementOffer,
  deleteItem,
  fulfillRequirement,
  initiateReturn,
  Item,
  loadData,
  markNoticeRead,
  Notice,
  recordHandover,
  Requirement,
  Result,
  Review,
  saveData,
  STORAGE_KEY,
  toggleSaved,
  Transaction,
  updateItem,
  User,
  userFor,
} from "../store"
import { useAuth } from "./AuthContext"
import { supabase } from "../lib/supabase"
import {
  createSupabaseItem,
  deleteSupabaseItem,
  fetchSupabaseItems,
  profileToUser,
  updateSupabaseItem,
} from "../lib/itemService"
import {
  cancelSupabaseBorrowRequest,
  createSupabaseBorrowRequest,
  decideSupabaseBorrowRequest,
  fetchIncomingBorrowRequests,
  fetchOutgoingBorrowRequests,
} from "../lib/borrowRequestService"
import {
  fetchSupabaseNotices,
  fetchSupabaseReviews,
  fetchSupabaseTransactions,
  markSupabaseNoticeRead,
  mutateSupabaseTransaction,
  submitSupabaseReview,
  updateSupabaseUserProfile,
} from "../lib/exchangeService"

export type Theme = "light" | "dark"
export const THEME_KEY = "hostelshare-theme"
export type Flash = {
  type: "success" | "error"
  text: string
} | null
export type Dialog = "reset" | "profile" | "report" | "auth" | null

export function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === "light" || saved === "dark") return saved
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark"
    }
  } catch {
    // fallback to light
  }
  return "light"
}

export type AppContextType = {
  data: AppData
  setData: React.Dispatch<React.SetStateAction<AppData>>
  currentUser: User
  currentUserId: string
  switchUser: (id: string) => void
  theme: Theme
  toggleTheme: () => void
  flash: Flash
  setFlash: (flash: Flash) => void
  dismissFlash: () => void
  dialog: Dialog
  setDialog: (dialog: Dialog) => void
  apply: (result: Result, successPath?: string) => boolean
  mutateTransaction: (
    action: "handover" | "initiate-return" | "confirm-return",
    id: string,
  ) => Promise<void> | void
  openNotice: (id: string) => void
  toggleSaveItem: (itemId: string) => void
  updateProfile: (user: User) => Promise<void> | void
  resetDemoData: () => void
  itemsLoading: boolean
  itemsError: string | null
  refreshItems: () => Promise<void>
  transactionsLoading: boolean
  transactionsError: string | null
  refreshTransactions: () => Promise<void>
  refreshReviews: () => Promise<void>
  refreshNotices: () => Promise<void>
  createItemListing: (
    item: Omit<Item, "id" | "availabilityStatus">,
  ) => Promise<Result<Item>>
  updateItemListing: (
    itemId: string,
    updates: Partial<Omit<Item, "id" | "ownerId">>,
  ) => Promise<Result<Item>>
  deleteItemListing: (itemId: string) => Promise<Result>
  submitBorrowRequest: (input: {
    itemId: string
    borrowerId: string
    requestedFrom: string
    requestedUntil: string
    message: string
  }) => Promise<Result<BorrowRequest>> | Result
  decideBorrowRequest: (
    id: string,
    decision: "approved" | "rejected",
  ) => Promise<boolean> | boolean
  cancelBorrowRequest: (id: string) => Promise<boolean> | boolean
  requestsLoading: boolean
  requestsError: string | null
  refreshBorrowRequests: () => Promise<void>
  postRequirement: (
    input: Omit<Requirement, "id" | "status" | "createdAt" | "offers">,
  ) => Result
  cancelUserRequirement: (id: string) => boolean
  fulfillUserRequirement: (id: string) => boolean
  submitRequirementOffer: (
    requirementId: string,
    input: {
      message: string
      itemId?: string
      itemName?: string
      availableFrom?: string
      availableUntil?: string
    },
  ) => Result
  decideOffer: (
    requirementId: string,
    offerId: string,
    decision: "accepted" | "declined",
  ) => boolean
  submitReview: (input: {
    transactionId: string
    rating: number
    comment: string
  }) => Promise<Result> | Result
}

const AppContext = createContext<AppContextType | null>(null)

export function useApp(): AppContextType {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

export default function AppProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { user, isConfigured } = useAuth()
  const [data, setData] = useState<AppData>(() => loadData())
  const [currentUserId, setCurrentUserId] = useState(
    () => localStorage.getItem(CURRENT_USER_KEY) || "user-aisha",
  )
  const [itemsLoading, setItemsLoading] = useState<boolean>(false)
  const [itemsError, setItemsError] = useState<string | null>(null)
  const [requestsLoading, setRequestsLoading] = useState<boolean>(false)
  const [requestsError, setRequestsError] = useState<string | null>(null)
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(false)
  const [transactionsError, setTransactionsError] = useState<string | null>(null)
  const [flash, setFlash] = useState<Flash>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme())

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Ignore storage errors
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }

  const currentUser = useMemo(() => {
    return userFor(
      data,
      data.users.some((u) => u.id === currentUserId)
        ? currentUserId
        : data.users[0]?.id || "user-aisha",
    )
  }, [data, currentUserId])

  // Only persist demo state to localStorage when unauthenticated
  useEffect(() => {
    if (!user) {
      saveData(data)
    }
  }, [data, user])

  useEffect(() => {
    if (!user) {
      localStorage.setItem(CURRENT_USER_KEY, currentUser.id)
    }
  }, [currentUser.id, user])

  useEffect(() => {
    if (!flash) return
    const timeout = window.setTimeout(() => setFlash(null), 4200)
    return () => clearTimeout(timeout)
  }, [flash])

  const dismissFlash = () => setFlash(null)

  const refreshItems = useCallback(async () => {
    if (!user || !isConfigured) return
    setItemsLoading(true)
    setItemsError(null)
    const { items: fetchedItems, users: fetchedUsers, error } =
      await fetchSupabaseItems(supabase)

    if (error) {
      setItemsError(error)
      setItemsLoading(false)
      return
    }

    setData((current) => {
      const mergedUsers = [...current.users]
      for (const u of fetchedUsers) {
        const idx = mergedUsers.findIndex((x) => x.id === u.id)
        if (idx >= 0) {
          mergedUsers[idx] = { ...mergedUsers[idx], ...u }
        } else {
          mergedUsers.push(u)
        }
      }
      return {
        ...current,
        items: fetchedItems,
        users: mergedUsers,
      }
    })
    setItemsLoading(false)
  }, [user, isConfigured])

  const refreshBorrowRequests = useCallback(async () => {
    if (!user || !isConfigured) return
    setRequestsLoading(true)
    setRequestsError(null)

    try {
      const [outgoingRes, incomingRes] = await Promise.all([
        fetchOutgoingBorrowRequests(supabase, user.id),
        fetchIncomingBorrowRequests(supabase, user.id),
      ])

      if (outgoingRes.error && incomingRes.error) {
        setRequestsError(outgoingRes.error || incomingRes.error)
        setRequestsLoading(false)
        return
      }

      setData((current) => {
        const combined = [...outgoingRes.requests, ...incomingRes.requests]
        const reqMap = new Map<string, BorrowRequest>()
        for (const req of combined) {
          reqMap.set(req.id, req)
        }

        const itemMap = new Map(current.items.map((i) => [i.id, i]))
        for (const item of [...outgoingRes.items, ...incomingRes.items]) {
          itemMap.set(item.id, item)
        }

        const userMap = new Map(current.users.map((u) => [u.id, u]))
        for (const u of [...outgoingRes.owners, ...incomingRes.borrowers]) {
          userMap.set(u.id, u)
        }

        return {
          ...current,
          requests: Array.from(reqMap.values()),
          items: Array.from(itemMap.values()),
          users: Array.from(userMap.values()),
        }
      })
    } catch (err) {
      setRequestsError(
        err instanceof Error ? err.message : "Failed to load borrow requests.",
      )
    } finally {
      setRequestsLoading(false)
    }
  }, [user, isConfigured])

  const refreshTransactions = useCallback(async () => {
    if (!user || !isConfigured) return
    setTransactionsLoading(true)
    setTransactionsError(null)
    const { transactions, error } = await fetchSupabaseTransactions(supabase, user.id)
    setTransactionsLoading(false)
    if (error) {
      setTransactionsError(error)
      return
    }
    if (transactions.length > 0) {
      setData((current) => {
        const txMap = new Map<string, Transaction>(current.transactions.map((t) => [t.id, t]))
        for (const tx of transactions) {
          txMap.set(tx.id, tx)
        }
        return { ...current, transactions: Array.from(txMap.values()) }
      })
    }
  }, [user, isConfigured])

  const refreshReviews = useCallback(async () => {
    if (!user || !isConfigured) return
    const { reviews, error } = await fetchSupabaseReviews(supabase)
    if (!error && reviews.length > 0) {
      setData((current) => {
        const revMap = new Map<string, Review>((current.reviews || []).map((r) => [r.id, r]))
        for (const rev of reviews) {
          revMap.set(rev.id, rev)
        }
        return { ...current, reviews: Array.from(revMap.values()) }
      })
    }
  }, [user, isConfigured])

  const refreshNotices = useCallback(async () => {
    if (!user || !isConfigured) return
    const { notices, error } = await fetchSupabaseNotices(supabase, user.id)
    if (!error && notices.length > 0) {
      setData((current) => {
        const notMap = new Map<string, Notice>(current.notices.map((n) => [n.id, n]))
        for (const not of notices) {
          notMap.set(not.id, not)
        }
        return { ...current, notices: Array.from(notMap.values()) }
      })
    }
  }, [user, isConfigured])

  // Sync profile, live items, borrow requests, transactions, and reviews when authenticated user changes
  useEffect(() => {
    if (user && isConfigured) {
      // 1. Fetch user's community profile and private room number
      Promise.all([
        supabase
          .from("profiles")
          .select("id, name, hostel, avatar_url, bio, rating")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("profile_private")
          .select("room_number")
          .eq("id", user.id)
          .maybeSingle(),
      ]).then(([{ data: profile }, { data: privateProfile }]) => {
        const authUser: User = {
          id: user.id,
          name:
            profile?.name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Student Resident",
          hostel: profile?.hostel || "Maple House",
          roomNumber: privateProfile?.room_number || "—",
          avatar:
            profile?.avatar_url ||
            (user.user_metadata?.full_name || user.email || "SR")
              .trim()
              .split(/\s+/)
              .map((w: string) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
          rating:
            typeof profile?.rating === "number" ? profile.rating : 5.0,
          bio: profile?.bio || "",
        }

        setData((current) => {
          const users = current.users.some((u) => u.id === authUser.id)
            ? current.users.map((u) => (u.id === authUser.id ? authUser : u))
            : [authUser, ...current.users]
          return { ...current, users }
        })
        setCurrentUserId(user.id)
      })

      // 2. Fetch live data
      refreshItems()
      refreshBorrowRequests()
      refreshTransactions()
      refreshReviews()
      refreshNotices()
    } else {
      // Revert to demo dataset on sign out
      const fresh = loadData()
      setData(fresh)
      const savedUser = localStorage.getItem(CURRENT_USER_KEY) || "user-aisha"
      setCurrentUserId(savedUser)
      setItemsError(null)
      setItemsLoading(false)
      setRequestsError(null)
      setRequestsLoading(false)
      setTransactionsError(null)
      setTransactionsLoading(false)
    }
  }, [user, isConfigured, refreshItems, refreshBorrowRequests, refreshTransactions, refreshReviews, refreshNotices])

  const apply = (result: Result, successPath?: string) => {
    if (!result.ok) {
      setFlash({ type: "error", text: result.error })
      return false
    }
    setData(result.data)
    setFlash({ type: "success", text: result.message })
    if (successPath) {
      navigate(successPath)
    }
    return true
  }

  const switchUser = (id: string) => {
    setCurrentUserId(id)
    setFlash({
      type: "success",
      text: `Demo profile switched to ${userFor(data, id).name}.`,
    })
  }

  const mutateTransaction = async (
    action: "handover" | "initiate-return" | "confirm-return",
    id: string,
  ) => {
    if (user && isConfigured) {
      const targetTx = data.transactions.find((t) => t.id === id)
      const res = await mutateSupabaseTransaction(supabase, id, action, {
        itemId: targetTx?.itemId,
        actorId: user.id,
      })

      if (!res.ok || !res.data) {
        setFlash({ type: "error", text: res.error || `Failed to record ${action}.` })
        return
      }

      setData((current) => {
        const now = new Date().toISOString()
        const newStatus = res.data!.status
        const newAvailability = res.data!.itemAvailability

        const updatedTxList = current.transactions.map((tx) => {
          if (tx.id !== id) return tx
          return {
            ...tx,
            status: newStatus,
            handoverAt: action === "handover" ? now : tx.handoverAt,
            returnedAt: action === "confirm-return" ? now : tx.returnedAt,
          }
        })

        const updatedItems = current.items.map((item) => {
          if (item.id !== targetTx?.itemId) return item
          return { ...item, availabilityStatus: newAvailability }
        })

        return {
          ...current,
          transactions: updatedTxList,
          items: updatedItems,
        }
      })

      setFlash({ type: "success", text: res.message || "Transaction updated." })
      refreshTransactions()
      refreshItems()
      refreshNotices()
    } else {
      const result =
        action === "handover"
          ? recordHandover(data, id, currentUser.id)
          : action === "initiate-return"
            ? initiateReturn(data, id, currentUser.id)
            : confirmReturn(data, id, currentUser.id)
      apply(result)
    }
  }

  const openNotice = (id: string) => {
    const notice = data.notices.find((candidate) => candidate.id === id)
    if (!notice) return
    setData((current) => markNoticeRead(current, id))
    if (user && isConfigured) {
      markSupabaseNoticeRead(supabase, id)
    }
    if (notice.target === "transaction" && notice.transactionId) {
      navigate(`/transactions/${notice.transactionId}`)
    } else if (notice.target === "requirements") {
      navigate("/requirements")
    } else if (notice.target === "profile") {
      navigate("/profile")
    } else {
      navigate("/activity")
    }
  }

  const toggleSaveItem = (itemId: string) => {
    setData((current) => toggleSaved(current, itemId))
  }

  const updateProfile = async (updatedUser: User) => {
    if (user && isConfigured) {
      const res = await updateSupabaseUserProfile(supabase, user.id, {
        name: updatedUser.name,
        hostel: updatedUser.hostel,
        bio: updatedUser.bio,
        roomNumber: updatedUser.roomNumber,
      })

      if (!res.ok) {
        setFlash({ type: "error", text: res.error || "Failed to update profile." })
        return
      }

      setData((current) => ({
        ...current,
        users: current.users.map((c) =>
          c.id === updatedUser.id ? { ...c, ...updatedUser } : c,
        ),
      }))
      setDialog(null)
      setFlash({ type: "success", text: "Profile updated successfully." })
    } else {
      setData((current) => ({
        ...current,
        users: current.users.map((c) =>
          c.id === updatedUser.id ? updatedUser : c,
        ),
      }))
      setDialog(null)
      setFlash({ type: "success", text: "Profile updated locally." })
    }
  }

  const resetDemoData = () => {
    const fresh = createSeedData()
    saveData(fresh)
    setData(fresh)
    setCurrentUserId("user-aisha")
    try {
      localStorage.setItem(CURRENT_USER_KEY, "user-aisha")
    } catch {
      // Ignore storage errors
    }
    setDialog(null)
    setFlash({
      type: "success",
      text: "Demo data reset to initial state.",
    })
    navigate("/")
  }

  const createItemListing = async (
    item: Omit<Item, "id" | "availabilityStatus">,
  ): Promise<Result<Item>> => {
    if (user && isConfigured) {
      setItemsLoading(true)
      const res = await createSupabaseItem(supabase, item, user.id)
      setItemsLoading(false)
      if (!res.ok || !res.data) {
        setFlash({
          type: "error",
          text: res.error || "Failed to publish listing.",
        })
        return {
          ok: false,
          error: res.error || "Failed to publish listing.",
        }
      }
      const newItem = res.data
      setData((current) => ({
        ...current,
        items: [newItem, ...current.items.filter((i) => i.id !== newItem.id)],
      }))
      setFlash({
        type: "success",
        text: res.message || `${newItem.name} is now listed.`,
      })
      return {
        ok: true,
        data: newItem,
        message: res.message || `${newItem.name} is now listed.`,
      }
    } else {
      const result = createItem(data, item)
      if (result.ok) {
        setData(result.data)
        setFlash({ type: "success", text: result.message })
        const createdItem = result.data.items[0]
        return { ok: true, data: createdItem, message: result.message }
      }
      return result as Result<Item>
    }
  }

  const updateItemListing = async (
    itemId: string,
    updates: Partial<Omit<Item, "id" | "ownerId">>,
  ): Promise<Result<Item>> => {
    if (user && isConfigured) {
      const res = await updateSupabaseItem(supabase, itemId, updates)
      if (!res.ok || !res.data) {
        setFlash({
          type: "error",
          text: res.error || "Failed to update listing.",
        })
        return {
          ok: false,
          error: res.error || "Failed to update listing.",
        }
      }
      const updated = res.data
      setData((current) => ({
        ...current,
        items: current.items.map((i) => (i.id === itemId ? updated : i)),
      }))
      setFlash({
        type: "success",
        text: res.message || `${updated.name} updated.`,
      })
      return {
        ok: true,
        data: updated,
        message: res.message || `${updated.name} updated.`,
      }
    } else {
      const result = updateItem(data, itemId, currentUser.id, updates)
      if (result.ok) {
        setData(result.data)
        setFlash({ type: "success", text: result.message })
        const updated = result.data.items.find((i) => i.id === itemId)!
        return { ok: true, data: updated, message: result.message }
      }
      return result as Result<Item>
    }
  }

  const deleteItemListing = async (itemId: string): Promise<Result> => {
    if (user && isConfigured) {
      const res = await deleteSupabaseItem(supabase, itemId)
      if (!res.ok) {
        setFlash({
          type: "error",
          text: res.error || "Failed to delete listing.",
        })
        return {
          ok: false,
          error: res.error || "Failed to delete listing.",
        }
      }
      setData((current) => ({
        ...current,
        items: current.items.filter((i) => i.id !== itemId),
        savedItemIds: current.savedItemIds.filter((id) => id !== itemId),
      }))
      setFlash({ type: "success", text: res.message || "Listing removed." })
      return { ok: true, data: data, message: res.message || "Listing removed." }
    } else {
      const result = deleteItem(data, itemId, currentUser.id)
      if (result.ok) {
        setData(result.data)
        setFlash({ type: "success", text: result.message })
      }
      return result
    }
  }

  const submitBorrowRequest = async (input: {
    itemId: string
    borrowerId: string
    requestedFrom: string
    requestedUntil: string
    message: string
  }): Promise<Result<BorrowRequest>> => {
    if (user && isConfigured) {
      const targetItem = data.items.find((i) => i.id === input.itemId)
      const res = await createSupabaseBorrowRequest(supabase, {
        itemId: input.itemId,
        borrowerId: user.id,
        itemOwnerId: targetItem?.ownerId,
        requestedFrom: input.requestedFrom,
        requestedUntil: input.requestedUntil,
        message: input.message,
        itemAvailableFrom: targetItem?.availableFrom,
        itemAvailableUntil: targetItem?.availableUntil,
        itemAvailabilityStatus: targetItem?.availabilityStatus,
      })

      if (!res.ok || !res.data) {
        setFlash({
          type: "error",
          text: res.error || "Failed to submit borrow request.",
        })
        return {
          ok: false,
          error: res.error || "Failed to submit borrow request.",
        }
      }

      const created = res.data
      setData((current) => ({
        ...current,
        requests: [created, ...current.requests.filter((r) => r.id !== created.id)],
      }))
      setFlash({
        type: "success",
        text: res.message || "Borrow request submitted successfully.",
      })
      return {
        ok: true,
        data: created,
        message: res.message || "Borrow request submitted successfully.",
      }
    } else {
      const result = createBorrowRequest(data, input)
      if (result.ok) {
        setData(result.data)
        setFlash({ type: "success", text: result.message })
        const createdReq = result.data.requests[0]
        return { ok: true, data: createdReq, message: result.message }
      }
      return result as Result<BorrowRequest>
    }
  }

  const decideBorrowRequest = async (
    id: string,
    decision: "approved" | "rejected",
  ): Promise<boolean> => {
    if (user && isConfigured) {
      const res = await decideSupabaseBorrowRequest(supabase, id, decision)
      if (!res.ok) {
        setFlash({
          type: "error",
          text: res.error || `Failed to ${decision} borrow request.`,
        })
        return false
      }

      setData((current) => {
        const targetReq = current.requests.find((r) => r.id === id)
        const updatedRequests = current.requests.map((r) => {
          if (r.id === id) {
            return { ...r, status: decision }
          }
          if (
            decision === "approved" &&
            targetReq &&
            r.itemId === targetReq.itemId &&
            r.status === "pending"
          ) {
            return { ...r, status: "rejected" as const }
          }
          return r
        })

        const updatedItems =
          decision === "approved" && targetReq
            ? current.items.map((item) =>
                item.id === targetReq.itemId
                  ? { ...item, availabilityStatus: "reserved" as const }
                  : item,
              )
            : current.items

        return {
          ...current,
          requests: updatedRequests,
          items: updatedItems,
        }
      })

      setFlash({
        type: "success",
        text: res.message || `Request ${decision}.`,
      })
      refreshItems()
      refreshBorrowRequests()
      refreshTransactions()
      refreshNotices()
      return true
    } else {
      return apply(decideRequest(data, id, currentUser.id, decision))
    }
  }

  const cancelBorrowRequest = async (id: string): Promise<boolean> => {
    if (user && isConfigured) {
      const res = await cancelSupabaseBorrowRequest(supabase, id, user.id)
      if (!res.ok) {
        setFlash({
          type: "error",
          text: res.error || "Failed to cancel borrow request.",
        })
        return false
      }

      setData((current) => ({
        ...current,
        requests: current.requests.map((r) =>
          r.id === id ? { ...r, status: "cancelled" as const } : r,
        ),
      }))

      setFlash({
        type: "success",
        text: res.message || "Borrow request cancelled.",
      })
      refreshBorrowRequests()
      return true
    } else {
      setData((current) => ({
        ...current,
        requests: current.requests.map((r) =>
          r.id === id ? { ...r, status: "cancelled" as const } : r,
        ),
      }))
      setFlash({
        type: "success",
        text: "Borrow request cancelled.",
      })
      return true
    }
  }

  const postRequirement = (
    input: Omit<Requirement, "id" | "status" | "createdAt" | "offers">,
  ) => {
    const result = createRequirement(data, input)
    if (result.ok) {
      setData(result.data)
      setFlash({ type: "success", text: result.message })
    }
    return result
  }

  const cancelUserRequirement = (id: string) => {
    return apply(cancelRequirement(data, id, currentUser.id))
  }

  const fulfillUserRequirement = (id: string) => {
    return apply(fulfillRequirement(data, id, currentUser.id))
  }

  const submitRequirementOffer = (
    requirementId: string,
    input: {
      message: string
      itemId?: string
      itemName?: string
      availableFrom?: string
      availableUntil?: string
    },
  ) => {
    const result = createRequirementOffer(data, requirementId, {
      ...input,
      offeredById: currentUser.id,
    })
    if (result.ok) {
      setData(result.data)
      setFlash({ type: "success", text: result.message })
    }
    return result
  }

  const decideOffer = (
    requirementId: string,
    offerId: string,
    decision: "accepted" | "declined",
  ) => {
    return apply(
      decideRequirementOffer(
        data,
        requirementId,
        offerId,
        currentUser.id,
        decision,
      ),
    )
  }

  const submitReview = async (input: {
    transactionId: string
    rating: number
    comment: string
  }): Promise<Result> => {
    if (user && isConfigured) {
      const targetTx = data.transactions.find((t) => t.id === input.transactionId)
      const recipientId =
        targetTx?.borrowerId === user.id ? targetTx?.ownerId : targetTx?.borrowerId

      const res = await submitSupabaseReview(supabase, {
        transactionId: input.transactionId,
        reviewerId: user.id,
        recipientId,
        rating: input.rating,
        comment: input.comment,
      })

      if (!res.ok) {
        setFlash({ type: "error", text: res.error || "Failed to submit review." })
        return { ok: false, error: res.error || "Failed to submit review." }
      }

      const newReview: Review = {
        id: res.data?.reviewId || `review-${Date.now()}`,
        transactionId: input.transactionId,
        reviewerId: user.id,
        recipientId: recipientId || "",
        rating: input.rating,
        comment: input.comment.trim(),
        createdAt: new Date().toISOString(),
      }

      setData((current) => {
        const updatedReviews = [newReview, ...(current.reviews || [])]
        const updatedUsers =
          res.data?.newRating && recipientId
            ? current.users.map((u) =>
                u.id === recipientId ? { ...u, rating: res.data!.newRating! } : u,
              )
            : current.users
        return {
          ...current,
          reviews: updatedReviews,
          users: updatedUsers,
        }
      })

      setFlash({ type: "success", text: res.message || "Review submitted." })
      refreshReviews()
      refreshNotices()
      return { ok: true, data, message: res.message || "Review submitted." }
    } else {
      const result = createReview(data, {
        ...input,
        reviewerId: currentUser.id,
      })
      if (result.ok) {
        setData(result.data)
        setFlash({ type: "success", text: result.message })
      }
      return result
    }
  }

  const value: AppContextType = {
    data,
    setData,
    currentUser,
    currentUserId,
    switchUser,
    theme,
    toggleTheme,
    flash,
    setFlash,
    dismissFlash,
    dialog,
    setDialog,
    apply,
    mutateTransaction,
    openNotice,
    toggleSaveItem,
    updateProfile,
    resetDemoData,
    itemsLoading,
    itemsError,
    refreshItems,
    requestsLoading,
    requestsError,
    refreshBorrowRequests,
    transactionsLoading,
    transactionsError,
    refreshTransactions,
    refreshReviews,
    refreshNotices,
    createItemListing,
    updateItemListing,
    deleteItemListing,
    submitBorrowRequest,
    decideBorrowRequest,
    cancelBorrowRequest,
    postRequirement,
    cancelUserRequirement,
    fulfillUserRequirement,
    submitRequirementOffer,
    decideOffer,
    submitReview,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
