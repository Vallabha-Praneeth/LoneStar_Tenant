import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function requireSuperAdmin(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return { error: jsonResponse({ error: 'Missing authorization header' }, 401) };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const jwt = authHeader.replace('Bearer ', '');

  const callerClient = createClient(supabaseUrl, anonKey);
  const {
    data: { user: caller },
    error: callerError,
  } = await callerClient.auth.getUser(jwt);

  if (callerError || !caller) {
    return { error: jsonResponse({ error: 'Invalid or expired token' }, 401) };
  }

  const platformRole = caller.app_metadata?.platform_role as string | undefined;
  if (platformRole !== 'super_admin') {
    return { error: jsonResponse({ error: 'Super-admin access required' }, 403) };
  }

  return { caller };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authResult = await requireSuperAdmin(req);
    if ('error' in authResult) return authResult.error;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await admin
      .from('organization_invite_codes')
      .select(
        'id, code, note, expires_at, used_at, used_by_org_id, used_by_org_name, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    const now = Date.now();
    const invites = (data ?? []).map((row) => {
      let status: 'active' | 'used' | 'expired';
      if (row.used_at) {
        status = 'used';
      } else if (new Date(row.expires_at).getTime() <= now) {
        status = 'expired';
      } else {
        status = 'active';
      }

      return {
        id: row.id,
        code: row.code,
        note: row.note,
        status,
        expires_at: row.expires_at,
        used_at: row.used_at,
        used_by_org_id: row.used_by_org_id,
        used_by_org_name: row.used_by_org_name,
        created_at: row.created_at,
      };
    });

    return jsonResponse({ invites }, 200);
  } catch (error) {
    console.error('list-invite-codes failed', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      500,
    );
  }
});
