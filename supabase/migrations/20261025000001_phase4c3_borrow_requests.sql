-- ==============================================================================
-- HostelShare — Phase 4C.3: Supabase Borrow Request Flow & Atomic Concurrency
-- ==============================================================================
-- Migration Version: 20261025000001
-- Purpose:
--   1. Provide an atomic, transaction-safe stored procedure `decide_borrow_request`
--      for item owners to approve or reject pending borrow requests.
--   2. Enforce concurrency locking (SELECT FOR UPDATE) preventing two competing
--      requests from both reserving the same available item.
--   3. When an owner approves a request:
--        - Atomically validates caller is the verified item owner.
--        - Locks the item row and confirms availability_status is 'available'.
--        - Sets the item availability_status to 'reserved'.
--        - Transitions the target borrow request status to 'approved'.
--        - Atomically marks all other pending requests for that item as 'rejected'.
--   4. When an owner rejects a request:
--        - Transitions the request status to 'rejected'.
--   5. Search-path hardening: SET search_path = '' to prevent hijack vulnerabilities.
-- ==============================================================================

BEGIN;

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

  -- 10. Atomically reject all other pending requests for this item
  WITH rejected_rows AS (
    UPDATE public.borrow_requests
    SET status = 'rejected',
        updated_at = pg_catalog.now()
    WHERE item_id = v_item.id
      AND id != p_request_id
      AND status = 'pending'
    RETURNING id
  )
  SELECT pg_catalog.count(*) INTO v_competing_rejected FROM rejected_rows;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'status', 'approved',
    'item_id', v_item.id,
    'competing_rejected_count', v_competing_rejected
  );
END;
$$;

COMMENT ON FUNCTION public.decide_borrow_request(uuid, text) IS
  'Atomically approves or rejects a borrow request, locking the item, setting it to reserved on approval, and rejecting competing pending requests.';

-- ------------------------------------------------------------------------------
-- Permission Grants
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.decide_borrow_request(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_borrow_request(uuid, text) TO authenticated;

COMMIT;
