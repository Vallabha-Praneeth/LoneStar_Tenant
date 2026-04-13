-- ============================================================
-- org spike: break-glass support access model
-- ============================================================

ALTER TABLE public.support_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_access_audit ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_active_support_grant(
  p_org_id uuid,
  p_actor uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.support_access_grants g
    WHERE g.organization_id = p_org_id
      AND g.status = 'approved'
      AND g.starts_at <= now()
      AND g.expires_at >= now()
      AND p_actor = auth.uid()
  )
$$;

-- The spike intentionally keeps these tables backend-facing only.
-- No tenant-facing client should read or mutate them directly.

CREATE POLICY "support_access_grants: no direct client access"
  ON public.support_access_grants FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "support_access_audit: no direct client access"
  ON public.support_access_audit FOR ALL
  USING (false)
  WITH CHECK (false);
