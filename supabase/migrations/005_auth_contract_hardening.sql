-- ============================================================
-- org spike: auth contract hardening
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_jwt_org_slug()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'org_slug'
$$;

CREATE OR REPLACE FUNCTION public.get_jwt_platform_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'platform_role'
$$;

CREATE OR REPLACE FUNCTION public.resolve_login_contract(
  p_org_slug text,
  p_login_identifier text
)
RETURNS TABLE (
  organization_id uuid,
  org_slug text,
  org_display_name text,
  resolved_email text,
  org_status text,
  resolved_role text,
  identifier_type text,
  branding_display_name text,
  branding_logo_url text
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
    o.status,
    p.role,
    CASE
      WHEN lower(coalesce(p.email, '')) = lower(p_login_identifier) THEN 'email'
      ELSE 'username'
    END,
    ob.display_name,
    ob.logo_url
  FROM public.organizations o
  JOIN public.profiles p
    ON p.organization_id = o.id
  JOIN auth.users au
    ON au.id = p.id
  LEFT JOIN public.organization_branding ob
    ON ob.organization_id = o.id
  WHERE lower(o.slug) = lower(p_org_slug)
    AND o.status = 'active'
    AND p.is_active = true
    AND (
      lower(p.username) = lower(p_login_identifier)
      OR lower(coalesce(p.email, '')) = lower(p_login_identifier)
    )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_login_contract TO anon;

CREATE OR REPLACE FUNCTION public.build_tenant_bootstrap(
  p_expected_org_slug text DEFAULT NULL
)
RETURNS TABLE (
  organization_id uuid,
  org_slug text,
  org_display_name text,
  org_status text,
  org_support_email text,
  profile_id uuid,
  profile_role text,
  profile_username text,
  profile_display_name text,
  profile_email text,
  profile_client_id uuid,
  branding_display_name text,
  branding_logo_url text,
  primary_color text,
  secondary_color text,
  accent_color text,
  surface_color text,
  text_color text,
  muted_text_color text,
  border_color text,
  heading_font text,
  body_font text,
  platform_role text,
  support_grant_id uuid,
  initial_route text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id,
    o.slug,
    o.display_name,
    o.status,
    o.support_email,
    p.id,
    p.role,
    p.username,
    p.display_name,
    p.email,
    p.client_id,
    ob.display_name,
    ob.logo_url,
    ob.primary_color,
    ob.secondary_color,
    ob.accent_color,
    ob.surface_color,
    ob.text_color,
    ob.muted_text_color,
    ob.border_color,
    ob.heading_font,
    ob.body_font,
    public.get_jwt_platform_role(),
    public.get_support_grant_id(),
    CASE p.role
      WHEN 'admin' THEN '/admin'
      WHEN 'driver' THEN '/driver'
      ELSE '/client'
    END
  FROM public.profiles p
  JOIN public.organizations o
    ON o.id = p.organization_id
  LEFT JOIN public.organization_branding ob
    ON ob.organization_id = o.id
  WHERE p.id = auth.uid()
    AND p.is_active = true
    AND p.organization_id = public.get_jwt_org_id()
    AND p.role = public.get_jwt_org_role()
    AND o.status = 'active'
    AND (
      p_expected_org_slug IS NULL
      OR lower(o.slug) = lower(p_expected_org_slug)
    )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.build_tenant_bootstrap(text) TO authenticated;
