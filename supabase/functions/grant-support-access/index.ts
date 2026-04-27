// Phase 1: disabled for v1.
//
// v1 product rules explicitly forbid runtime support/break-glass data-access
// paths. Super-admin privileges are limited to the invite lifecycle
// (send / resend / list) and have no tenant data access.
//
// This edge function is retained as a 410 Gone stub so that any stale caller
// receives an unambiguous response and deployment flows do not break.
// It does not read or mutate any tenant data.

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
      error: 'grant-support-access is disabled in v1.',
      code: 'support_access_disabled',
    }),
    {
      status: 410,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
});
