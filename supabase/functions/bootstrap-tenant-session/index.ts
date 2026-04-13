import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BootstrapTenantSessionRequest {
  expected_org_slug?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const client = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const claims = user.app_metadata ?? {};
    if (!claims.organization_id || !claims.org_slug || !claims.org_role) {
      return new Response(JSON.stringify({ error: 'Missing tenant claims in JWT' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = req.method === 'POST' ? (await req.json()) as BootstrapTenantSessionRequest : {};
    const expectedOrgSlug = body.expected_org_slug?.trim() || claims.org_slug;

    const { data, error } = await client.rpc('build_tenant_bootstrap', {
      p_expected_org_slug: expectedOrgSlug,
    });

    if (error || !data || data.length === 0) {
      return new Response(JSON.stringify({ error: 'Tenant bootstrap could not be resolved' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const row = data[0];

    return new Response(JSON.stringify({
      session: {
        organization: {
          id: row.organization_id,
          slug: row.org_slug,
          displayName: row.org_display_name,
          status: row.org_status,
          supportEmail: row.org_support_email,
        },
        profile: {
          id: row.profile_id,
          organizationId: row.organization_id,
          organizationSlug: row.org_slug,
          role: row.profile_role,
          username: row.profile_username,
          displayName: row.profile_display_name,
          email: row.profile_email,
          clientId: row.profile_client_id,
          isActive: true,
        },
        claims: {
          sub: user.id,
          organization_id: claims.organization_id,
          org_slug: claims.org_slug,
          org_role: claims.org_role,
          platform_role: claims.platform_role ?? null,
          support_grant_id: claims.support_grant_id ?? null,
        },
        navigation: {
          shell: row.profile_role,
          initialRoute: row.initial_route,
        },
      },
      branding: {
        name: row.branding_display_name ?? row.org_display_name,
        logoUrl: row.branding_logo_url ?? '',
        colors: {
          primary: row.primary_color ?? '#1d4ed8',
          secondary: row.secondary_color ?? '#eff6ff',
          accent: row.accent_color ?? '#f97316',
          surface: row.surface_color ?? '#ffffff',
          text: row.text_color ?? '#0f172a',
          mutedText: row.muted_text_color ?? '#475569',
          border: row.border_color ?? '#cbd5e1',
        },
        fonts: {
          heading: row.heading_font ?? 'Inter',
          body: row.body_font ?? 'Inter',
          headingFallback: 'System',
          bodyFallback: 'System',
        },
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('bootstrap-tenant-session failed', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
