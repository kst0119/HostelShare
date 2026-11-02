-- ==============================================================================
-- HostelShare — Phase 4D: Borrowing Lifecycle, Reviews, Trust Scores, & Notices
-- ==============================================================================
-- Migration Version: 20261025000002
-- Purpose:
--   1. Create transactions table for tracking active loan lifecycle:
--      (approved -> borrowed -> return_pending -> returned).
--   2. Atomic mutate_transaction stored procedure enforcing safe handover/return transitions
--      and keeping item availability status strictly synchronized.
--   3. Create reviews table for campus feedback, trust scores, and testimonials.
--   4. Update protect_profile_rating() to allow system recalculation of ratings
--      from real reviews while preventing residents from forging or modifying their scores.
--   5. Create submit_review stored procedure for submitting ratings and recalculating trust scores.
--   6. Create notices table for in-app user notifications with RLS protection.
--   7. Update can_view_profile_private() to cover active transactions.
--   8. Update decide_borrow_request() to automatically spawn transaction & notices on approval.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. TRANSACTIONS TABLE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.borrow_requests(id) ON DELETE RESTRICT,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  borrower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'borrowed', 'return_pending', 'returned')),
  handover_at timestamptz NULL,
  due_at date NOT NULL,
  returned_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_transactions_request_id UNIQUE (request_id),
  CONSTRAINT chk_transaction_different_parties CHECK (borrower_id != owner_id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_borrower_id ON public.transactions(borrower_id);
CREATE INDEX IF NOT EXISTS idx_transactions_owner_id ON public.transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_item_id ON public.transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- ------------------------------------------------------------------------------
-- 2. REVIEWS TABLE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE RESTRICT,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL CHECK (pg_catalog.length(trim(comment)) >= 5 AND pg_catalog.length(comment) <= 500),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_review_per_transaction_user UNIQUE (transaction_id, reviewer_id),
  CONSTRAINT chk_review_no_self_review CHECK (reviewer_id != recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_recipient_id ON public.reviews(recipient_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_transaction_id ON public.reviews(transaction_id);

-- ------------------------------------------------------------------------------
-- 3. NOTICES TABLE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (pg_catalog.length(trim(text)) >= 2),
  target text NOT NULL DEFAULT 'activity' CHECK (target IN ('activity', 'transaction', 'requirements', 'profile')),
  transaction_id uuid NULL REFERENCES public.transactions(id) ON DELETE SET NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

CREATE INDEX IF NOT EXISTS idx_notices_user_id ON public.notices(user_id);
CREATE INDEX IF NOT EXISTS idx_notices_read ON public.notices(read);

-- ------------------------------------------------------------------------------
-- 4. PROFILE RATING PROTECTION UPDATE
-- ------------------------------------------------------------------------------
-- Allows trusted system rating recalculation while strictly forbidding direct resident updates.

CREATE OR REPLACE FUNCTION public.protect_profile_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.rating IS DISTINCT FROM OLD.rating THEN
    IF pg_catalog.current_setting('app.calculating_rating', true) IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'Residents cannot directly modify community trust ratings.';
    END IF;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Profile ID is immutable.';
  END IF;

  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. PROFILE PRIVACY ACCESS HELPER (Expanded for Transactions)
-- ------------------------------------------------------------------------------

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
  IF EXISTS (
    SELECT 1
    FROM public.borrow_requests
    WHERE status = 'approved'
      AND (
        (borrower_id = v_viewer AND owner_id = target_profile_id)
        OR (owner_id = v_viewer AND borrower_id = target_profile_id)
      )
  ) THEN
    RETURN true;
  END IF;

  -- Or an active/completed transaction connects the viewer and target resident
  RETURN EXISTS (
    SELECT 1
    FROM public.transactions
    WHERE status IN ('approved', 'borrowed', 'return_pending', 'returned')
      AND (
        (borrower_id = v_viewer AND owner_id = target_profile_id)
        OR (owner_id = v_viewer AND borrower_id = target_profile_id)
      )
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. ATOMIC DECIDE BORROW REQUEST (With Transaction Creation)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.decide_borrow_request(
  p_request_id uuid,
  p_decision text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_req public.borrow_requests%ROWTYPE;
  v_item public.items%ROWTYPE;
  v_competing_rejected integer := 0;
  v_tx_id uuid;
BEGIN
  -- 1. Caller authentication check
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required to decide borrow requests.';
  END IF;

  -- 2. Validate decision argument
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid decision: % (must be "approved" or "rejected").', p_decision;
  END IF;

  -- 3. Lock and retrieve the target borrow request
  SELECT *
  INTO v_req
  FROM public.borrow_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Borrow request % does not exist.', p_request_id;
  END IF;

  -- 4. Verify caller is the authentic owner
  IF v_req.owner_id IS DISTINCT FROM v_caller THEN
    RAISE EXCEPTION 'Only the item owner may approve or reject this request.';
  END IF;

  -- 5. Verify the request is still pending
  IF v_req.status != 'pending' THEN
    RAISE EXCEPTION 'Request has already been decided (current status: %).', v_req.status;
  END IF;

  -- 6. Handling REJECT decision
  IF p_decision = 'rejected' THEN
    UPDATE public.borrow_requests
    SET status = 'rejected',
        updated_at = pg_catalog.now()
    WHERE id = p_request_id;

    -- Create notice for borrower
    INSERT INTO public.notices (user_id, text, target)
    VALUES (v_req.borrower_id, 'Your borrow request was declined.', 'activity');

    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'request_id', p_request_id,
      'status', 'rejected',
      'item_id', v_req.item_id,
      'competing_rejected_count', 0
    );
  END IF;

  -- 7. Handling APPROVE decision with atomic item locking
  SELECT *
  INTO v_item
  FROM public.items
  WHERE id = v_req.item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referenced item % does not exist.', v_req.item_id;
  END IF;

  -- Check item availability under lock
  IF v_item.availability_status != 'available' THEN
    RAISE EXCEPTION 'Item is no longer available (currently %). Another request may have been approved.', v_item.availability_status;
  END IF;

  -- 8. Mark item as reserved
  UPDATE public.items
  SET availability_status = 'reserved',
      updated_at = pg_catalog.now()
  WHERE id = v_item.id;

  -- 9. Mark target request as approved
  UPDATE public.borrow_requests
  SET status = 'approved',
      updated_at = pg_catalog.now()
  WHERE id = p_request_id;

  -- 10. Automatically provision transaction for the exchange lifecycle
  INSERT INTO public.transactions (
    request_id,
    item_id,
    borrower_id,
    owner_id,
    due_at,
    status
  )
  VALUES (
    p_request_id,
    v_item.id,
    v_req.borrower_id,
    v_req.owner_id,
    v_req.requested_until,
    'approved'
  )
  ON CONFLICT (request_id) DO UPDATE
    SET status = 'approved', updated_at = pg_catalog.now()
  RETURNING id INTO v_tx_id;

  -- 11. Create notice for borrower
  INSERT INTO public.notices (user_id, text, target, transaction_id)
  VALUES (
    v_req.borrower_id,
    v_item.name || ' request approved! Ready for handover.',
    'transaction',
    v_tx_id
  );

  -- 12. Atomically reject all other pending requests for this item
  WITH rejected_rows AS (
    UPDATE public.borrow_requests
    SET status = 'rejected',
        updated_at = pg_catalog.now()
    WHERE item_id = v_item.id
      AND id != p_request_id
      AND status = 'pending'
    RETURNING borrower_id
  )
  SELECT pg_catalog.count(*) INTO v_competing_rejected FROM rejected_rows;

  -- Send notice to competing borrowers
  INSERT INTO public.notices (user_id, text, target)
  SELECT borrower_id, v_item.name || ' is no longer available.', 'activity'
  FROM public.borrow_requests
  WHERE item_id = v_item.id
    AND id != p_request_id
    AND status = 'rejected'
    AND updated_at = pg_catalog.now();

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'status', 'approved',
    'item_id', v_item.id,
    'transaction_id', v_tx_id,
    'competing_rejected_count', v_competing_rejected
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. ATOMIC TRANSACTION LIFECYCLE MUTATION (Handover & Return Transitions)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mutate_transaction(
  p_transaction_id uuid,
  p_action text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_tx public.transactions%ROWTYPE;
  v_item public.items%ROWTYPE;
  v_other_user uuid;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF p_action NOT IN ('handover', 'initiate-return', 'confirm-return') THEN
    RAISE EXCEPTION 'Invalid action: % (must be "handover", "initiate-return", or "confirm-return").', p_action;
  END IF;

  -- Lock transaction
  SELECT *
  INTO v_tx
  FROM public.transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction % not found.', p_transaction_id;
  END IF;

  IF v_caller != v_tx.borrower_id AND v_caller != v_tx.owner_id THEN
    RAISE EXCEPTION 'Only the borrower or owner can update this exchange.';
  END IF;

  v_other_user := CASE WHEN v_caller = v_tx.owner_id THEN v_tx.borrower_id ELSE v_tx.owner_id END;

  SELECT *
  INTO v_item
  FROM public.items
  WHERE id = v_tx.item_id
  FOR UPDATE;

  IF p_action = 'handover' THEN
    IF v_tx.status != 'approved' THEN
      RAISE EXCEPTION 'Handover can only be confirmed for approved exchanges (currently %).', v_tx.status;
    END IF;

    UPDATE public.transactions
    SET status = 'borrowed',
        handover_at = pg_catalog.now(),
        updated_at = pg_catalog.now()
    WHERE id = p_transaction_id;

    UPDATE public.items
    SET availability_status = 'borrowed',
        updated_at = pg_catalog.now()
    WHERE id = v_tx.item_id;

    INSERT INTO public.notices (user_id, text, target, transaction_id)
    VALUES (v_other_user, 'Handover confirmed for ' || v_item.name || '. Now borrowed.', 'transaction', p_transaction_id);

    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'status', 'borrowed',
      'item_id', v_tx.item_id,
      'item_availability', 'borrowed'
    );

  ELSIF p_action = 'initiate-return' THEN
    IF v_tx.status != 'borrowed' THEN
      RAISE EXCEPTION 'Return can only be initiated for borrowed items (currently %).', v_tx.status;
    END IF;

    UPDATE public.transactions
    SET status = 'return_pending',
        updated_at = pg_catalog.now()
    WHERE id = p_transaction_id;

    INSERT INTO public.notices (user_id, text, target, transaction_id)
    VALUES (v_other_user, 'Return initiated for ' || v_item.name || '. Please confirm receipt.', 'transaction', p_transaction_id);

    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'status', 'return_pending',
      'item_id', v_tx.item_id,
      'item_availability', 'borrowed'
    );

  ELSIF p_action = 'confirm-return' THEN
    IF v_tx.status != 'return_pending' THEN
      RAISE EXCEPTION 'Return confirmation requires return_pending status (currently %).', v_tx.status;
    END IF;

    UPDATE public.transactions
    SET status = 'returned',
        returned_at = pg_catalog.now(),
        updated_at = pg_catalog.now()
    WHERE id = p_transaction_id;

    UPDATE public.items
    SET availability_status = 'available',
        updated_at = pg_catalog.now()
    WHERE id = v_tx.item_id;

    INSERT INTO public.notices (user_id, text, target, transaction_id)
    VALUES (v_other_user, 'Return completed for ' || v_item.name || '. Don''t forget to rate your exchange!', 'transaction', p_transaction_id);

    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'status', 'returned',
      'item_id', v_tx.item_id,
      'item_availability', 'available'
    );
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. SUBMIT REVIEW & RECALCULATE TRUST SCORE
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_review(
  p_transaction_id uuid,
  p_rating integer,
  p_comment text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_tx public.transactions%ROWTYPE;
  v_recipient_id uuid;
  v_item_name text;
  v_new_rating numeric(3, 2);
  v_review_id uuid;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required to submit reviews.';
  END IF;

  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be an integer between 1 and 5.';
  END IF;

  IF pg_catalog.length(trim(p_comment)) < 5 OR pg_catalog.length(p_comment) > 500 THEN
    RAISE EXCEPTION 'Review comment must be between 5 and 500 characters.';
  END IF;

  SELECT *
  INTO v_tx
  FROM public.transactions
  WHERE id = p_transaction_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction % does not exist.', p_transaction_id;
  END IF;

  IF v_tx.status != 'returned' THEN
    RAISE EXCEPTION 'Reviews can only be submitted for completed returns.';
  END IF;

  IF v_caller != v_tx.borrower_id AND v_caller != v_tx.owner_id THEN
    RAISE EXCEPTION 'Only participants in this transaction can leave a review.';
  END IF;

  v_recipient_id := CASE WHEN v_caller = v_tx.borrower_id THEN v_tx.owner_id ELSE v_tx.borrower_id END;

  SELECT name INTO v_item_name FROM public.items WHERE id = v_tx.item_id;

  -- Insert review
  INSERT INTO public.reviews (
    transaction_id,
    reviewer_id,
    recipient_id,
    rating,
    comment
  )
  VALUES (
    p_transaction_id,
    v_caller,
    v_recipient_id,
    p_rating,
    trim(p_comment)
  )
  RETURNING id INTO v_review_id;

  -- Set session flag to authorize system rating recalculation
  PERFORM pg_catalog.set_config('app.calculating_rating', 'true', true);

  -- Compute new average rating
  SELECT round(avg(rating)::numeric, 2)
  INTO v_new_rating
  FROM public.reviews
  WHERE recipient_id = v_recipient_id;

  UPDATE public.profiles
  SET rating = COALESCE(v_new_rating, 5.00),
      updated_at = pg_catalog.now()
  WHERE id = v_recipient_id;

  -- Create notice for recipient
  INSERT INTO public.notices (user_id, text, target)
  VALUES (
    v_recipient_id,
    'You received a ' || p_rating || '-star review' || COALESCE(' for "' || v_item_name || '"', '') || '.',
    'profile'
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'review_id', v_review_id,
    'recipient_id', v_recipient_id,
    'new_rating', v_new_rating
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Transactions readable by participants" ON public.transactions;
CREATE POLICY "Transactions readable by participants"
ON public.transactions
FOR SELECT
TO authenticated
USING (auth.uid() = borrower_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Transactions updatable by participants" ON public.transactions;
CREATE POLICY "Transactions updatable by participants"
ON public.transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = borrower_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Reviews readable by authenticated residents" ON public.reviews;
CREATE POLICY "Reviews readable by authenticated residents"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Residents can submit reviews" ON public.reviews;
CREATE POLICY "Residents can submit reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Notices readable by recipient" ON public.notices;
CREATE POLICY "Notices readable by recipient"
ON public.notices
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Notices updatable by recipient" ON public.notices;
CREATE POLICY "Notices updatable by recipient"
ON public.notices
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 10. LEAST-PRIVILEGE PERMISSION GRANTS
-- ------------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.mutate_transaction(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mutate_transaction(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.submit_review(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_review(uuid, integer, text) TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT SELECT, UPDATE ON public.notices TO authenticated;

COMMIT;
