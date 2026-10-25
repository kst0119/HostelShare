-- ==============================================================================
-- HostelShare — Phase 4C.1A: Database Foundation Migration
-- ==============================================================================
-- Version: 20261025000000
-- Purpose: Minimal relational schema foundation for profiles, profile_private,
--          items, and borrow_requests.
-- Security Model:
--   - Row Level Security (RLS) enabled on all tables.
--   - Default authenticated-only access (no anonymous data exposure).
--   - Two-tier profile privacy separating public student directory from room numbers.
--   - Non-recursive RLS policy on profile_private using SECURITY DEFINER helper.
--   - SECURITY DEFINER functions with empty search_path (SET search_path = '') and
--     fully schema-qualified object references.
--   - Standard SQL COALESCE / NULLIF expressions (no invalid schema qualification).
--   - Non-executable trigger functions (revoked from PUBLIC, anon, authenticated).
--   - Anti-spoofing ownership derivation on items and borrow requests.
--   - Null-safe database-layer status transition enforcement and rating protection.
--   - Conservative foreign key constraints (ON DELETE RESTRICT) preventing
--     erasure of borrowing history.
-- Note: This migration is designed for review and version-control.
--       DO NOT apply automatically to production without administrative review.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Public Campus Directory — Linked 1-to-1 with auth.users)
-- ------------------------------------------------------------------------------
-- Exposes safe community identity fields: name, hostel building, avatar, bio,
-- and community rating. Does NOT contain sensitive room numbers.

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (pg_catalog.length(trim(name)) >= 2),
  hostel text NOT NULL DEFAULT 'Maple House',
  avatar_url text,
  bio text NOT NULL DEFAULT '',
  rating numeric(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating >= 1.00 AND rating <= 5.00),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

COMMENT ON TABLE public.profiles IS 'Campus resident directory linked directly to authenticated Supabase accounts.';
COMMENT ON COLUMN public.profiles.rating IS 'Community trust rating. Protected from direct client modification via trigger.';
COMMENT ON COLUMN public.profiles.hostel IS 'Hostel building name (e.g. Maple House, Cedar Hall).';

-- ------------------------------------------------------------------------------
-- 2. PROFILE_PRIVATE TABLE (Restricted Resident Contact & Location Data)
-- ------------------------------------------------------------------------------
-- Solves Profile Privacy: Room numbers are private personal location data.
-- Kept in a dedicated 1-to-1 table readable only by the resident themselves or
-- by a peer with whom they have an approved borrow request for handover.
-- Starts NULL on signup; no fabricated default room number.

CREATE TABLE IF NOT EXISTS public.profile_private (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_number text NULL CHECK (room_number IS NULL OR pg_catalog.length(trim(room_number)) >= 1),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

COMMENT ON TABLE public.profile_private IS 'Sensitive resident details (room number) with restricted RLS access.';
COMMENT ON COLUMN public.profile_private.room_number IS 'Specific hostel room number. Starts NULL; accessible only to owner or approved exchange counterparty.';

-- ------------------------------------------------------------------------------
-- 3. ITEMS TABLE (Owned by a resident profile)
-- ------------------------------------------------------------------------------
-- Catalog of shared resources. Authenticated-only access by default.

CREATE TABLE IF NOT EXISTS public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (pg_catalog.length(trim(name)) >= 2),
  description text NOT NULL CHECK (pg_catalog.length(trim(description)) >= 10),
  category text NOT NULL CHECK (category IN ('Study', 'Electronics', 'Everyday', 'Sports', 'Other')),
  condition text NOT NULL CHECK (condition IN ('Like new', 'Great', 'Good', 'Loved')),
  image_url text NOT NULL,
  availability_status text NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'reserved', 'borrowed')),
  available_from date NOT NULL DEFAULT CURRENT_DATE,
  available_until date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT chk_item_availability_dates CHECK (available_until >= available_from)
);

COMMENT ON TABLE public.items IS 'Community items shared and offered by hostel residents.';
COMMENT ON COLUMN public.items.condition IS 'Item condition matching UI options: Like new, Great, Good, Loved.';
COMMENT ON COLUMN public.items.owner_id IS 'Owner profile ID. ON DELETE RESTRICT protects active catalog items from accidental cascade.';
COMMENT ON COLUMN public.items.availability_status IS 'Listing availability state. Note: Automated atomic transition to reserved upon request approval requires the Phase 4C.2 transaction workflow; direct updates by the owner are guarded by trg_set_item_owner to prevent ownership manipulation.';

-- ------------------------------------------------------------------------------
-- 4. BORROW_REQUESTS TABLE (Peer borrowing interactions)
-- ------------------------------------------------------------------------------
-- Conservative Foreign Keys: Uses ON DELETE RESTRICT on item_id, borrower_id,
-- and owner_id so that historical borrow records, handover trails, and trust
-- score audit logs cannot be silently wiped by deleting an item or user account.

CREATE TABLE IF NOT EXISTS public.borrow_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  borrower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  requested_from date NOT NULL,
  requested_until date NOT NULL,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT chk_borrow_request_dates CHECK (requested_until >= requested_from),
  CONSTRAINT chk_borrow_request_no_self_borrow CHECK (borrower_id != owner_id)
);

COMMENT ON TABLE public.borrow_requests IS 'Peer-to-peer borrowing requests between students.';
COMMENT ON COLUMN public.borrow_requests.owner_id IS 'Derived from items.owner_id by database trigger on insert; immutable.';

-- ------------------------------------------------------------------------------
-- 5. PERFORMANCE & CONCURRENCY INDEXES
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_items_owner_id ON public.items(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_availability ON public.items(availability_status);

CREATE INDEX IF NOT EXISTS idx_borrow_requests_item_id ON public.borrow_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_borrower_id ON public.borrow_requests(borrower_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_owner_id ON public.borrow_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_status ON public.borrow_requests(status);

-- Prevent a single borrower from creating multiple concurrent pending requests for the same item.
-- Note on Concurrent Approval Safety:
-- This unique index prevents duplicate spam from ONE borrower. It does NOT prevent multiple
-- DIFFERENT borrowers from requesting the same item. Preventing two concurrent approvals
-- for the same item must be implemented in Phase 4C.2 with an atomic transaction that locks
-- the item (e.g. SELECT FOR UPDATE) and flips availability_status to 'reserved'.
CREATE UNIQUE INDEX IF NOT EXISTS uq_borrow_requests_pending_per_user
ON public.borrow_requests(item_id, borrower_id)
WHERE status = 'pending';

-- ------------------------------------------------------------------------------
-- 6. AUTOMATED PROFILE PROVISIONING TRIGGER (auth.users -> profiles + profile_private)
-- ------------------------------------------------------------------------------
-- Runs with SECURITY DEFINER and SET search_path = '' to completely eliminate
-- search-path hijacking attacks. Uses standard SQL NULLIF and COALESCE.
-- Uses 'full_name' matching AuthContext.tsx registration payload.
-- Initializes room_number to NULL (no fabricated default).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_full_name text;
  v_avatar_url text;
BEGIN
  v_full_name := NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), '');
  v_avatar_url := NULLIF(trim(NEW.raw_user_meta_data->>'avatar_url'), '');

  -- 1. Create public profile
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(v_full_name, 'Student Resident'),
    v_avatar_url
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create corresponding private details row without fabricated room number
  INSERT INTO public.profile_private (id, room_number)
  VALUES (
    NEW.id,
    NULL
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Provisions public profile and private details row when a user registers.';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 7. PROFILE RATING & ID PROTECTION TRIGGER
-- ------------------------------------------------------------------------------
-- Guarantees that clients cannot self-assign or inflate community trust ratings,
-- and cannot reassign profile primary keys.

CREATE OR REPLACE FUNCTION public.protect_profile_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.rating IS DISTINCT FROM OLD.rating THEN
    RAISE EXCEPTION 'Residents cannot directly modify community trust ratings.';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Profile ID is immutable.';
  END IF;

  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_profile_rating() IS 'Blocks direct client updates to community rating and primary key.';

DROP TRIGGER IF EXISTS trg_protect_profile_rating ON public.profiles;
CREATE TRIGGER trg_protect_profile_rating
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_rating();

-- ------------------------------------------------------------------------------
-- 8. ITEM LISTING OWNERSHIP & IMMUTABILITY TRIGGER
-- ------------------------------------------------------------------------------
-- Guarantees at the database layer that owner_id cannot be spoofed on listing creation,
-- and that listing ownership and primary key cannot be transferred on update.

CREATE OR REPLACE FUNCTION public.set_item_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.owner_id := auth.uid();
    IF NEW.owner_id IS NULL THEN
      RAISE EXCEPTION 'Authentication required to list an item.';
    END IF;
    NEW.created_at := pg_catalog.now();
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
      RAISE EXCEPTION 'Item listing ownership cannot be transferred.';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Item ID is immutable.';
    END IF;
  END IF;

  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_item_owner() IS 'Enforces authentic owner_id on item creation and blocks ownership reassignment.';

DROP TRIGGER IF EXISTS trg_set_item_owner ON public.items;
CREATE TRIGGER trg_set_item_owner
BEFORE INSERT OR UPDATE ON public.items
FOR EACH ROW EXECUTE FUNCTION public.set_item_owner();

-- ------------------------------------------------------------------------------
-- 9. BORROW REQUEST OWNERSHIP & VALIDATION TRIGGER (Anti-Spoofing Guard)
-- ------------------------------------------------------------------------------
-- Ensures owner_id is never trusted from client-supplied request payloads.
-- Forces borrower_id = auth.uid(), checks item availability window, and
-- blocks self-borrowing.

CREATE OR REPLACE FUNCTION public.set_borrow_request_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item_owner_id uuid;
  v_item_status text;
  v_available_from date;
  v_available_until date;
BEGIN
  -- 1. Enforce borrower_id matches the authenticated user caller
  NEW.borrower_id := auth.uid();
  IF NEW.borrower_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to submit a borrow request.';
  END IF;

  -- 2. Query referenced item to obtain true owner and availability state
  SELECT owner_id, availability_status, available_from, available_until
  INTO v_item_owner_id, v_item_status, v_available_from, v_available_until
  FROM public.items
  WHERE id = NEW.item_id;

  IF v_item_owner_id IS NULL THEN
    RAISE EXCEPTION 'Referenced item % does not exist.', NEW.item_id;
  END IF;

  -- 3. Verify item is currently available
  IF v_item_status != 'available' THEN
    RAISE EXCEPTION 'Item is currently % and not available for new requests.', v_item_status;
  END IF;

  -- 4. Verify requested dates fall within item availability window
  IF NEW.requested_from < v_available_from OR NEW.requested_until > v_available_until THEN
    RAISE EXCEPTION 'Requested dates (% to %) must fall within item availability window (% to %).',
      NEW.requested_from, NEW.requested_until, v_available_from, v_available_until;
  END IF;

  -- 5. Anti-spoofing override: Assign true owner
  NEW.owner_id := v_item_owner_id;

  -- 6. Enforce self-borrowing prevention
  IF NEW.borrower_id = NEW.owner_id THEN
    RAISE EXCEPTION 'Residents cannot borrow their own items.';
  END IF;

  -- 7. Force initial status to pending on insert
  NEW.status := 'pending';
  NEW.created_at := pg_catalog.now();
  NEW.updated_at := pg_catalog.now();

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_borrow_request_owner() IS 'Derives true owner_id from items table and validates availability on insert.';

DROP TRIGGER IF EXISTS trg_set_borrow_request_owner ON public.borrow_requests;
CREATE TRIGGER trg_set_borrow_request_owner
BEFORE INSERT ON public.borrow_requests
FOR EACH ROW EXECUTE FUNCTION public.set_borrow_request_owner();

-- ------------------------------------------------------------------------------
-- 10. BORROW REQUEST TRANSITION ENFORCEMENT TRIGGER
-- ------------------------------------------------------------------------------
-- Enforces strict database-layer validation of allowable state transitions:
-- - Uses null-safe IS DISTINCT FROM comparisons for all immutable checks
-- - Core fields (id, item, borrower, owner, dates, message, created_at) are immutable
-- - Borrower can ONLY transition from pending -> cancelled
-- - Owner can ONLY transition from pending -> approved or rejected
-- - Neither party can approve their own request

CREATE OR REPLACE FUNCTION public.enforce_borrow_request_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  -- 1. Ensure caller is authenticated
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required to update a borrow request.';
  END IF;

  -- 2. Caller authorization: strictly reject any caller who is neither the borrower nor the owner
  IF v_caller IS DISTINCT FROM OLD.borrower_id AND v_caller IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'Caller is not authorized to update this borrow request.';
  END IF;

  -- 3. Decided requests are permanently immutable; reject all updates once decided
  IF OLD.status != 'pending' THEN
    RAISE EXCEPTION 'Decided requests (status: %) cannot be modified.', OLD.status;
  END IF;

  -- 4. Null-safe immutability check: core request attributes can never be altered
  IF NEW.id IS DISTINCT FROM OLD.id OR
     NEW.item_id IS DISTINCT FROM OLD.item_id OR
     NEW.borrower_id IS DISTINCT FROM OLD.borrower_id OR
     NEW.owner_id IS DISTINCT FROM OLD.owner_id OR
     NEW.requested_from IS DISTINCT FROM OLD.requested_from OR
     NEW.requested_until IS DISTINCT FROM OLD.requested_until OR
     NEW.message IS DISTINCT FROM OLD.message OR
     NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Core request attributes (id, item, borrower, owner, dates, message, created_at) are immutable.';
  END IF;

  -- 5. Status transition validation
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF v_caller = OLD.borrower_id THEN
      IF NEW.status != 'cancelled' THEN
        RAISE EXCEPTION 'Borrowers may only transition pending requests to cancelled.';
      END IF;
    ELSIF v_caller = OLD.owner_id THEN
      IF NEW.status NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Owners may only transition pending requests to approved or rejected.';
      END IF;
    END IF;
  END IF;

  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_borrow_request_transition() IS 'Guarantees legal status transitions (borrower cancels, owner approves/rejects).';

DROP TRIGGER IF EXISTS trg_enforce_borrow_request_transition ON public.borrow_requests;
CREATE TRIGGER trg_enforce_borrow_request_transition
BEFORE UPDATE ON public.borrow_requests
FOR EACH ROW EXECUTE FUNCTION public.enforce_borrow_request_transition();

-- ------------------------------------------------------------------------------
-- 11. PROFILE PRIVACY ACCESS HELPER FUNCTION
-- ------------------------------------------------------------------------------
-- Security Definer helper to check if current user can view a resident's private room details.
-- Avoids recursive RLS evaluation or subquery permission blocks on borrow_requests table.

CREATE OR REPLACE FUNCTION public.can_view_profile_private(target_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer uuid := auth.uid();
BEGIN
  IF v_viewer IS NULL THEN
    RETURN false;
  END IF;

  -- Resident can always view their own private details
  IF v_viewer = target_profile_id THEN
    RETURN true;
  END IF;

  -- Verify an approved borrow request connects the viewer and target resident
  RETURN EXISTS (
    SELECT 1
    FROM public.borrow_requests
    WHERE status = 'approved'
      AND (
        (borrower_id = v_viewer AND owner_id = target_profile_id)
        OR (owner_id = v_viewer AND borrower_id = target_profile_id)
      )
  );
END;
$$;

COMMENT ON FUNCTION public.can_view_profile_private(uuid) IS 'Safely verifies if caller is the profile owner or an approved exchange peer, avoiding RLS recursion.';

-- ------------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_requests ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- 12A. PROFILES RLS POLICIES (Public Directory)
-- Rule: Authenticated campus residents can view public profiles.
-- Anonymous visitors cannot view student profiles.
-- ----------------------------------------------------

CREATE POLICY "Profiles readable by authenticated residents"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Residents can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------
-- 12B. PROFILE_PRIVATE RLS POLICIES (Room Numbers & Private Data)
-- Rule: Uses can_view_profile_private helper to avoid recursive RLS.
-- Accessible only by self or active exchange counterpart with approved request.
-- ----------------------------------------------------

CREATE POLICY "Private details readable by self or active exchange partner"
ON public.profile_private
FOR SELECT
TO authenticated
USING (public.can_view_profile_private(id));

CREATE POLICY "Residents can update own private details"
ON public.profile_private
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------
-- 12C. ITEMS RLS POLICIES (Catalog)
-- Rule: Authenticated-only access by default. Anonymous access is denied.
-- Mutations strictly require verified ownership.
-- ----------------------------------------------------

CREATE POLICY "Items readable by authenticated residents"
ON public.items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Residents can create own item listings"
ON public.items
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Residents can update own item listings"
ON public.items
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Residents can delete own item listings"
ON public.items
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- ----------------------------------------------------
-- 12D. BORROW_REQUESTS RLS POLICIES (Peer Interactions)
-- Confidentiality Rule: Only the borrower and the owner can see the request.
-- ----------------------------------------------------

CREATE POLICY "Borrow requests readable by borrower or owner"
ON public.borrow_requests
FOR SELECT
TO authenticated
USING (auth.uid() = borrower_id OR auth.uid() = owner_id);

CREATE POLICY "Borrowers can create borrow requests"
ON public.borrow_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = borrower_id AND borrower_id != owner_id);

CREATE POLICY "Borrowers can cancel own pending requests"
ON public.borrow_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = borrower_id AND status = 'pending')
WITH CHECK (auth.uid() = borrower_id AND status = 'cancelled');

CREATE POLICY "Owners can decide pending requests"
ON public.borrow_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id AND status = 'pending')
WITH CHECK (auth.uid() = owner_id AND status IN ('approved', 'rejected'));

-- ------------------------------------------------------------------------------
-- 13. LEAST-PRIVILEGE PERMISSION GRANTS
-- ------------------------------------------------------------------------------

-- Trigger functions are invoked by PostgreSQL's internal trigger system on table events.
-- They must NEVER be callable directly by clients via RPC.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_rating() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_item_owner() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_borrow_request_owner() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_borrow_request_transition() FROM PUBLIC, anon, authenticated;

-- Grant execution on helper function to authenticated users only
REVOKE ALL ON FUNCTION public.can_view_profile_private(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_profile_private(uuid) TO authenticated;

-- Minimal DML grants for application roles:
-- 'anon' has zero permissions on any table.
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.profile_private TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.borrow_requests TO authenticated;

-- ==============================================================================
-- End of Migration: 20261025000000_phase4c1_foundation.sql
-- ==============================================================================
