-- ============================================================
-- phase 1: lock down non-v1 public runtime paths.
-- v1 login is email-only and routes through signInWithPassword →
-- bootstrap-tenant-session. The legacy resolve_login_contract RPC
-- was only consumed by the deprecated resolve-login-context edge
-- function (username/email pre-resolution). Revoke its anonymous
-- execute grant so the runtime path is no longer reachable.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'resolve_login_contract'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.resolve_login_contract(text, text)
      FROM public, anon, authenticated;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'resolve_login_context'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.resolve_login_context(text, text)
      FROM public, anon, authenticated;
  END IF;
END;
$$;
