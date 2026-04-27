import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendInviteRequest {
  note?: string | null;
  expires_in_days?: number;
}

const DEFAULT_EXPIRY_DAYS = 14;
const MAX_EXPIRY_DAYS = 60;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function generateCode(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
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

    const body = (await req.json().catch(() => ({}))) as SendInviteRequest;
    const days =
      typeof body.expires_in_days === 'number' &&
      body.expires_in_days > 0 &&
      body.expires_in_days <= MAX_EXPIRY_DAYS
        ? Math.floor(body.expires_in_days)
        : DEFAULT_EXPIRY_DAYS;

    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let attempt = 0;
    let inserted: { id: string; code: string; expires_at: string } | null = null;
    let lastError: unknown = null;
    while (attempt < 5 && !inserted) {
      attempt++;
      const code = generateCode();
      const { data, error } = await admin
        .from('organization_invite_codes')
        .insert({
          code,
          note: body.note?.trim() || null,
          created_by: authResult.caller.id,
          expires_at: expiresAt,
        })
        .select('id, code, expires_at')
        .single();

      if (!error && data) {
        inserted = data;
        break;
      }
      lastError = error;
      // Retry only for unique-collision cases; bail otherwise.
      if (error && !/duplicate key|unique/i.test(error.message)) {
        break;
      }
    }

    if (!inserted) {
      return jsonResponse(
        {
          error:
            lastError instanceof Error
              ? lastError.message
              : 'Failed to create invite code.',
        },
        500,
      );
    }

    return jsonResponse(
      {
        invite: {
          id: inserted.id,
          code: inserted.code,
          expires_at: inserted.expires_at,
        },
      },
      201,
    );
  } catch (error) {
    console.error('send-invite-code failed', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      500,
    );
  }
});
