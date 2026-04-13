import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResolveLoginRequest {
  org_slug: string;
  login_identifier: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as ResolveLoginRequest;
    if (!body.org_slug?.trim() || !body.login_identifier?.trim()) {
      return new Response(JSON.stringify({ error: 'org_slug and login_identifier are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const client = createClient(supabaseUrl, anonKey);

    const { data, error } = await client.rpc('resolve_login_contract', {
      p_org_slug: body.org_slug.trim(),
      p_login_identifier: body.login_identifier.trim(),
    });

    if (error || !data || data.length === 0) {
      return new Response(JSON.stringify({ error: 'Organization or login could not be resolved' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const row = data[0];

    return new Response(
      JSON.stringify({
        organization: {
          id: row.organization_id,
          slug: row.org_slug,
          displayName: row.org_display_name,
          status: row.org_status,
        },
        resolvedEmail: row.resolved_email,
        resolvedRole: row.resolved_role,
        loginIdentifierType: row.identifier_type,
        brandingDisplayName: row.branding_display_name ?? null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('resolve-login-context failed', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
