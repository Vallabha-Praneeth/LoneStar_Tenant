// Phase 1: disabled for v1.
//
// v1 login is email-only and flows through signInWithPassword →
// bootstrap-tenant-session. There is no username or phone login, and no
// public login-identifier resolver. The underlying RPC
// public.resolve_login_contract also has its anon EXECUTE grant revoked
// in migration 010.
//
// This edge function is retained as a 410 Gone stub so that any stale
// caller receives an unambiguous response without exposing the legacy
// pre-resolution contract.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      error: 'resolve-login-context is disabled in v1.',
      code: 'login_resolver_disabled',
    }),
    {
      status: 410,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
});
