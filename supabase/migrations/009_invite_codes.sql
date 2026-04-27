-- ============================================================
-- phase 1: invite-gated org creation
-- Invite codes are managed exclusively by super-admin edge functions
-- using the service role. No direct client access is permitted.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.organization_invite_codes (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text        NOT NULL,
  note             text        NULL,
  created_by       uuid        NULL,
  expires_at       timestamptz NOT NULL,
  used_at          timestamptz NULL,
  used_by_org_id   uuid        NULL REFERENCES public.organizations (id) ON DELETE SET NULL,
  used_by_org_name text        NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT organization_invite_codes_code_check CHECK (code <> ''),
  CONSTRAINT organization_invite_codes_window_check CHECK (expires_at > created_at),
  CONSTRAINT organization_invite_codes_usage_consistency CHECK (
    (used_at IS NULL AND used_by_org_id IS NULL AND used_by_org_name IS NULL)
    OR (used_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS organization_invite_codes_code_upper_idx
  ON public.organization_invite_codes (upper(code));

CREATE INDEX IF NOT EXISTS organization_invite_codes_active_idx
  ON public.organization_invite_codes (expires_at)
  WHERE used_at IS NULL;

CREATE OR REPLACE TRIGGER set_organization_invite_codes_updated_at
BEFORE UPDATE ON public.organization_invite_codes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.organization_invite_codes ENABLE ROW LEVEL SECURITY;

-- No tenant-facing client should read or mutate this table directly.
-- Only the service role (super-admin edge functions, create-organization)
-- interacts with these rows.
CREATE POLICY "organization_invite_codes: no direct client access"
  ON public.organization_invite_codes FOR ALL
  USING (false)
  WITH CHECK (false);
