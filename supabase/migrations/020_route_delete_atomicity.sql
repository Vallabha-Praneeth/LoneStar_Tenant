-- ============================================================
-- PR blocker fix: atomic route deletion with stop cleanup
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_route_with_stops(
  p_route_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_route_org_id uuid;
BEGIN
  IF p_route_id IS NULL THEN
    RAISE EXCEPTION 'route_id is required';
  END IF;

  SELECT r.organization_id
  INTO v_route_org_id
  FROM public.routes r
  WHERE r.id = p_route_id;

  IF v_route_org_id IS NULL THEN
    RAISE EXCEPTION 'Route not found';
  END IF;

  IF v_route_org_id IS DISTINCT FROM public.get_jwt_org_id()
     OR coalesce(public.get_jwt_org_role(), '') <> 'admin' THEN
    RAISE EXCEPTION 'Not authorized to delete route';
  END IF;

  DELETE FROM public.route_stops
  WHERE route_id = p_route_id
    AND organization_id = v_route_org_id;

  DELETE FROM public.routes
  WHERE id = p_route_id
    AND organization_id = v_route_org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_route_with_stops(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_route_with_stops(uuid) TO authenticated;
