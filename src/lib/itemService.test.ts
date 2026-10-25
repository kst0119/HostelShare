import { describe, expect, it, vi } from "vitest"
import {
  createSupabaseItem,
  dbItemToItem,
  DbItemWithProfile,
  deleteSupabaseItem,
  fetchSupabaseItems,
  profileToUser,
  updateSupabaseItem,
} from "./itemService"

describe("Item Service", () => {
  const mockDbItem: DbItemWithProfile = {
    id: "item-123",
    owner_id: "user-456",
    name: "Scientific Calculator",
    description: "Casio FX-991EX in like new condition with box.",
    category: "Study",
    condition: "Like new",
    image_url: "https://example.com/calculator.jpg",
    availability_status: "available",
    available_from: "2026-10-25",
    available_until: "2026-11-25",
    created_at: "2026-10-25T10:00:00Z",
    profiles: {
      id: "user-456",
      name: "Rohan Verma",
      hostel: "Cedar Hall",
      avatar_url: null,
      bio: "Engineering sophomore",
      rating: 4.8,
    },
  }

  it("converts a database row into an application Item correctly", () => {
    const item = dbItemToItem(mockDbItem)
    expect(item.id).toBe("item-123")
    expect(item.ownerId).toBe("user-456")
    expect(item.name).toBe("Scientific Calculator")
    expect(item.description).toBe("Casio FX-991EX in like new condition with box.")
    expect(item.category).toBe("Study")
    expect(item.condition).toBe("Like new")
    expect(item.image).toBe("https://example.com/calculator.jpg")
    expect(item.availabilityStatus).toBe("available")
    expect(item.availableFrom).toBe("2026-10-25")
    expect(item.availableUntil).toBe("2026-11-25")
  })

  it("converts a profile into a User object with computed initials", () => {
    const user = profileToUser(mockDbItem.profiles!)
    expect(user.id).toBe("user-456")
    expect(user.name).toBe("Rohan Verma")
    expect(user.hostel).toBe("Cedar Hall")
    expect(user.avatar).toBe("RV")
    expect(user.rating).toBe(4.8)
    expect(user.roomNumber).toBe("—")
  })

  it("rejects item creation with invalid name or description", async () => {
    const mockSupabase = {} as any
    const shortNameResult = await createSupabaseItem(
      mockSupabase,
      {
        name: "A",
        description: "Valid description text here",
        category: "Study",
        condition: "Good",
        image: "https://example.com/img.jpg",
        ownerId: "user-1",
        availableFrom: "2026-10-25",
        availableUntil: "2026-10-30",
      },
      "user-1",
    )
    expect(shortNameResult.ok).toBe(false)
    expect(shortNameResult.error).toContain("at least 2 characters")

    const shortDescResult = await createSupabaseItem(
      mockSupabase,
      {
        name: "Valid Name",
        description: "Too short",
        category: "Study",
        condition: "Good",
        image: "https://example.com/img.jpg",
        ownerId: "user-1",
        availableFrom: "2026-10-25",
        availableUntil: "2026-10-30",
      },
      "user-1",
    )
    expect(shortDescResult.ok).toBe(false)
    expect(shortDescResult.error).toContain("at least 10 characters")
  })

  it("rejects item creation when end date precedes start date", async () => {
    const mockSupabase = {} as any
    const dateResult = await createSupabaseItem(
      mockSupabase,
      {
        name: "Valid Title",
        description: "Valid description text here",
        category: "Study",
        condition: "Good",
        image: "https://example.com/img.jpg",
        ownerId: "user-1",
        availableFrom: "2026-10-30",
        availableUntil: "2026-10-20",
      },
      "user-1",
    )
    expect(dateResult.ok).toBe(false)
    expect(dateResult.error).toContain("on or after")
  })

  it("fetches items from Supabase successfully", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockDbItem],
            error: null,
          }),
        }),
      }),
    } as any

    const result = await fetchSupabaseItems(mockSupabase)
    expect(result.error).toBeNull()
    expect(result.items.length).toBe(1)
    expect(result.items[0].name).toBe("Scientific Calculator")
    expect(result.users.length).toBe(1)
    expect(result.users[0].name).toBe("Rohan Verma")
  })

  it("creates an item via Supabase client successfully", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockDbItem,
              error: null,
            }),
          }),
        }),
      }),
    } as any

    const result = await createSupabaseItem(
      mockSupabase,
      {
        name: "Scientific Calculator",
        description: "Casio FX-991EX in like new condition with box.",
        category: "Study",
        condition: "Like new",
        image: "https://example.com/calculator.jpg",
        ownerId: "user-456",
        availableFrom: "2026-10-25",
        availableUntil: "2026-11-25",
      },
      "user-456",
    )

    expect(result.ok).toBe(true)
    expect(result.data?.id).toBe("item-123")
  })

  it("handles foreign key delete restriction error gracefully", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { code: "23503", message: "foreign key violation" },
          }),
        }),
      }),
    } as any

    const result = await deleteSupabaseItem(mockSupabase, "item-123")
    expect(result.ok).toBe(false)
    expect(result.error).toContain("associated borrow requests")
  })

  it("updates an item via Supabase client successfully", async () => {
    const updatedMock = {
      ...mockDbItem,
      name: "Updated Calculator Title",
      condition: "Great",
    }

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedMock,
                error: null,
              }),
            }),
          }),
        }),
      }),
    } as any

    const result = await updateSupabaseItem(mockSupabase, "item-123", {
      name: "Updated Calculator Title",
      condition: "Great",
    })

    expect(result.ok).toBe(true)
    expect(result.data?.name).toBe("Updated Calculator Title")
    expect(result.data?.condition).toBe("Great")
  })
})
