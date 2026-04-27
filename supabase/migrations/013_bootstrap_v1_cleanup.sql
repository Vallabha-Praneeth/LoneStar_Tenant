-- ============================================================
-- phase 1: schema alignment for v1 org creation.
-- organization_branding.logo_url was NOT NULL in migration 001,
-- but the v1 signup flow does not collect or upload a logo.
-- Branding UX (logo + theme color) is explicitly deferred, so the
-- safest minimal fix is to drop the NOT NULL constraint. Existing
-- rows retain their values; future rows may omit the field until
-- the branding settings UX is implemented.
-- ============================================================

ALTER TABLE public.organization_branding
  ALTER COLUMN logo_url DROP NOT NULL;
