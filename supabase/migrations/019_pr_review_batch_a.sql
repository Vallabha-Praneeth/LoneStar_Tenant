-- ============================================================
-- PR review batch A fixes:
-- 1) transactional route stop replacement RPC
-- 2) persisted shift odometer columns
-- ============================================================

ALTER TABLE public.driver_shifts
  ADD COLUMN IF NOT EXISTS start_odometer numeric(10,2) NULL,
  ADD COLUMN IF NOT EXISTS end_odometer numeric(10,2) NULL;

CREATE OR REPLACE FUNCTION public.replace_route_stops(
  p_route_id uuid,
  p_stops jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_route_org_id uuid;
  v_idx integer;
  v_stop jsonb;
  v_venue_name text;
  v_address text;
BEGIN
  IF p_route_id IS NULL THEN
    RAISE EXCEPTION 'route_id is required';
  END IF;
  IF p_stops IS NULL OR jsonb_typeof(p_stops) <> 'array' THEN
    RAISE EXCEPTION 'stops must be a JSON array';
  END IF;

  SELECT r.organization_id
  INTO v_route_org_id
  FROM public.routes r
  WHERE r.id = p_route_id;

  IF v_route_org_id IS NULL THEN
    RAISE EXCEPTION 'Route not found';
  END IF;

  IF v_route_org_id <> public.get_jwt_org_id()
     OR public.get_jwt_org_role() <> 'admin' THEN
    RAISE EXCEPTION 'Not authorized to replace route stops';
  END IF;

  FOR v_idx IN 0 .. (jsonb_array_length(p_stops) - 1) LOOP
    v_stop := p_stops -> v_idx;
    v_venue_name := btrim(coalesce(v_stop ->> 'venue_name', ''));
    IF v_venue_name = '' THEN
      RAISE EXCEPTION 'Each stop must include a non-empty venue_name';
    END IF;
  END LOOP;

  DELETE FROM public.route_stops
  WHERE route_id = p_route_id
    AND organization_id = v_route_org_id;

  FOR v_idx IN 0 .. (jsonb_array_length(p_stops) - 1) LOOP
    v_stop := p_stops -> v_idx;
    v_venue_name := btrim(coalesce(v_stop ->> 'venue_name', ''));
    v_address := nullif(btrim(coalesce(v_stop ->> 'address', '')), '');

    INSERT INTO public.route_stops (
      organization_id,
      route_id,
      stop_order,
      venue_name,
      address
    )
    VALUES (
      v_route_org_id,
      p_route_id,
      v_idx + 1,
      v_venue_name,
      v_address
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_route_stops(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_route_stops(uuid, jsonb) TO authenticated;
