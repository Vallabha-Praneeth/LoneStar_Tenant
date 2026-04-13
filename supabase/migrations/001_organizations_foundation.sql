-- ============================================================
-- org spike: tenant-first foundation schema
-- This is a greenfield design for a shared multi-tenant AdTruck platform.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text        NOT NULL,
  legal_name    text        NOT NULL,
  display_name  text        NOT NULL,
  status        text        NOT NULL DEFAULT 'draft',
  support_email text        NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT organizations_slug_check CHECK (slug <> ''),
  CONSTRAINT organizations_status_check CHECK (status IN ('draft', 'active', 'suspended'))
);

CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_lower_idx
  ON public.organizations (lower(slug));

CREATE TABLE IF NOT EXISTS public.organization_branding (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  display_name     text        NOT NULL,
  logo_url         text        NOT NULL,
  primary_color    text        NOT NULL,
  secondary_color  text        NOT NULL,
  accent_color     text        NOT NULL,
  surface_color    text        NOT NULL,
  text_color       text        NOT NULL,
  muted_text_color text        NOT NULL,
  border_color     text        NOT NULL,
  heading_font     text        NOT NULL,
  body_font        text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT organization_branding_org_unique UNIQUE (organization_id)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id               uuid        NOT NULL,
  organization_id  uuid        NOT NULL,
  role             text        NOT NULL,
  username         text        NOT NULL,
  display_name     text        NOT NULL,
  email            text        NULL,
  client_id        uuid        NULL,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_auth_user_fkey FOREIGN KEY (id)
    REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id)
    REFERENCES public.organizations (id) ON DELETE RESTRICT,
  CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'driver', 'client'))
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_org_username_lower_idx
  ON public.profiles (organization_id, lower(username));

CREATE INDEX IF NOT EXISTS profiles_org_role_idx
  ON public.profiles (organization_id, role);

CREATE TABLE IF NOT EXISTS public.clients (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  name             text        NOT NULL,
  phone_number     text        NULL,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT clients_name_check CHECK (name <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS clients_org_name_lower_idx
  ON public.clients (organization_id, lower(name));

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients (id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.drivers (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  profile_id              uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  license_number          text        NULL,
  license_type            text        NULL,
  license_expiry          date        NULL,
  emergency_contact_name  text        NULL,
  emergency_contact_phone text        NULL,
  base_daily_wage         numeric(10,2) NULL,
  city                    text        NULL,
  is_active               boolean     NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT drivers_profile_unique UNIQUE (profile_id),
  CONSTRAINT drivers_base_daily_wage_check CHECK (base_daily_wage IS NULL OR base_daily_wage >= 0)
);

CREATE TABLE IF NOT EXISTS public.routes (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  name             text        NOT NULL,
  city             text        NULL,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT routes_name_check CHECK (name <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS routes_org_name_city_unique_idx
  ON public.routes (organization_id, lower(name), COALESCE(lower(city), ''));

CREATE TABLE IF NOT EXISTS public.route_stops (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  route_id         uuid        NOT NULL REFERENCES public.routes (id) ON DELETE CASCADE,
  stop_order       integer     NOT NULL,
  venue_name       text        NOT NULL,
  address          text        NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT route_stops_venue_name_check CHECK (venue_name <> ''),
  CONSTRAINT route_stops_stop_order_check CHECK (stop_order > 0),
  CONSTRAINT route_stops_route_order_unique UNIQUE (route_id, stop_order)
);

CREATE TABLE IF NOT EXISTS public.cost_types (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  name             text        NOT NULL,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT cost_types_name_check CHECK (name <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS cost_types_org_name_unique_idx
  ON public.cost_types (organization_id, lower(name));

CREATE TABLE IF NOT EXISTS public.campaigns (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  title                 text        NOT NULL,
  campaign_date         date        NOT NULL,
  route_id              uuid        NULL REFERENCES public.routes (id) ON DELETE SET NULL,
  status                text        NOT NULL DEFAULT 'draft',
  client_id             uuid        NOT NULL REFERENCES public.clients (id) ON DELETE RESTRICT,
  driver_profile_id     uuid        NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  internal_notes        text        NULL,
  client_billed_amount  numeric(10,2) NULL,
  created_by            uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT campaigns_title_check CHECK (title <> ''),
  CONSTRAINT campaigns_status_check CHECK (status IN ('draft', 'pending', 'active', 'completed', 'cancelled')),
  CONSTRAINT campaigns_client_billed_amount_check CHECK (client_billed_amount IS NULL OR client_billed_amount >= 0)
);

CREATE INDEX IF NOT EXISTS campaigns_org_date_idx
  ON public.campaigns (organization_id, campaign_date DESC);

CREATE TABLE IF NOT EXISTS public.campaign_costs (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  campaign_id      uuid          NOT NULL REFERENCES public.campaigns (id) ON DELETE CASCADE,
  cost_type_id     uuid          NOT NULL REFERENCES public.cost_types (id) ON DELETE RESTRICT,
  amount           numeric(10,2) NOT NULL,
  notes            text          NULL,
  created_at       timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT campaign_costs_amount_check CHECK (amount >= 0)
);

CREATE TABLE IF NOT EXISTS public.driver_shifts (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  campaign_id       uuid        NOT NULL REFERENCES public.campaigns (id) ON DELETE CASCADE,
  driver_profile_id uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  started_at        timestamptz NOT NULL,
  ended_at          timestamptz NULL,
  shift_status      text        NOT NULL DEFAULT 'active',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT driver_shifts_time_check CHECK (ended_at IS NULL OR ended_at >= started_at),
  CONSTRAINT driver_shifts_status_check CHECK (shift_status IN ('scheduled', 'active', 'completed', 'no_show', 'cancelled'))
);

CREATE UNIQUE INDEX IF NOT EXISTS driver_shifts_active_idx
  ON public.driver_shifts (organization_id, driver_profile_id)
  WHERE shift_status = 'active';

CREATE TABLE IF NOT EXISTS public.campaign_photos (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  campaign_id      uuid        NOT NULL REFERENCES public.campaigns (id) ON DELETE CASCADE,
  uploaded_by      uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  storage_path     text        NOT NULL,
  note             text        NULL,
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  captured_at      timestamptz NULL,
  is_hidden        boolean     NOT NULL DEFAULT false,
  drive_file_id    text        NULL,

  CONSTRAINT campaign_photos_storage_path_check CHECK (storage_path <> '')
);

CREATE TABLE IF NOT EXISTS public.support_access_grants (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  requested_by     uuid        NOT NULL,
  approved_by      uuid        NULL,
  reason           text        NOT NULL,
  status           text        NOT NULL DEFAULT 'requested',
  starts_at        timestamptz NOT NULL,
  expires_at       timestamptz NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT support_access_grants_reason_check CHECK (reason <> ''),
  CONSTRAINT support_access_grants_status_check CHECK (status IN ('requested', 'approved', 'expired', 'revoked')),
  CONSTRAINT support_access_grants_window_check CHECK (expires_at > starts_at)
);

CREATE TABLE IF NOT EXISTS public.support_access_audit (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id         uuid        NOT NULL REFERENCES public.support_access_grants (id) ON DELETE CASCADE,
  organization_id  uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  actor_user_id    uuid        NOT NULL,
  action           text        NOT NULL,
  target_type      text        NOT NULL,
  target_id        text        NULL,
  metadata         jsonb       NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT support_access_audit_action_check CHECK (action <> ''),
  CONSTRAINT support_access_audit_target_type_check CHECK (target_type <> '')
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'organizations',
    'organization_branding',
    'profiles',
    'clients',
    'drivers',
    'routes',
    'campaigns',
    'driver_shifts'
  ] LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER set_%s_updated_at
       BEFORE UPDATE ON public.%s
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;
