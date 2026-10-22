import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useNavigate } from "react-router-dom"
import {
  AppData,
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
  fulfillRequirement,
  initiateReturn,
  Item,
  loadData,
  markNoticeRead,
  recordHandover,
  Requirement,
  Result,
  saveData,
  STORAGE_KEY,
  toggleSaved,
  User,
  userFor,
} from "../store"

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
  ) => void
  openNotice: (id: string) => void
  toggleSaveItem: (itemId: string) => void
  updateProfile: (user: User) => void
  resetDemoData: () => void
  createItemListing: (item: Omit<Item, "id" | "availabilityStatus">) => Result
  submitBorrowRequest: (input: {
    itemId: string
    borrowerId: string
    requestedFrom: string
    requestedUntil: string
    message: string
  }) => Result
  decideBorrowRequest: (
    id: string,
    decision: "approved" | "rejected",
  ) => boolean
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
  }) => Result
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
  const [data, setData] = useState<AppData>(() => loadData())
  const [currentUserId, setCurrentUserId] = useState(
    () => localStorage.getItem(CURRENT_USER_KEY) || "user-aisha",
  )
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
      data.users.some((user) => user.id === currentUserId)
        ? currentUserId
        : data.users[0]?.id || "user-aisha",
    )
  }, [data, currentUserId])

  useEffect(() => saveData(data), [data])

  useEffect(() => {
    localStorage.setItem(CURRENT_USER_KEY, currentUser.id)
  }, [currentUser.id])

  useEffect(() => {
    if (!flash) return
    const timeout = window.setTimeout(() => setFlash(null), 4200)
    return () => clearTimeout(timeout)
  }, [flash])

  const dismissFlash = () => setFlash(null)

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

  const mutateTransaction = (
    action: "handover" | "initiate-return" | "confirm-return",
    id: string,
  ) => {
    const result =
      action === "handover"
        ? recordHandover(data, id, currentUser.id)
        : action === "initiate-return"
          ? initiateReturn(data, id, currentUser.id)
          : confirmReturn(data, id, currentUser.id)
    apply(result)
  }

  const openNotice = (id: string) => {
    const notice = data.notices.find((candidate) => candidate.id === id)
    if (!notice) return
    setData((current) => markNoticeRead(current, id))
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

  const updateProfile = (updatedUser: User) => {
    setData((current) => ({
      ...current,
      users: current.users.map((c) =>
        c.id === updatedUser.id ? updatedUser : c,
      ),
    }))
    setDialog(null)
    setFlash({ type: "success", text: "Profile updated locally." })
  }

  const resetDemoData = () => {
    const fresh = createSeedData()
    localStorage.removeItem(STORAGE_KEY)
    setData(fresh)
    setCurrentUserId("user-aisha")
    setDialog(null)
    setFlash({
      type: "success",
      text: "Demo data reset to initial state.",
    })
    navigate("/")
  }

  const createItemListing = (item: Omit<Item, "id" | "availabilityStatus">) => {
    const result = createItem(data, item)
    if (result.ok) {
      setData(result.data)
      setFlash({ type: "success", text: result.message })
    }
    return result
  }

  const submitBorrowRequest = (input: {
    itemId: string
    borrowerId: string
    requestedFrom: string
    requestedUntil: string
    message: string
  }) => {
    const result = createBorrowRequest(data, input)
    if (result.ok) {
      setData(result.data)
      setFlash({ type: "success", text: result.message })
    }
    return result
  }

  const decideBorrowRequest = (
    id: string,
    decision: "approved" | "rejected",
  ) => {
    return apply(decideRequest(data, id, currentUser.id, decision))
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

  const submitReview = (input: {
    transactionId: string
    rating: number
    comment: string
  }) => {
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
    createItemListing,
    submitBorrowRequest,
    decideBorrowRequest,
    postRequirement,
    cancelUserRequirement,
    fulfillUserRequirement,
    submitRequirementOffer,
    decideOffer,
    submitReview,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
