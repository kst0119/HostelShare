import { SupabaseClient } from "@supabase/supabase-js"
import { BorrowRequest, Item, RequestStatus, User } from "../store"
import { dbItemToItem, DbItemWithProfile, DbProfile, profileToUser } from "./itemService"

export type DbBorrowRequest = {
  id: string
  item_id: string
  borrower_id: string
  owner_id: string
  requested_from: string
  requested_until: string
  message: string
  status: RequestStatus
  created_at?: string
  updated_at?: string
  items?: (DbItemWithProfile & { profiles?: DbProfile | null }) | null
  borrower?: DbProfile | null
  owner?: DbProfile | null
}

export type BorrowRequestServiceResult<T = void> = {
  ok: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Converts a database row from public.borrow_requests to the application's BorrowRequest interface.
 */
export function dbBorrowRequestToBorrowRequest(row: DbBorrowRequest): BorrowRequest {
  return {
    id: row.id,
    itemId: row.item_id,
    borrowerId: row.borrower_id,
    ownerId: row.owner_id || "",
    requestedFrom: row.requested_from,
    requestedUntil: row.requested_until,
    message: row.message || "",
    status: row.status,
    createdAt: row.created_at || new Date().toISOString(),
  }
}

/**
 * Validates borrow request parameters prior to database submission.
 */
export function validateBorrowRequestInput(input: {
  itemId: string
  borrowerId?: string
  itemOwnerId?: string
  requestedFrom: string
  requestedUntil: string
  itemAvailableFrom?: string
  itemAvailableUntil?: string
  itemAvailabilityStatus?: string
}): { valid: boolean; error?: string } {
  if (!input.itemId) {
    return { valid: false, error: "Please select an item to borrow." }
  }

  if (!input.requestedFrom || !input.requestedUntil) {
    return { valid: false, error: "Both pick-up and return dates are required." }
  }

  if (input.requestedUntil < input.requestedFrom) {
    return { valid: false, error: "Return date must be on or after the pick-up date." }
  }

  if (input.borrowerId && input.itemOwnerId && input.borrowerId === input.itemOwnerId) {
    return { valid: false, error: "You cannot borrow your own item." }
  }

  if (input.itemAvailabilityStatus && input.itemAvailabilityStatus !== "available") {
    return {
      valid: false,
      error: `This item is currently ${input.itemAvailabilityStatus} and not open for new requests.`,
    }
  }

  if (input.itemAvailableFrom && input.requestedFrom < input.itemAvailableFrom) {
    return {
      valid: false,
      error: `Pick-up date cannot be earlier than item's available date (${input.itemAvailableFrom}).`,
    }
  }

  if (input.itemAvailableUntil && input.requestedUntil > input.itemAvailableUntil) {
    return {
      valid: false,
      error: `Return date cannot be later than item's return deadline (${input.itemAvailableUntil}).`,
    }
  }

  return { valid: true }
}

/**
 * Submits a new borrow request to Supabase.
 * Database triggers set borrower_id = auth.uid(), derive true owner_id, and enforce availability.
 */
export async function createSupabaseBorrowRequest(
  supabase: SupabaseClient,
  input: {
    itemId: string
    borrowerId?: string
    itemOwnerId?: string
    requestedFrom: string
    requestedUntil: string
    message: string
    itemAvailableFrom?: string
    itemAvailableUntil?: string
    itemAvailabilityStatus?: string
  },
): Promise<BorrowRequestServiceResult<BorrowRequest>> {
  const validation = validateBorrowRequestInput(input)
  if (!validation.valid) {
    return { ok: false, error: validation.error }
  }

  try {
    const { data, error } = await supabase
      .from("borrow_requests")
      .insert({
        item_id: input.itemId,
        requested_from: input.requestedFrom,
        requested_until: input.requestedUntil,
        message: input.message ? input.message.trim() : "",
      })
      .select(
        "id, item_id, borrower_id, owner_id, requested_from, requested_until, message, status, created_at, updated_at",
      )
      .single()

    if (error) {
      // Catch duplicate pending request constraint
      if (
        error.code === "23505" ||
        error.message?.includes("uq_borrow_requests_pending_per_user")
      ) {
        return {
          ok: false,
          error: "You already have a pending borrow request for this item. Please wait for the owner to reply.",
        }
      }

      // Catch self-borrow database rule
      if (
        error.message?.includes("Residents cannot borrow their own items") ||
        error.message?.includes("chk_borrow_request_no_self_borrow")
      ) {
        return {
          ok: false,
          error: "You cannot borrow your own item.",
        }
      }

      // Catch unavailable item error from trigger
      if (error.message?.includes("not available for new requests")) {
        return {
          ok: false,
          error: "This item is no longer available for borrowing.",
        }
      }

      // Catch date window errors from trigger
      if (error.message?.includes("must fall within item availability window")) {
        return {
          ok: false,
          error: "Requested dates must fall within the item's availability window.",
        }
      }

      return {
        ok: false,
        error: error.message || "Failed to submit borrow request.",
      }
    }

    const created = dbBorrowRequestToBorrowRequest(data as DbBorrowRequest)
    return {
      ok: true,
      data: created,
      message: "Borrow request submitted successfully.",
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to submit borrow request."
    return { ok: false, error: msg }
  }
}

/**
 * Fetches all borrow requests initiated by the current user (Borrower view / "My Requests").
 * Includes linked items and lender profiles.
 */
export async function fetchOutgoingBorrowRequests(
  supabase: SupabaseClient,
  borrowerId: string,
): Promise<{
  requests: BorrowRequest[]
  items: Item[]
  owners: User[]
  error: string | null
}> {
  try {
    const { data, error } = await supabase
      .from("borrow_requests")
      .select(
        "id, item_id, borrower_id, owner_id, requested_from, requested_until, message, status, created_at, updated_at, items(id, owner_id, name, description, category, condition, image_url, availability_status, available_from, available_until, profiles(id, name, hostel, avatar_url, bio, rating)), owner:owner_id(id, name, hostel, avatar_url, bio, rating)",
      )
      .eq("borrower_id", borrowerId)
      .order("created_at", { ascending: false })

    if (error) {
      // Fallback query if nested foreign key joins fail or schema cache differs
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("borrow_requests")
        .select("*")
        .eq("borrower_id", borrowerId)
        .order("created_at", { ascending: false })

      if (fallbackError) {
        return { requests: [], items: [], owners: [], error: fallbackError.message }
      }

      const requests = (fallbackData || []).map((row) =>
        dbBorrowRequestToBorrowRequest(row as DbBorrowRequest),
      )
      return { requests, items: [], owners: [], error: null }
    }

    const requests: BorrowRequest[] = []
    const itemsMap = new Map<string, Item>()
    const ownersMap = new Map<string, User>()

    for (const raw of data || []) {
      const row = raw as unknown as DbBorrowRequest
      requests.push(dbBorrowRequestToBorrowRequest(row))

      if (row.items) {
        const itemObj = dbItemToItem(row.items)
        itemsMap.set(itemObj.id, itemObj)

        if (row.items.profiles) {
          ownersMap.set(row.items.profiles.id, profileToUser(row.items.profiles))
        }
      }

      if (row.owner) {
        ownersMap.set(row.owner.id, profileToUser(row.owner))
      }
    }

    return {
      requests,
      items: Array.from(itemsMap.values()),
      owners: Array.from(ownersMap.values()),
      error: null,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load outgoing requests."
    return { requests: [], items: [], owners: [], error: msg }
  }
}

/**
 * Fetches all borrow requests received by the current user for their items (Owner view / "Incoming Requests").
 * Includes linked items and borrower profiles.
 */
export async function fetchIncomingBorrowRequests(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<{
  requests: BorrowRequest[]
  items: Item[]
  borrowers: User[]
  error: string | null
}> {
  try {
    const { data, error } = await supabase
      .from("borrow_requests")
      .select(
        "id, item_id, borrower_id, owner_id, requested_from, requested_until, message, status, created_at, updated_at, items(id, owner_id, name, description, category, condition, image_url, availability_status, available_from, available_until), borrower:borrower_id(id, name, hostel, avatar_url, bio, rating)",
      )
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })

    if (error) {
      // Fallback query if nested foreign key joins fail or schema cache differs
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("borrow_requests")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false })

      if (fallbackError) {
        return { requests: [], items: [], borrowers: [], error: fallbackError.message }
      }

      const requests = (fallbackData || []).map((row) =>
        dbBorrowRequestToBorrowRequest(row as DbBorrowRequest),
      )
      return { requests, items: [], borrowers: [], error: null }
    }

    const requests: BorrowRequest[] = []
    const itemsMap = new Map<string, Item>()
    const borrowersMap = new Map<string, User>()

    for (const raw of data || []) {
      const row = raw as unknown as DbBorrowRequest
      requests.push(dbBorrowRequestToBorrowRequest(row))

      if (row.items) {
        const itemObj = dbItemToItem(row.items)
        itemsMap.set(itemObj.id, itemObj)
      }

      if (row.borrower) {
        borrowersMap.set(row.borrower.id, profileToUser(row.borrower))
      }
    }

    return {
      requests,
      items: Array.from(itemsMap.values()),
      borrowers: Array.from(borrowersMap.values()),
      error: null,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load incoming requests."
    return { requests: [], items: [], borrowers: [], error: msg }
  }
}

/**
 * Decides a pending borrow request (approve or reject).
 * Executes atomic RPC decide_borrow_request to prevent concurrent approvals from reserving the same item.
 * Falls back to direct update if RPC has not yet been applied to the remote database.
 */
export async function decideSupabaseBorrowRequest(
  supabase: SupabaseClient,
  requestId: string,
  decision: "approved" | "rejected",
): Promise<
  BorrowRequestServiceResult<{
    requestId: string
    status: "approved" | "rejected"
    itemId?: string
    competingRejectedCount?: number
  }>
> {
  try {
    // 1. Try atomic database transaction RPC
    const { data, error } = await supabase.rpc("decide_borrow_request", {
      p_request_id: requestId,
      p_decision: decision,
    })

    if (!error) {
      const rpcResult = data as {
        success: boolean
        request_id: string
        status: "approved" | "rejected"
        item_id?: string
        competing_rejected_count?: number
      }
      return {
        ok: true,
        data: {
          requestId: rpcResult.request_id || requestId,
          status: decision,
          itemId: rpcResult.item_id,
          competingRejectedCount: rpcResult.competing_rejected_count || 0,
        },
        message:
          decision === "approved"
            ? "Request approved and item reserved!"
            : "Request declined.",
      }
    }

    // If error indicates the RPC function doesn't exist yet, fall back gracefully to direct table update
    if (
      error.code === "PGRST202" ||
      error.message?.includes("decide_borrow_request") ||
      error.message?.includes("Could not find the function")
    ) {
      // Step A: Update borrow request status
      const { data: updatedReq, error: reqError } = await supabase
        .from("borrow_requests")
        .update({ status: decision })
        .eq("id", requestId)
        .select("id, item_id, status")
        .single()

      if (reqError) {
        return { ok: false, error: reqError.message }
      }

      // Step B: If approved, transition item to reserved
      if (decision === "approved" && updatedReq?.item_id) {
        const { error: itemError } = await supabase
          .from("items")
          .update({ availability_status: "reserved" })
          .eq("id", updatedReq.item_id)

        if (itemError) {
          // Note: item error occurred, but request was approved
          console.warn("Item status update warning:", itemError.message)
        }

        // Step C: Try creating transaction record for the approved exchange if transactions table exists
        try {
          const { data: fullReq } = await supabase
            .from("borrow_requests")
            .select("borrower_id, owner_id, requested_until")
            .eq("id", requestId)
            .single()

          if (fullReq) {
            await supabase.from("transactions").insert({
              request_id: requestId,
              item_id: updatedReq.item_id,
              borrower_id: fullReq.borrower_id,
              owner_id: fullReq.owner_id,
              status: "approved",
              due_at: fullReq.requested_until,
            })
          }
        } catch {
          // graceful fallback if transactions table not yet created
        }
      }

      return {
        ok: true,
        data: {
          requestId,
          status: decision,
          itemId: updatedReq?.item_id,
          competingRejectedCount: 0,
        },
        message:
          decision === "approved"
            ? "Request approved and item reserved!"
            : "Request declined.",
      }
    }

    // Specific error mapping from RPC exceptions
    if (error.message?.includes("is no longer available")) {
      return {
        ok: false,
        error: "Item is no longer available. Another request may have been approved.",
      }
    }

    if (error.message?.includes("already been decided")) {
      return {
        ok: false,
        error: "This request has already been decided.",
      }
    }

    return {
      ok: false,
      error: error.message || `Failed to ${decision} borrow request.`,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : `Failed to ${decision} borrow request.`
    return { ok: false, error: msg }
  }
}

/**
 * Cancels a pending borrow request by the borrower.
 * Database RLS and triggers ensure only the borrower can cancel their own pending request.
 */
export async function cancelSupabaseBorrowRequest(
  supabase: SupabaseClient,
  requestId: string,
  borrowerId: string,
): Promise<BorrowRequestServiceResult<{ requestId: string }>> {
  try {
    const { data, error } = await supabase
      .from("borrow_requests")
      .update({ status: "cancelled" })
      .eq("id", requestId)
      .eq("borrower_id", borrowerId)
      .select("id, status")
      .single()

    if (error) {
      return {
        ok: false,
        error: error.message || "Failed to cancel borrow request.",
      }
    }

    return {
      ok: true,
      data: { requestId: data.id },
      message: "Borrow request cancelled.",
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to cancel borrow request."
    return { ok: false, error: msg }
  }
}
