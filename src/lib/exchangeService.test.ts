import { describe, expect, it, vi } from "vitest"
import {
  dbNoticeToNotice,
  dbReviewToReview,
  dbTransactionToTransaction,
  fetchSupabaseNotices,
  fetchSupabaseReviews,
  fetchSupabaseTransactions,
  markSupabaseNoticeRead,
  mutateSupabaseTransaction,
  submitSupabaseReview,
  updateSupabaseUserProfile,
} from "./exchangeService"

describe("exchangeService", () => {
  describe("data mappers", () => {
    it("converts DbTransaction to Transaction", () => {
      const dbTx = {
        id: "tx-1",
        request_id: "req-1",
        item_id: "item-1",
        borrower_id: "user-1",
        owner_id: "user-2",
        status: "approved" as const,
        handover_at: null,
        due_at: "2026-11-01",
        returned_at: null,
      }
      const mapped = dbTransactionToTransaction(dbTx)
      expect(mapped.id).toBe("tx-1")
      expect(mapped.requestId).toBe("req-1")
      expect(mapped.itemId).toBe("item-1")
      expect(mapped.borrowerId).toBe("user-1")
      expect(mapped.ownerId).toBe("user-2")
      expect(mapped.status).toBe("approved")
    })

    it("converts DbReview to Review", () => {
      const dbRev = {
        id: "rev-1",
        transaction_id: "tx-1",
        reviewer_id: "user-1",
        recipient_id: "user-2",
        rating: 5,
        comment: "Excellent experience borrowing this item!",
        created_at: "2026-10-25T10:00:00Z",
      }
      const mapped = dbReviewToReview(dbRev)
      expect(mapped.id).toBe("rev-1")
      expect(mapped.rating).toBe(5)
      expect(mapped.comment).toBe("Excellent experience borrowing this item!")
    })

    it("converts DbNotice to Notice", () => {
      const dbNot = {
        id: "not-1",
        user_id: "user-1",
        text: "Your item was returned.",
        target: "transaction" as const,
        transaction_id: "tx-1",
        read: false,
        created_at: "2026-10-25T10:00:00Z",
      }
      const mapped = dbNoticeToNotice(dbNot)
      expect(mapped.id).toBe("not-1")
      expect(mapped.text).toBe("Your item was returned.")
      expect(mapped.transactionId).toBe("tx-1")
      expect(mapped.read).toBe(false)
    })
  })

  describe("mutateSupabaseTransaction", () => {
    it("calls mutate_transaction RPC and returns updated status", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          status: "borrowed",
          item_availability: "borrowed",
        },
        error: null,
      })
      const mockSupabase = { rpc: mockRpc } as any

      const res = await mutateSupabaseTransaction(mockSupabase, "tx-1", "handover")
      expect(res.ok).toBe(true)
      expect(res.data?.status).toBe("borrowed")
      expect(res.data?.itemAvailability).toBe("borrowed")
      expect(mockRpc).toHaveBeenCalledWith("mutate_transaction", {
        p_transaction_id: "tx-1",
        p_action: "handover",
      })
    })

    it("gracefully falls back if RPC is missing", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST202", message: "function does not exist" },
      })
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: "tx-1", item_id: "item-1", status: "returned" },
        error: null,
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEqTx = vi.fn().mockReturnValue({ select: mockSelect })
      const mockUpdateTx = vi.fn().mockReturnValue({ eq: mockEqTx })

      const mockEqItem = vi.fn().mockResolvedValue({ error: null })
      const mockUpdateItem = vi.fn().mockReturnValue({ eq: mockEqItem })

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "transactions") return { update: mockUpdateTx }
        if (table === "items") return { update: mockUpdateItem }
        return {}
      })

      const mockSupabase = { rpc: mockRpc, from: mockFrom } as any

      const res = await mutateSupabaseTransaction(mockSupabase, "tx-1", "confirm-return")
      expect(res.ok).toBe(true)
      expect(res.data?.status).toBe("returned")
      expect(res.data?.itemAvailability).toBe("available")
    })
  })

  describe("submitSupabaseReview", () => {
    it("validates rating and comment length", async () => {
      const mockSupabase = {} as any
      const res1 = await submitSupabaseReview(mockSupabase, {
        transactionId: "tx-1",
        reviewerId: "user-1",
        rating: 0,
        comment: "Great",
      })
      expect(res1.ok).toBe(false)
      expect(res1.error).toMatch(/between 1 and 5/i)

      const res2 = await submitSupabaseReview(mockSupabase, {
        transactionId: "tx-1",
        reviewerId: "user-1",
        rating: 5,
        comment: "Bad",
      })
      expect(res2.ok).toBe(false)
      expect(res2.error).toMatch(/minimum 5 characters/i)
    })

    it("calls submit_review RPC successfully", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          review_id: "rev-new",
          recipient_id: "user-2",
          new_rating: 4.8,
        },
        error: null,
      })
      const mockSupabase = { rpc: mockRpc } as any

      const res = await submitSupabaseReview(mockSupabase, {
        transactionId: "tx-1",
        reviewerId: "user-1",
        rating: 5,
        comment: "Friendly neighbour, returned on time!",
      })
      expect(res.ok).toBe(true)
      expect(res.data?.reviewId).toBe("rev-new")
      expect(res.data?.newRating).toBe(4.8)
    })
  })

  describe("updateSupabaseUserProfile", () => {
    it("updates profiles and profile_private room number", async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
      const mockUpsert = vi.fn().mockResolvedValue({ error: null })

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "profiles") return { update: mockUpdate }
        if (table === "profile_private") return { upsert: mockUpsert }
        return {}
      })
      const mockSupabase = { from: mockFrom } as any

      const res = await updateSupabaseUserProfile(mockSupabase, "user-1", {
        name: "Aisha Patel",
        hostel: "Cedar Hall",
        roomNumber: "304B",
        bio: "Physics student",
      })

      expect(res.ok).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith({
        name: "Aisha Patel",
        hostel: "Cedar Hall",
        bio: "Physics student",
        avatar_url: undefined,
      })
      expect(mockUpsert).toHaveBeenCalledWith({
        id: "user-1",
        room_number: "304B",
      })
    })
  })

  describe("notices", () => {
    it("fetches notices and marks them as read", async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          {
            id: "not-1",
            user_id: "user-1",
            text: "Request approved",
            target: "transaction",
            transaction_id: "tx-1",
            read: false,
            created_at: "2026-10-25T12:00:00Z",
          },
        ],
        error: null,
      })
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      const mockEqUpdate = vi.fn().mockResolvedValue({ error: null })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate })

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "notices") return { select: mockSelect, update: mockUpdate }
        return {}
      })
      const mockSupabase = { from: mockFrom } as any

      const listRes = await fetchSupabaseNotices(mockSupabase, "user-1")
      expect(listRes.notices.length).toBe(1)
      expect(listRes.notices[0].text).toBe("Request approved")

      const readRes = await markSupabaseNoticeRead(mockSupabase, "not-1")
      expect(readRes).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith({ read: true })
    })
  })
})
