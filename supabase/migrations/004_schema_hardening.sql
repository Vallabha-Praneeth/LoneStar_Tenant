-- ============================================================
-- org spike: schema hardening for tenant-safe relationships
-- ============================================================

CREATE TABLE IF NOT EXISTS public.organization_integrations (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  provider          text        NOT NULL,
  status            text        NOT NULL DEFAULT 'disabled',
  config_reference  text        NULL,
  delivery_path     text        NULL,
  metadata          jsonb       NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT organization_integrations_provider_check
    CHECK (provider IN ('google_drive', 'whatsapp')),
  CONSTRAINT organization_integrations_status_check
    CHECK (status IN ('disabled', 'configured', 'active', 'error')),
  CONSTRAINT organization_integrations_unique
    UNIQUE (organization_id, provider)
);

CREATE INDEX IF NOT EXISTS organization_integrations_org_status_idx
  ON public.organization_integrations (organization_id, status);

CREATE OR REPLACE TRIGGER set_organization_integrations_updated_at
BEFORE UPDATE ON public.organization_integrations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS profiles_org_id_unique_idx
  ON public.profiles (organization_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS clients_org_id_unique_idx
  ON public.clients (organization_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS drivers_org_id_unique_idx
  ON public.drivers (organization_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS routes_org_id_unique_idx
  ON public.routes (organization_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS cost_types_org_id_unique_idx
  ON public.cost_types (organization_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS campaigns_org_id_unique_idx
  ON public.campaigns (organization_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS support_access_grants_org_id_unique_idx
  ON public.support_access_grants (organization_id, id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_org_client_tenant_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_org_client_tenant_fkey
      FOREIGN KEY (organization_id, client_id)
      REFERENCES public.clients (organization_id, id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'drivers_org_profile_tenant_fkey'
  ) THEN
    ALTER TABLE public.drivers
      ADD CONSTRAINT drivers_org_profile_tenant_fkey
      FOREIGN KEY (organization_id, profile_id)
      REFERENCES public.profiles (organization_id, id)
      ON DELETE CASCADE;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'route_stops_org_route_tenant_fkey'
  ) THEN
    ALTER TABLE public.route_stops
      ADD CONSTRAINT route_stops_org_route_tenant_fkey
      FOREIGN KEY (organization_id, route_id)
      REFERENCES public.routes (organization_id, id)
      ON DELETE CASCADE;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'campaigns_org_route_tenant_fkey'
  ) THEN
    ALTER TABLE public.campaigns
      ADD CONSTRAINT campaigns_org_route_tenant_fkey
      FOREIGN KEY (organization_id, route_id)
      REFERENCES public.routes (organization_id, id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'campaigns_org_client_tenant_fkey'
  ) THEN
    ALTER TABLE public.campaigns
      ADD CONSTRAINT campaigns_org_client_tenant_fkey
      FOREIGN KEY (organization_id, client_id)
      REFERENCES public.clients (organization_id, id)
      ON DELETE RESTRICT;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'campaigns_org_driver_profile_tenant_fkey'
  ) THEN
    ALTER TABLE public.campaigns
      ADD CONSTRAINT campaigns_org_driver_profile_tenant_fkey
      FOREIGN KEY (organization_id, driver_profile_id)
      REFERENCES public.profiles (organization_id, id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'campaigns_org_created_by_tenant_fkey'
  ) THEN
    ALTER TABLE public.campaigns
      ADD CONSTRAINT campaigns_org_created_by_tenant_fkey
      FOREIGN KEY (organization_id, created_by)
      REFERENCES public.profiles (organization_id, id)
      ON DELETE RESTRICT;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'campaign_costs_org_campaign_tenant_fkey'
  ) THEN
    ALTER TABLE public.campaign_costs
      ADD CONSTRAINT campaign_costs_org_campaign_tenant_fkey
      FOREIGN KEY (organization_id, campaign_id)
      REFERENCES public.campaigns (organization_id, id)
      ON DELETE CASCADE;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'campaign_costs_org_cost_type_tenant_fkey'
  ) THEN
    ALTER TABLE public.campaign_costs
      ADD CONSTRAINT campaign_costs_org_cost_type_tenant_fkey
      FOREIGN KEY (organization_id, cost_type_id)
      REFERENCES public.cost_types (organization_id, id)
      ON DELETE RESTRICT;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'driver_shifts_org_campaign_tenant_fkey'
  ) THEN
    ALTER TABLE public.driver_shifts
      ADD CONSTRAINT driver_shifts_org_campaign_tenant_fkey
      FOREIGN KEY (organization_id, campaign_id)
      REFERENCES public.campaigns (organization_id, id)
      ON DELETE CASCADE;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'driver_shifts_org_driver_profile_tenant_fkey'
  ) THEN
    ALTER TABLE public.driver_shifts
      ADD CONSTRAINT driver_shifts_org_driver_profile_tenant_fkey
      FOREIGN KEY (organization_id, driver_profile_id)
      REFERENCES public.profiles (organization_id, id)
      ON DELETE RESTRICT;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'campaign_photos_org_campaign_tenant_fkey'
  ) THEN
    ALTER TABLE public.campaign_photos
      ADD CONSTRAINT campaign_photos_org_campaign_tenant_fkey
      FOREIGN KEY (organization_id, campaign_id)
      REFERENCES public.campaigns (organization_id, id)
      ON DELETE CASCADE;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'campaign_photos_org_uploaded_by_tenant_fkey'
  ) THEN
    ALTER TABLE public.campaign_photos
      ADD CONSTRAINT campaign_photos_org_uploaded_by_tenant_fkey
      FOREIGN KEY (organization_id, uploaded_by)
      REFERENCES public.profiles (organization_id, id)
      ON DELETE RESTRICT;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'support_access_audit_org_grant_tenant_fkey'
  ) THEN
    ALTER TABLE public.support_access_audit
      ADD CONSTRAINT support_access_audit_org_grant_tenant_fkey
      FOREIGN KEY (organization_id, grant_id)
      REFERENCES public.support_access_grants (organization_id, id)
      ON DELETE CASCADE;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS campaigns_org_client_idx
  ON public.campaigns (organization_id, client_id);

CREATE INDEX IF NOT EXISTS campaigns_org_driver_idx
  ON public.campaigns (organization_id, driver_profile_id);

CREATE INDEX IF NOT EXISTS driver_shifts_org_campaign_idx
  ON public.driver_shifts (organization_id, campaign_id, started_at DESC);

CREATE INDEX IF NOT EXISTS campaign_photos_org_campaign_idx
  ON public.campaign_photos (organization_id, campaign_id, submitted_at DESC);

CREATE OR REPLACE FUNCTION public.enforce_campaign_photo_storage_path()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.storage_path IS NULL OR NEW.storage_path = '' THEN
    RAISE EXCEPTION 'storage_path is required';
  END IF;

  IF NEW.storage_path LIKE '%..%' THEN
    RAISE EXCEPTION 'storage_path must not contain path traversal segments';
  END IF;

  IF NEW.storage_path NOT LIKE NEW.organization_id::text || '/%' THEN
    RAISE EXCEPTION 'storage_path must start with organization_id/';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_campaign_photo_storage_path
  ON public.campaign_photos;

CREATE TRIGGER enforce_campaign_photo_storage_path
BEFORE INSERT OR UPDATE ON public.campaign_photos
FOR EACH ROW EXECUTE FUNCTION public.enforce_campaign_photo_storage_path();
