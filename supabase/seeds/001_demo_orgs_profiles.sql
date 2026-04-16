-- ============================================================
-- demo seed: two orgs + branding + profiles + JWT claims
-- Purpose:
-- - unblock Step 4 mobile auth/bootstrap wiring
-- - provide minimal real backend data for lonestar + skyline
--
-- Prerequisite:
-- Create these 6 auth users in Supabase Auth first, all as confirmed users:
--   admin@lonestar.demo
--   driver@lonestar.demo
--   client@lonestar.demo
--   admin@skyline.demo
--   driver@skyline.demo
--   client@skyline.demo
--
-- Suggested password for all six users:
--   Demo123!
-- ============================================================

begin;

create temp table tmp_demo_auth_users on commit drop as
select id, email
from auth.users
where email in (
  'admin@lonestar.demo',
  'driver@lonestar.demo',
  'client@lonestar.demo',
  'admin@skyline.demo',
  'driver@skyline.demo',
  'client@skyline.demo'
);

do $$
declare
  user_count integer;
begin
  select count(*) into user_count from tmp_demo_auth_users;
  if user_count <> 6 then
    raise exception
      'Expected 6 demo auth users, found %. Create the auth users first in Supabase Auth before running this seed.',
      user_count;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------

insert into public.organizations (
  id,
  slug,
  legal_name,
  display_name,
  status,
  support_email
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'lonestar',
    'LoneStar AdTruck Demo Org',
    'LoneStar AdTruck',
    'active',
    'support@lonestar.demo'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'skyline',
    'Skyline Campaign Ops Demo Org',
    'Skyline Campaign Ops',
    'active',
    'support@skyline.demo'
  )
on conflict (id) do update
set
  slug = excluded.slug,
  legal_name = excluded.legal_name,
  display_name = excluded.display_name,
  status = excluded.status,
  support_email = excluded.support_email;

-- ---------------------------------------------------------------------------
-- Branding
-- ---------------------------------------------------------------------------

insert into public.organization_branding (
  organization_id,
  display_name,
  logo_url,
  primary_color,
  secondary_color,
  accent_color,
  surface_color,
  text_color,
  muted_text_color,
  border_color,
  heading_font,
  body_font
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'LoneStar AdTruck',
    '/brand/lonestar-logo.svg',
    '#B8460B',
    '#FFF3E8',
    '#E8832A',
    '#FFFFFF',
    '#1C1410',
    '#8A7A70',
    '#E2D9D0',
    'Inter',
    'Inter'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Skyline Campaign Ops',
    '/brand/skyline-logo.svg',
    '#1B3A5C',
    '#EAF2FA',
    '#2E7DC5',
    '#FFFFFF',
    '#0F1F30',
    '#6B7E90',
    '#D5E0EC',
    'Inter',
    'Inter'
  )
on conflict (organization_id) do update
set
  display_name = excluded.display_name,
  logo_url = excluded.logo_url,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  accent_color = excluded.accent_color,
  surface_color = excluded.surface_color,
  text_color = excluded.text_color,
  muted_text_color = excluded.muted_text_color,
  border_color = excluded.border_color,
  heading_font = excluded.heading_font,
  body_font = excluded.body_font;

-- ---------------------------------------------------------------------------
-- Optional integration shells
-- ---------------------------------------------------------------------------

insert into public.organization_integrations (
  organization_id,
  provider,
  status,
  config_reference
)
values
  ('11111111-1111-1111-1111-111111111111', 'google_drive', 'disabled', null),
  ('11111111-1111-1111-1111-111111111111', 'whatsapp', 'disabled', null),
  ('22222222-2222-2222-2222-222222222222', 'google_drive', 'disabled', null),
  ('22222222-2222-2222-2222-222222222222', 'whatsapp', 'disabled', null)
on conflict (organization_id, provider) do update
set
  status = excluded.status,
  config_reference = excluded.config_reference;

-- ---------------------------------------------------------------------------
-- Client rows needed for client-profile foreign keys
-- ---------------------------------------------------------------------------

insert into public.clients (
  id,
  organization_id,
  name,
  phone_number,
  is_active
)
values
  (
    '11111111-1111-1111-1111-111111111201',
    '11111111-1111-1111-1111-111111111111',
    'Texaco Regional',
    '+1-555-0101',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222201',
    '22222222-2222-2222-2222-222222222222',
    'HealthFirst Network',
    '+1-555-0201',
    true
  )
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  name = excluded.name,
  phone_number = excluded.phone_number,
  is_active = excluded.is_active;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

insert into public.profiles (
  id,
  organization_id,
  role,
  username,
  display_name,
  email,
  client_id,
  is_active
)
select
  u.id,
  seed.organization_id,
  seed.role,
  seed.username,
  seed.display_name,
  seed.email,
  seed.client_id,
  true
from (
  values
    (
      'admin@lonestar.demo',
      '11111111-1111-1111-1111-111111111111'::uuid,
      'admin',
      'admin',
      'Garrett Flores',
      'admin@lonestar.demo',
      null::uuid
    ),
    (
      'driver@lonestar.demo',
      '11111111-1111-1111-1111-111111111111'::uuid,
      'driver',
      'driver',
      'Marcus Webb',
      'driver@lonestar.demo',
      null::uuid
    ),
    (
      'client@lonestar.demo',
      '11111111-1111-1111-1111-111111111111'::uuid,
      'client',
      'client',
      'Priya Nair',
      'client@lonestar.demo',
      '11111111-1111-1111-1111-111111111201'::uuid
    ),
    (
      'admin@skyline.demo',
      '22222222-2222-2222-2222-222222222222'::uuid,
      'admin',
      'admin',
      'Dana Carlson',
      'admin@skyline.demo',
      null::uuid
    ),
    (
      'driver@skyline.demo',
      '22222222-2222-2222-2222-222222222222'::uuid,
      'driver',
      'driver',
      'Tomas Rivera',
      'driver@skyline.demo',
      null::uuid
    ),
    (
      'client@skyline.demo',
      '22222222-2222-2222-2222-222222222222'::uuid,
      'client',
      'client',
      'Amelia Chen',
      'client@skyline.demo',
      '22222222-2222-2222-2222-222222222201'::uuid
    )
) as seed(email, organization_id, role, username, display_name, email_out, client_id)
join tmp_demo_auth_users u
  on u.email = seed.email
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  role = excluded.role,
  username = excluded.username,
  display_name = excluded.display_name,
  email = excluded.email,
  client_id = excluded.client_id,
  is_active = excluded.is_active;

-- ---------------------------------------------------------------------------
-- Minimal driver shells
-- ---------------------------------------------------------------------------

insert into public.drivers (
  organization_id,
  profile_id,
  city,
  is_active
)
select
  p.organization_id,
  p.id,
  case
    when p.organization_id = '11111111-1111-1111-1111-111111111111'::uuid then 'Austin'
    else 'Dallas'
  end,
  true
from public.profiles p
where p.email in ('driver@lonestar.demo', 'driver@skyline.demo')
on conflict (profile_id) do update
set
  organization_id = excluded.organization_id,
  city = excluded.city,
  is_active = excluded.is_active;

-- ---------------------------------------------------------------------------
-- JWT app metadata claims required by bootstrap-tenant-session
-- ---------------------------------------------------------------------------

update auth.users au
set raw_app_meta_data = coalesce(au.raw_app_meta_data, '{}'::jsonb) || claims.app_meta
from (
  select
    u.id as user_id,
    jsonb_build_object(
      'organization_id', p.organization_id::text,
      'org_slug', o.slug,
      'org_role', p.role
    ) as app_meta
  from tmp_demo_auth_users u
  join public.profiles p
    on p.id = u.id
  join public.organizations o
    on o.id = p.organization_id
) claims
where au.id = claims.user_id;

commit;

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
-- select slug, display_name, status from public.organizations order by slug;
-- select organization_id, display_name from public.organization_branding order by organization_id;
-- select email, role, organization_id from public.profiles order by email;
-- select email, raw_app_meta_data from auth.users where email like '%@%.demo' order by email;
