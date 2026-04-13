-- ============================================================
-- org spike: auth helpers, login resolver, and tenant-first RLS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_jwt_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(auth.jwt() -> 'app_metadata' ->> 'organization_id', '')::uuid
$$;

CREATE OR REPLACE FUNCTION public.get_jwt_org_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'org_role'
$$;

CREATE OR REPLACE FUNCTION public.get_support_grant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(auth.jwt() -> 'app_metadata' ->> 'support_grant_id', '')::uuid
$$;

CREATE OR REPLACE FUNCTION public.resolve_login_context(
  p_org_slug text,
  p_login_identifier text
)
RETURNS TABLE (
  organization_id uuid,
  org_slug text,
  org_display_name text,
  resolved_email text,
  org_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id,
    o.slug,
    o.display_name,
    au.email,
    o.status
  FROM public.organizations o
  JOIN public.profiles p
    ON p.organization_id = o.id
  JOIN auth.users au
    ON au.id = p.id
  WHERE lower(o.slug) = lower(p_org_slug)
    AND o.status = 'active'
    AND p.is_active = true
    AND (
      lower(p.username) = lower(p_login_identifier)
      OR lower(coalesce(p.email, '')) = lower(p_login_identifier)
    )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_login_context TO anon;

ALTER TABLE public.organizations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_types            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_costs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_shifts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_photos       ENABLE ROW LEVEL SECURITY;

-- organizations and branding: readable only through explicit support or tenant bootstrap
CREATE POLICY "organization_branding: tenant bootstrap read"
  ON public.organization_branding FOR SELECT
  USING (organization_id = public.get_jwt_org_id());

CREATE POLICY "profiles: self read"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles: tenant admin read"
  ON public.profiles FOR SELECT
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  );

CREATE POLICY "profiles: tenant admin update"
  ON public.profiles FOR UPDATE
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  )
  WITH CHECK (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  );

CREATE POLICY "clients: tenant admin all"
  ON public.clients FOR ALL
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  )
  WITH CHECK (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  );

CREATE POLICY "drivers: tenant admin all"
  ON public.drivers FOR ALL
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  )
  WITH CHECK (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  );

CREATE POLICY "drivers: driver self read"
  ON public.drivers FOR SELECT
  USING (
    organization_id = public.get_jwt_org_id()
    AND profile_id = auth.uid()
    AND public.get_jwt_org_role() = 'driver'
  );

CREATE POLICY "routes: tenant admin all"
  ON public.routes FOR ALL
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  )
  WITH CHECK (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  );

CREATE POLICY "route_stops: tenant admin all"
  ON public.route_stops FOR ALL
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  )
  WITH CHECK (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  );

CREATE POLICY "cost_types: tenant admin all"
  ON public.cost_types FOR ALL
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  )
  WITH CHECK (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  );

CREATE POLICY "campaigns: tenant admin all"
  ON public.campaigns FOR ALL
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  )
  WITH CHECK (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  );

CREATE POLICY "campaigns: driver read assigned"
  ON public.campaigns FOR SELECT
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'driver'
    AND driver_profile_id = auth.uid()
  );

CREATE POLICY "campaigns: client read own tenant"
  ON public.campaigns FOR SELECT
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'client'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = campaigns.organization_id
        AND p.client_id = campaigns.client_id
    )
  );

CREATE POLICY "campaign_costs: tenant admin all"
  ON public.campaign_costs FOR ALL
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  )
  WITH CHECK (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  );

CREATE POLICY "driver_shifts: tenant admin all"
  ON public.driver_shifts FOR ALL
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  )
  WITH CHECK (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  );

CREATE POLICY "driver_shifts: driver own"
  ON public.driver_shifts FOR ALL
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'driver'
    AND driver_profile_id = auth.uid()
  )
  WITH CHECK (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'driver'
    AND driver_profile_id = auth.uid()
  );

CREATE POLICY "driver_shifts: client read own tenant"
  ON public.driver_shifts FOR SELECT
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'client'
    AND EXISTS (
      SELECT 1
      FROM public.campaigns c
      JOIN public.profiles p
        ON p.id = auth.uid()
      WHERE c.id = driver_shifts.campaign_id
        AND c.organization_id = driver_shifts.organization_id
        AND p.organization_id = c.organization_id
        AND p.client_id = c.client_id
    )
  );

CREATE POLICY "campaign_photos: tenant admin all"
  ON public.campaign_photos FOR ALL
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  )
  WITH CHECK (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  );

CREATE POLICY "campaign_photos: driver insert own"
  ON public.campaign_photos FOR INSERT
  WITH CHECK (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'driver'
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "campaign_photos: driver read own"
  ON public.campaign_photos FOR SELECT
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'driver'
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "campaign_photos: client read visible"
  ON public.campaign_photos FOR SELECT
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'client'
    AND is_hidden = false
    AND EXISTS (
      SELECT 1
      FROM public.campaigns c
      JOIN public.profiles p
        ON p.id = auth.uid()
      WHERE c.id = campaign_photos.campaign_id
        AND c.organization_id = campaign_photos.organization_id
        AND p.organization_id = c.organization_id
        AND p.client_id = c.client_id
    )
  );
