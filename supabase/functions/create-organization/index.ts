import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateOrgRequest {
  orgName: string;
  adminName: string;
  email: string;
  password: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as CreateOrgRequest;
    const { orgName, adminName, email, password } = body;

    if (!orgName?.trim() || !adminName?.trim() || !email?.trim() || !password) {
      return new Response(JSON.stringify({ error: 'orgName, adminName, email, and password are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const orgId = crypto.randomUUID();
    const slug = slugify(orgName.trim());

    // 1. Check slug is not taken
    const { data: existing } = await admin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: `An organization with the slug "${slug}" already exists. Try a slightly different name.` }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 2. Create organization
    const { error: orgError } = await admin.from('organizations').insert({
      id: orgId,
      slug,
      legal_name: orgName.trim(),
      display_name: orgName.trim(),
      status: 'active',
      support_email: email.trim(),
    });

    if (orgError) throw new Error(`Failed to create organization: ${orgError.message}`);

    // 3. Create default branding
    await admin.from('organization_branding').insert({
      organization_id: orgId,
      display_name: orgName.trim(),
      primary_color: '#1B3A5C',
      secondary_color: '#EFF6FF',
      accent_color: '#2E7DC5',
      surface_color: '#F4F7FB',
      text_color: '#0F1F30',
      muted_text_color: '#6B7E90',
      border_color: '#D5E0EC',
      heading_font: 'Inter',
      body_font: 'Inter',
    });

    // 4. Create auth user with correct app_metadata
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      app_metadata: {
        organization_id: orgId,
        org_slug: slug,
        org_role: 'admin',
      },
      user_metadata: {
        full_name: adminName.trim(),
      },
    });

    if (authError || !authData.user) {
      // Roll back org
      await admin.from('organizations').delete().eq('id', orgId);
      throw new Error(`Failed to create admin user: ${authError?.message}`);
    }

    // 5. Create profile
    const { error: profileError } = await admin.from('profiles').insert({
      id: authData.user.id,
      organization_id: orgId,
      role: 'admin',
      display_name: adminName.trim(),
      username: adminName.trim().toLowerCase().replace(/\s+/g, '.'),
      email: email.trim(),
    });

    if (profileError) {
      // Roll back auth user and org
      await admin.auth.admin.deleteUser(authData.user.id);
      await admin.from('organizations').delete().eq('id', orgId);
      throw new Error(`Failed to create admin profile: ${profileError.message}`);
    }

    return new Response(JSON.stringify({ ok: true, orgId, slug }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('create-organization failed', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
