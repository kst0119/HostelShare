import { SupabaseClient } from "@supabase/supabase-js"
import { Notice, Review, Transaction, TransactionStatus, User } from "../store"

export type DbTransaction = {
  id: string
  request_id: string
  item_id: string
  borrower_id: string
  owner_id: string
  status: TransactionStatus
  handover_at: string | null
  due_at: string
  returned_at: string | null
  created_at?: string
  updated_at?: string
}

export type DbReview = {
  id: string
  transaction_id: string
  reviewer_id: string
  recipient_id: string
  rating: number
  comment: string
  created_at: string
}

export type DbNotice = {
  id: string
  user_id: string
  text: string
  target: "activity" | "transaction" | "requirements" | "profile"
  transaction_id: string | null
  read: boolean
  created_at: string
}

export type ExchangeServiceResult<T = void> = {
  ok: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Converts a database transaction row to the application's Transaction interface.
 */
export function dbTransactionToTransaction(row: DbTransaction): Transaction {
  return {
    id: row.id,
    requestId: row.request_id,
    itemId: row.item_id,
    borrowerId: row.borrower_id,
    ownerId: row.owner_id,
    status: row.status,
    handoverAt: row.handover_at,
    dueAt: row.due_at,
    returnedAt: row.returned_at,
  }
}

/**
 * Converts a database review row to the application's Review interface.
 */
export function dbReviewToReview(row: DbReview): Review {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    reviewerId: row.reviewer_id,
    recipientId: row.recipient_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  }
}

/**
 * Converts a database notice row to the application's Notice interface.
 */
export function dbNoticeToNotice(row: DbNotice): Notice {
  return {
    id: row.id,
    userId: row.user_id,
    text: row.text,
    target: row.target,
    transactionId: row.transaction_id || undefined,
    read: row.read,
    createdAt: row.created_at,
  }
}

/**
 * Fetches all transactions for the authenticated user (borrower or lender).
 */
export async function fetchSupabaseTransactions(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ transactions: Transaction[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .or(`borrower_id.eq.${userId},owner_id.eq.${userId}`)
      .order("created_at", { ascending: false })

    if (error) {
      return { transactions: [], error: error.message }
    }

    const transactions = (data || []).map((row) =>
      dbTransactionToTransaction(row as DbTransaction),
    )
    return { transactions, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load transactions."
    return { transactions: [], error: msg }
  }
}

/**
 * Mutates transaction status (handover, initiate-return, confirm-return) atomically.
 */
export async function mutateSupabaseTransaction(
  supabase: SupabaseClient,
  transactionId: string,
  action: "handover" | "initiate-return" | "confirm-return",
  fallbackContext?: { itemId?: string; actorId?: string },
): Promise<
  ExchangeServiceResult<{
    status: TransactionStatus
    itemAvailability: "available" | "reserved" | "borrowed"
  }>
> {
  try {
    // 1. Try atomic database transaction RPC
    const { data, error } = await supabase.rpc("mutate_transaction", {
      p_transaction_id: transactionId,
      p_action: action,
    })

    if (!error) {
      const res = data as {
        success: boolean
        status: TransactionStatus
        item_availability: "available" | "reserved" | "borrowed"
      }
      return {
        ok: true,
        data: {
          status: res.status,
          itemAvailability: res.item_availability,
        },
        message:
          action === "handover"
            ? "Handover recorded. The item is now currently borrowed."
            : action === "initiate-return"
              ? "Return started. The other student can now confirm it."
              : "Return confirmed. The item is available again.",
      }
    }

    // 2. Fallback to direct table updates if RPC is not yet created in remote DB
    if (
      error.code === "PGRST202" ||
      error.message?.includes("mutate_transaction") ||
      error.message?.includes("Could not find the function")
    ) {
      const now = new Date().toISOString()
      const newStatus: TransactionStatus =
        action === "handover"
          ? "borrowed"
          : action === "initiate-return"
            ? "return_pending"
            : "returned"

      const updatePayload: Partial<DbTransaction> = {
        status: newStatus,
      }
      if (action === "handover") updatePayload.handover_at = now
      if (action === "confirm-return") updatePayload.returned_at = now

      const { data: updatedTx, error: txError } = await supabase
        .from("transactions")
        .update(updatePayload)
        .eq("id", transactionId)
        .select()
        .single()

      if (txError) {
        return { ok: false, error: txError.message }
      }

      const itemId = updatedTx?.item_id || fallbackContext?.itemId
      const newAvailability =
        action === "confirm-return" ? "available" : "borrowed"

      if (itemId && (action === "handover" || action === "confirm-return")) {
        await supabase
          .from("items")
          .update({ availability_status: newAvailability })
          .eq("id", itemId)
      }

      return {
        ok: true,
        data: {
          status: newStatus,
          itemAvailability: newAvailability,
        },
        message:
          action === "handover"
            ? "Handover recorded. The item is now currently borrowed."
            : action === "initiate-return"
              ? "Return started. The other student can now confirm it."
              : "Return confirmed. The item is available again.",
      }
    }

    return { ok: false, error: error.message }
  } catch (err) {
    const msg = err instanceof Error ? err.message : `Failed to record ${action}.`
    return { ok: false, error: msg }
  }
}

/**
 * Fetches all reviews across the campus community catalog.
 */
export async function fetchSupabaseReviews(
  supabase: SupabaseClient,
): Promise<{ reviews: Review[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return { reviews: [], error: error.message }
    }

    const reviews = (data || []).map((row) => dbReviewToReview(row as DbReview))
    return { reviews, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load reviews."
    return { reviews: [], error: msg }
  }
}

/**
 * Submits a new exchange review and recalculates the recipient's community trust score.
 */
export async function submitSupabaseReview(
  supabase: SupabaseClient,
  input: {
    transactionId: string
    reviewerId: string
    recipientId?: string
    rating: number
    comment: string
  },
): Promise<ExchangeServiceResult<{ reviewId: string; newRating?: number }>> {
  if (input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "Please select a rating between 1 and 5 stars." }
  }

  const trimmedComment = input.comment ? input.comment.trim() : ""
  if (trimmedComment.length < 5) {
    return { ok: false, error: "Please write a review comment (minimum 5 characters)." }
  }

  try {
    // 1. Try atomic RPC submit_review
    const { data, error } = await supabase.rpc("submit_review", {
      p_transaction_id: input.transactionId,
      p_rating: input.rating,
      p_comment: trimmedComment,
    })

    if (!error) {
      const res = data as { success: boolean; review_id: string; new_rating?: number }
      return {
        ok: true,
        data: { reviewId: res.review_id, newRating: res.new_rating },
        message: "Your review has been submitted.",
      }
    }

    // 2. Fallback to direct insert if RPC is not yet created
    if (
      error.code === "PGRST202" ||
      error.message?.includes("submit_review") ||
      error.message?.includes("Could not find the function")
    ) {
      if (!input.recipientId) {
        return { ok: false, error: "Recipient ID required for review submission." }
      }

      const { data: inserted, error: insertError } = await supabase
        .from("reviews")
        .insert({
          transaction_id: input.transactionId,
          reviewer_id: input.reviewerId,
          recipient_id: input.recipientId,
          rating: input.rating,
          comment: trimmedComment,
        })
        .select()
        .single()

      if (insertError) {
        if (
          insertError.code === "23505" ||
          insertError.message?.includes("uq_review_per_transaction_user")
        ) {
          return { ok: false, error: "You have already reviewed this exchange." }
        }
        return { ok: false, error: insertError.message }
      }

      return {
        ok: true,
        data: { reviewId: inserted.id },
        message: "Your review has been submitted.",
      }
    }

    if (error.message?.includes("uq_review_per_transaction_user")) {
      return { ok: false, error: "You have already reviewed this exchange." }
    }

    return { ok: false, error: error.message }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to submit review."
    return { ok: false, error: msg }
  }
}

/**
 * Fetches notices for the authenticated resident.
 */
export async function fetchSupabaseNotices(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ notices: Notice[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      return { notices: [], error: error.message }
    }

    const notices = (data || []).map((row) => dbNoticeToNotice(row as DbNotice))
    return { notices, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load notices."
    return { notices: [], error: msg }
  }
}

/**
 * Marks a notice as read in Supabase.
 */
export async function markSupabaseNoticeRead(
  supabase: SupabaseClient,
  noticeId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notices")
      .update({ read: true })
      .eq("id", noticeId)
    return !error
  } catch {
    return false
  }
}

/**
 * Updates a resident's public community profile and private contact details (room number).
 */
export async function updateSupabaseUserProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: {
    name: string
    hostel: string
    bio: string
    roomNumber?: string
    avatarUrl?: string
  },
): Promise<ExchangeServiceResult<Partial<User>>> {
  if (!updates.name || updates.name.trim().length < 2) {
    return { ok: false, error: "Name must be at least 2 characters." }
  }

  try {
    // 1. Update public profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        name: updates.name.trim(),
        hostel: updates.hostel.trim() || "Maple House",
        bio: updates.bio.trim() || "",
        avatar_url: updates.avatarUrl,
      })
      .eq("id", userId)

    if (profileError) {
      return { ok: false, error: profileError.message }
    }

    // 2. Update private room details if provided
    if (typeof updates.roomNumber === "string") {
      const trimmedRoom = updates.roomNumber.trim()
      await supabase
        .from("profile_private")
        .upsert({
          id: userId,
          room_number: trimmedRoom || null,
        })
    }

    return {
      ok: true,
      message: "Profile updated successfully.",
      data: {
        id: userId,
        name: updates.name.trim(),
        hostel: updates.hostel.trim() || "Maple House",
        roomNumber: updates.roomNumber || "—",
        bio: updates.bio.trim() || "",
      },
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update profile."
    return { ok: false, error: msg }
  }
}
