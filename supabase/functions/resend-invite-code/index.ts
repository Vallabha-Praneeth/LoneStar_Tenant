import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResendInviteRequest {
  invite_id?: string;
  code?: string;
}

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

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authResult = await requireSuperAdmin(req);
    if ('error' in authResult) return authResult.error;

    const body = (await req.json().catch(() => ({}))) as ResendInviteRequest;
    if (!body.invite_id?.trim() && !body.code?.trim()) {
      return jsonResponse({ error: 'invite_id or code is required' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let query = admin
      .from('organization_invite_codes')
      .select('id, code, expires_at, used_at, used_by_org_id, used_by_org_name');

    if (body.invite_id?.trim()) {
      query = query.eq('id', body.invite_id.trim());
    } else if (body.code?.trim()) {
      query = query.eq('code', body.code.trim().toUpperCase());
    }

    const { data: invite, error } = await query.maybeSingle();

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }
    if (!invite) {
      return jsonResponse({ error: 'Invite not found.' }, 404);
    }
    if (invite.used_at) {
      return jsonResponse(
        {
          error:
            'This invite has already been used. In v1, a replacement code is not issued; send a new invite instead.',
          code: 'invite_already_used',
        },
        409,
      );
    }
    if (new Date(invite.expires_at).getTime() <= Date.now()) {
      return jsonResponse(
        {
          error:
            'This invite has expired. In v1, a replacement code is not issued; send a new invite instead.',
          code: 'invite_expired',
        },
        409,
      );
    }

    // v1 resend semantics: return the same active unused code unchanged.
    return jsonResponse(
      {
        invite: {
          id: invite.id,
          code: invite.code,
          expires_at: invite.expires_at,
          used_at: invite.used_at,
        },
      },
      200,
    );
  } catch (error) {
    console.error('resend-invite-code failed', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      500,
    );
  }
});
