import { describe, expect, it, vi } from "vitest"
import {
  cancelSupabaseBorrowRequest,
  createSupabaseBorrowRequest,
  dbBorrowRequestToBorrowRequest,
  decideSupabaseBorrowRequest,
  fetchIncomingBorrowRequests,
  fetchOutgoingBorrowRequests,
  validateBorrowRequestInput,
} from "./borrowRequestService"

describe("borrowRequestService", () => {
  describe("validateBorrowRequestInput", () => {
    it("rejects missing item ID", () => {
      const res = validateBorrowRequestInput({
        itemId: "",
        requestedFrom: "2026-11-01",
        requestedUntil: "2026-11-03",
      })
      expect(res.valid).toBe(false)
      expect(res.error).toMatch(/select an item/i)
    })

    it("rejects missing dates", () => {
      const res = validateBorrowRequestInput({
        itemId: "item-1",
        requestedFrom: "",
        requestedUntil: "2026-11-03",
      })
      expect(res.valid).toBe(false)
      expect(res.error).toMatch(/both pick-up and return dates/i)
    })

    it("rejects return date before pick-up date", () => {
      const res = validateBorrowRequestInput({
        itemId: "item-1",
        requestedFrom: "2026-11-05",
        requestedUntil: "2026-11-02",
      })
      expect(res.valid).toBe(false)
      expect(res.error).toMatch(/on or after/i)
    })

    it("rejects self-borrowing when borrower is the owner", () => {
      const res = validateBorrowRequestInput({
        itemId: "item-1",
        borrowerId: "user-123",
        itemOwnerId: "user-123",
        requestedFrom: "2026-11-01",
        requestedUntil: "2026-11-03",
      })
      expect(res.valid).toBe(false)
      expect(res.error).toMatch(/cannot borrow your own item/i)
    })

    it("rejects request if item is not available", () => {
      const res = validateBorrowRequestInput({
        itemId: "item-1",
        borrowerId: "user-1",
        itemOwnerId: "user-2",
        requestedFrom: "2026-11-01",
        requestedUntil: "2026-11-03",
        itemAvailabilityStatus: "reserved",
      })
      expect(res.valid).toBe(false)
      expect(res.error).toMatch(/reserved and not open/i)
    })

    it("rejects dates outside the item availability window", () => {
      const res1 = validateBorrowRequestInput({
        itemId: "item-1",
        requestedFrom: "2026-10-20",
        requestedUntil: "2026-11-05",
        itemAvailableFrom: "2026-11-01",
        itemAvailableUntil: "2026-11-10",
      })
      expect(res1.valid).toBe(false)
      expect(res1.error).toMatch(/earlier than item's available date/i)

      const res2 = validateBorrowRequestInput({
        itemId: "item-1",
        requestedFrom: "2026-11-02",
        requestedUntil: "2026-11-15",
        itemAvailableFrom: "2026-11-01",
        itemAvailableUntil: "2026-11-10",
      })
      expect(res2.valid).toBe(false)
      expect(res2.error).toMatch(/later than item's return deadline/i)
    })

    it("accepts valid input", () => {
      const res = validateBorrowRequestInput({
        itemId: "item-1",
        borrowerId: "user-1",
        itemOwnerId: "user-2",
        requestedFrom: "2026-11-02",
        requestedUntil: "2026-11-05",
        itemAvailableFrom: "2026-11-01",
        itemAvailableUntil: "2026-11-10",
        itemAvailabilityStatus: "available",
      })
      expect(res.valid).toBe(true)
      expect(res.error).toBeUndefined()
    })
  })

  describe("dbBorrowRequestToBorrowRequest", () => {
    it("maps snake_case database row to camelCase BorrowRequest", () => {
      const row = {
        id: "req-1",
        item_id: "item-1",
        borrower_id: "user-borrower",
        owner_id: "user-owner",
        requested_from: "2026-11-01",
        requested_until: "2026-11-03",
        message: "Need this for midterm",
        status: "pending" as const,
        created_at: "2026-10-25T10:00:00Z",
      }

      const mapped = dbBorrowRequestToBorrowRequest(row)
      expect(mapped.id).toBe("req-1")
      expect(mapped.itemId).toBe("item-1")
      expect(mapped.borrowerId).toBe("user-borrower")
      expect(mapped.ownerId).toBe("user-owner")
      expect(mapped.requestedFrom).toBe("2026-11-01")
      expect(mapped.requestedUntil).toBe("2026-11-03")
      expect(mapped.message).toBe("Need this for midterm")
      expect(mapped.status).toBe("pending")
      expect(mapped.createdAt).toBe("2026-10-25T10:00:00Z")
    })
  })

  describe("createSupabaseBorrowRequest", () => {
    it("submits request successfully to Supabase", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: "req-new",
          item_id: "item-123",
          borrower_id: "user-me",
          owner_id: "user-owner",
          requested_from: "2026-11-01",
          requested_until: "2026-11-03",
          message: "Please lend me this",
          status: "pending",
          created_at: "2026-10-25T12:00:00Z",
        },
        error: null,
      })

      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

      const mockSupabase = { from: mockFrom } as any

      const res = await createSupabaseBorrowRequest(mockSupabase, {
        itemId: "item-123",
        requestedFrom: "2026-11-01",
        requestedUntil: "2026-11-03",
        message: "Please lend me this",
      })

      expect(res.ok).toBe(true)
      expect(res.data?.id).toBe("req-new")
      expect(mockFrom).toHaveBeenCalledWith("borrow_requests")
      expect(mockInsert).toHaveBeenCalledWith({
        item_id: "item-123",
        requested_from: "2026-11-01",
        requested_until: "2026-11-03",
        message: "Please lend me this",
      })
    })

    it("handles duplicate pending request error (uq_borrow_requests_pending_per_user)", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: "23505",
          message: "duplicate key value violates unique constraint uq_borrow_requests_pending_per_user",
        },
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })
      const mockSupabase = { from: mockFrom } as any

      const res = await createSupabaseBorrowRequest(mockSupabase, {
        itemId: "item-123",
        requestedFrom: "2026-11-01",
        requestedUntil: "2026-11-03",
        message: "",
      })

      expect(res.ok).toBe(false)
      expect(res.error).toMatch(/already have a pending borrow request/i)
    })

    it("handles database trigger error for self-borrowing", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: "Residents cannot borrow their own items.",
        },
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })
      const mockSupabase = { from: mockFrom } as any

      const res = await createSupabaseBorrowRequest(mockSupabase, {
        itemId: "item-123",
        requestedFrom: "2026-11-01",
        requestedUntil: "2026-11-03",
        message: "",
      })

      expect(res.ok).toBe(false)
      expect(res.error).toMatch(/cannot borrow your own item/i)
    })
  })

  describe("decideSupabaseBorrowRequest (atomic approval & concurrency safety)", () => {
    it("calls decide_borrow_request RPC and succeeds for approved decision", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          request_id: "req-1",
          status: "approved",
          item_id: "item-100",
          competing_rejected_count: 2,
        },
        error: null,
      })

      const mockSupabase = { rpc: mockRpc } as any

      const res = await decideSupabaseBorrowRequest(mockSupabase, "req-1", "approved")
      expect(res.ok).toBe(true)
      expect(res.data?.status).toBe("approved")
      expect(res.data?.competingRejectedCount).toBe(2)
      expect(mockRpc).toHaveBeenCalledWith("decide_borrow_request", {
        p_request_id: "req-1",
        p_decision: "approved",
      })
    })

    it("handles concurrency conflict error when item was already reserved by another request", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: "Item is no longer available (currently reserved). Another request may have been approved.",
        },
      })

      const mockSupabase = { rpc: mockRpc } as any

      const res = await decideSupabaseBorrowRequest(mockSupabase, "req-1", "approved")
      expect(res.ok).toBe(false)
      expect(res.error).toMatch(/item is no longer available/i)
    })

    it("gracefully falls back to direct table update if RPC function is not found", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: "PGRST202",
          message: "Could not find the function public.decide_borrow_request",
        },
      })

      const mockReqSingle = vi.fn().mockResolvedValue({
        data: { id: "req-1", item_id: "item-100", status: "approved" },
        error: null,
      })
      const mockReqSelect = vi.fn().mockReturnValue({ single: mockReqSingle })
      const mockReqEq = vi.fn().mockReturnValue({ select: mockReqSelect })
      const mockReqUpdate = vi.fn().mockReturnValue({ eq: mockReqEq })

      const mockItemEq = vi.fn().mockResolvedValue({ error: null })
      const mockItemUpdate = vi.fn().mockReturnValue({ eq: mockItemEq })

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "borrow_requests") return { update: mockReqUpdate }
        if (table === "items") return { update: mockItemUpdate }
        return {}
      })

      const mockSupabase = { rpc: mockRpc, from: mockFrom } as any

      const res = await decideSupabaseBorrowRequest(mockSupabase, "req-1", "approved")
      expect(res.ok).toBe(true)
      expect(res.data?.status).toBe("approved")
      expect(mockReqUpdate).toHaveBeenCalledWith({ status: "approved" })
      expect(mockItemUpdate).toHaveBeenCalledWith({ availability_status: "reserved" })
    })
  })

  describe("cancelSupabaseBorrowRequest", () => {
    it("cancels pending request for current borrower", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: "req-1", status: "cancelled" },
        error: null,
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq2 = vi.fn().mockReturnValue({ select: mockSelect })
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 })
      const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })

      const mockSupabase = { from: mockFrom } as any

      const res = await cancelSupabaseBorrowRequest(mockSupabase, "req-1", "borrower-1")
      expect(res.ok).toBe(true)
      expect(res.data?.requestId).toBe("req-1")
      expect(mockUpdate).toHaveBeenCalledWith({ status: "cancelled" })
    })
  })

  describe("fetchOutgoingBorrowRequests and fetchIncomingBorrowRequests", () => {
    it("fetches outgoing requests and parses linked items and owners", async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          {
            id: "req-1",
            item_id: "item-1",
            borrower_id: "borrower-1",
            owner_id: "owner-1",
            requested_from: "2026-11-01",
            requested_until: "2026-11-03",
            message: "Need this",
            status: "pending",
            created_at: "2026-10-25T10:00:00Z",
            items: {
              id: "item-1",
              owner_id: "owner-1",
              name: "MacBook Pro M1",
              description: "Fast laptop for compiling",
              category: "Electronics",
              condition: "Great",
              image_url: "https://example.com/mac.jpg",
              availability_status: "available",
              available_from: "2026-10-25",
              available_until: "2026-11-30",
              profiles: {
                id: "owner-1",
                name: "Aisha Patel",
                hostel: "Maple House",
                avatar_url: null,
                bio: "Bio",
                rating: 4.9,
              },
            },
          },
        ],
        error: null,
      })

      const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
      const mockSupabase = { from: mockFrom } as any

      const res = await fetchOutgoingBorrowRequests(mockSupabase, "borrower-1")
      expect(res.error).toBeNull()
      expect(res.requests.length).toBe(1)
      expect(res.requests[0].id).toBe("req-1")
      expect(res.items.length).toBe(1)
      expect(res.items[0].name).toBe("MacBook Pro M1")
      expect(res.owners.length).toBe(1)
      expect(res.owners[0].name).toBe("Aisha Patel")
    })

    it("fetches incoming requests and parses linked items and borrowers", async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          {
            id: "req-2",
            item_id: "item-1",
            borrower_id: "borrower-2",
            owner_id: "owner-1",
            requested_from: "2026-11-04",
            requested_until: "2026-11-06",
            message: "Can I borrow?",
            status: "pending",
            created_at: "2026-10-25T11:00:00Z",
            items: {
              id: "item-1",
              owner_id: "owner-1",
              name: "MacBook Pro M1",
              description: "Fast laptop",
              category: "Electronics",
              condition: "Great",
              image_url: "https://example.com/mac.jpg",
              availability_status: "available",
              available_from: "2026-10-25",
              available_until: "2026-11-30",
            },
            borrower: {
              id: "borrower-2",
              name: "Dev Sharma",
              hostel: "Cedar Hall",
              avatar_url: null,
              rating: 5.0,
            },
          },
        ],
        error: null,
      })

      const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
      const mockSupabase = { from: mockFrom } as any

      const res = await fetchIncomingBorrowRequests(mockSupabase, "owner-1")
      expect(res.error).toBeNull()
      expect(res.requests.length).toBe(1)
      expect(res.requests[0].id).toBe("req-2")
      expect(res.items.length).toBe(1)
      expect(res.borrowers.length).toBe(1)
      expect(res.borrowers[0].name).toBe("Dev Sharma")
    })
  })
})
