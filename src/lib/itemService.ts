import { SupabaseClient } from "@supabase/supabase-js"
import { AvailabilityStatus, Category, Item, User } from "../store"

export type DbItem = {
  id: string
  owner_id: string
  name: string
  description: string
  category: Category
  condition: string
  image_url: string
  availability_status: AvailabilityStatus
  available_from: string
  available_until: string
  created_at?: string
  updated_at?: string
}

export type DbProfile = {
  id: string
  name: string
  hostel?: string
  avatar_url?: string | null
  bio?: string
  rating?: number
}

export type DbItemWithProfile = DbItem & {
  profiles?: DbProfile | null
}

export type ItemServiceResult<T = void> = {
  ok: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Converts a database row from public.items to the application's Item interface.
 */
export function dbItemToItem(row: DbItem): Item {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    condition: row.condition,
    image: row.image_url,
    ownerId: row.owner_id,
    availabilityStatus: row.availability_status,
    availableFrom: row.available_from,
    availableUntil: row.available_until,
  }
}

/**
 * Converts a database profile row into a User object for community views.
 */
export function profileToUser(profile: DbProfile): User {
  const initials = profile.name
    ? profile.name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "HR"

  return {
    id: profile.id,
    name: profile.name || "Student Resident",
    hostel: profile.hostel || "Maple House",
    roomNumber: "—", // Room numbers are protected in profile_private table
    avatar: profile.avatar_url || initials,
    rating: typeof profile.rating === "number" ? profile.rating : 5.0,
    bio: profile.bio || "",
  }
}

/**
 * Fetches all available community items from public.items for authenticated users.
 * Joins owner profile metadata (name, hostel, avatar, rating).
 */
export async function fetchSupabaseItems(
  supabase: SupabaseClient,
): Promise<{ items: Item[]; users: User[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("items")
      .select(
        "id, owner_id, name, description, category, condition, image_url, availability_status, available_from, available_until, created_at, updated_at, profiles(id, name, hostel, avatar_url, bio, rating)",
      )
      .order("created_at", { ascending: false })

    if (error) {
      return { items: [], users: [], error: error.message }
    }

    if (!data) {
      return { items: [], users: [], error: null }
    }

    const items: Item[] = []
    const usersMap = new Map<string, User>()

    for (const raw of data) {
      const itemRow = raw as unknown as DbItemWithProfile
      items.push(dbItemToItem(itemRow))

      if (itemRow.profiles && !usersMap.has(itemRow.profiles.id)) {
        usersMap.set(itemRow.profiles.id, profileToUser(itemRow.profiles))
      }
    }

    return {
      items,
      users: Array.from(usersMap.values()),
      error: null,
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load listings from database."
    return { items: [], users: [], error: message }
  }
}

/**
 * Creates a new item in public.items using the authenticated user's session.
 * Database RLS and triggers enforce that auth.uid() matches owner_id.
 */
export async function createSupabaseItem(
  supabase: SupabaseClient,
  item: Omit<Item, "id" | "availabilityStatus">,
  ownerId: string,
): Promise<ItemServiceResult<Item>> {
  if (!item.name || item.name.trim().length < 2) {
    return {
      ok: false,
      error: "Item title must be at least 2 characters.",
    }
  }

  if (!item.description || item.description.trim().length < 10) {
    return {
      ok: false,
      error: "Item description must be at least 10 characters.",
    }
  }

  if (!item.image) {
    return {
      ok: false,
      error: "A photo is required to publish a listing.",
    }
  }

  if (!item.availableFrom || !item.availableUntil) {
    return {
      ok: false,
      error: "Both available from and return dates are required.",
    }
  }

  if (item.availableFrom > item.availableUntil) {
    return {
      ok: false,
      error: "Available until date must be on or after the available from date.",
    }
  }

  try {
    const { data, error } = await supabase
      .from("items")
      .insert({
        owner_id: ownerId,
        name: item.name.trim(),
        description: item.description.trim(),
        category: item.category,
        condition: item.condition,
        image_url: item.image,
        availability_status: "available",
        available_from: item.availableFrom,
        available_until: item.availableUntil,
      })
      .select(
        "id, owner_id, name, description, category, condition, image_url, availability_status, available_from, available_until, created_at, updated_at, profiles(id, name, hostel, avatar_url, bio, rating)",
      )
      .single()

    if (error) {
      return { ok: false, error: error.message }
    }

    const created = dbItemToItem(data as unknown as DbItem)
    return {
      ok: true,
      data: created,
      message: `${created.name} is now listed.`,
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create item in database."
    return { ok: false, error: message }
  }
}

/**
 * Updates an existing item listing in public.items.
 * Database RLS enforces: USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id).
 */
export async function updateSupabaseItem(
  supabase: SupabaseClient,
  itemId: string,
  updates: Partial<Omit<Item, "id" | "ownerId">>,
): Promise<ItemServiceResult<Item>> {
  if (updates.name !== undefined && updates.name.trim().length < 2) {
    return {
      ok: false,
      error: "Item title must be at least 2 characters.",
    }
  }

  if (
    updates.description !== undefined &&
    updates.description.trim().length < 10
  ) {
    return {
      ok: false,
      error: "Item description must be at least 10 characters.",
    }
  }

  if (
    updates.availableFrom &&
    updates.availableUntil &&
    updates.availableFrom > updates.availableUntil
  ) {
    return {
      ok: false,
      error: "Available until date must be on or after the available from date.",
    }
  }

  const payload: Record<string, unknown> = {}
  if (updates.name !== undefined) payload.name = updates.name.trim()
  if (updates.description !== undefined)
    payload.description = updates.description.trim()
  if (updates.category !== undefined) payload.category = updates.category
  if (updates.condition !== undefined) payload.condition = updates.condition
  if (updates.image !== undefined) payload.image_url = updates.image
  if (updates.availabilityStatus !== undefined)
    payload.availability_status = updates.availabilityStatus
  if (updates.availableFrom !== undefined)
    payload.available_from = updates.availableFrom
  if (updates.availableUntil !== undefined)
    payload.available_until = updates.availableUntil

  try {
    const { data, error } = await supabase
      .from("items")
      .update(payload)
      .eq("id", itemId)
      .select(
        "id, owner_id, name, description, category, condition, image_url, availability_status, available_from, available_until, created_at, updated_at, profiles(id, name, hostel, avatar_url, bio, rating)",
      )
      .single()

    if (error) {
      return { ok: false, error: error.message }
    }

    const updated = dbItemToItem(data as unknown as DbItem)
    return {
      ok: true,
      data: updated,
      message: `${updated.name} updated successfully.`,
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update item in database."
    return { ok: false, error: message }
  }
}

/**
 * Deletes an item from public.items.
 * Database RLS enforces: USING (auth.uid() = owner_id).
 * Foreign key constraints (ON DELETE RESTRICT) prevent deletion if borrow history exists.
 */
export async function deleteSupabaseItem(
  supabase: SupabaseClient,
  itemId: string,
): Promise<ItemServiceResult> {
  try {
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", itemId)

    if (error) {
      if (error.code === "23503") {
        return {
          ok: false,
          error:
            "Cannot delete listing: this item has associated borrow requests or loan records.",
        }
      }
      return { ok: false, error: error.message }
    }

    return {
      ok: true,
      message: "Listing removed successfully.",
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete item from database."
    return { ok: false, error: message }
  }
}
