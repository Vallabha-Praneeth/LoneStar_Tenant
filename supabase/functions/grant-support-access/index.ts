import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GrantSupportAccessPayload {
  organization_id: string;
  reason: string;
  starts_at: string;
  expires_at: string;
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

    const body = (await req.json()) as GrantSupportAccessPayload;
    if (!body.organization_id?.trim() || !body.reason?.trim() || !body.starts_at || !body.expires_at) {
      return new Response(JSON.stringify({ error: 'organization_id, reason, starts_at, and expires_at are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const jwt = authHeader.replace('Bearer ', '');

    const callerClient = createClient(supabaseUrl, anonKey);
    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser(jwt);

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const platformRole = caller.app_metadata?.platform_role as string | undefined;
    if (!platformRole || !['support', 'ops', 'super_admin'].includes(platformRole)) {
      return new Response(JSON.stringify({ error: 'Only platform operators can request support access' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: grant, error: grantError } = await adminClient
      .from('support_access_grants')
      .insert({
        organization_id: body.organization_id.trim(),
        requested_by: caller.id,
        reason: body.reason.trim(),
        status: 'requested',
        starts_at: body.starts_at,
        expires_at: body.expires_at,
      })
      .select('*')
      .single();

    if (grantError) {
      return new Response(JSON.stringify({ error: grantError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await adminClient.from('support_access_audit').insert({
      grant_id: grant.id,
      organization_id: grant.organization_id,
      actor_user_id: caller.id,
      action: 'grant_requested',
      target_type: 'organization',
      target_id: grant.organization_id,
      metadata: { platform_role: platformRole },
    });

    return new Response(JSON.stringify({ grant }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('grant-support-access failed', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
