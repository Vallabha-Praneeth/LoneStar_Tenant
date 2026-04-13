import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateTenantUserPayload {
  organization_id: string;
  role: 'admin' | 'driver' | 'client';
  username: string;
  display_name: string;
  password: string;
  email?: string;
  client_id?: string;
}

function validate(body: CreateTenantUserPayload): string | null {
  if (!body.organization_id?.trim())
    return 'organization_id is required';
  if (!body.role)
    return 'role is required';
  if (!body.username?.trim())
    return 'username is required';
  if (!body.display_name?.trim())
    return 'display_name is required';
  if (!body.password || body.password.length < 6)
    return 'password must be at least 6 characters';
  if (body.role === 'client' && !body.client_id?.trim())
    return 'client_id is required for client users';
  return null;
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

    const body = (await req.json()) as CreateTenantUserPayload;
    const validationError = validate(body);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const callerOrg = caller.app_metadata?.organization_id as string | undefined;
    const callerRole = caller.app_metadata?.org_role as string | undefined;
    if (callerRole !== 'admin' || callerOrg !== body.organization_id) {
      return new Response(JSON.stringify({ error: 'Only a tenant admin can create users in their own organization' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const email = body.email?.trim() || `${body.username.trim()}@${callerOrg}.tenant.local`;

    const { data: orgRow, error: orgError } = await adminClient
      .from('organizations')
      .select('slug')
      .eq('id', body.organization_id)
      .single();

    if (orgError || !orgRow) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
      app_metadata: {
        organization_id: body.organization_id,
        org_slug: orgRow.slug,
        org_role: body.role,
      },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = authData.user.id;
    const profilePayload: Record<string, unknown> = {
      id: userId,
      organization_id: body.organization_id,
      role: body.role,
      username: body.username.trim(),
      display_name: body.display_name.trim(),
      email,
      is_active: true,
    };

    if (body.client_id)
      profilePayload.client_id = body.client_id.trim();

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .insert(profilePayload)
      .select('id, organization_id, role, username, display_name, email')
      .single();

    if (profileError) {
      await adminClient.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.role === 'driver') {
      await adminClient.from('drivers').insert({
        organization_id: body.organization_id,
        profile_id: userId,
      });
    }

    return new Response(JSON.stringify({ user: profile }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('create-tenant-user failed', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
