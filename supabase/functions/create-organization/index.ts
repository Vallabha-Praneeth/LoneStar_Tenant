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
  inviteCode: string;
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

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await req.json()) as CreateOrgRequest;
    const { orgName, adminName, email, password, inviteCode } = body;

    if (!orgName?.trim() || !adminName?.trim() || !email?.trim() || !password) {
      return jsonResponse(
        { error: 'orgName, adminName, email, and password are required' },
        400,
      );
    }

    if (password.length < 8) {
      return jsonResponse({ error: 'Password must be at least 8 characters' }, 400);
    }

    if (!inviteCode?.trim()) {
      return jsonResponse({ error: 'Invite code is required' }, 400);
    }

    const normalizedInvite = inviteCode.trim().toUpperCase();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const orgId = crypto.randomUUID();
    const slug = slugify(orgName.trim());

    // 1. Atomically claim the invite code.
    //    The WHERE clause rejects missing, used, and expired codes.
    //    No row updated → invite is not valid for org creation.
    const { data: claimedInvite, error: claimError } = await admin
      .from('organization_invite_codes')
      .update({
        used_at: new Date().toISOString(),
      })
      .eq('code', normalizedInvite)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .select('id')
      .maybeSingle();

    if (claimError) {
      return jsonResponse({ error: `Invite validation failed: ${claimError.message}` }, 400);
    }

    if (!claimedInvite) {
      // Determine the exact reason so the caller sees a useful error.
      const { data: existing } = await admin
        .from('organization_invite_codes')
        .select('used_at, expires_at')
        .eq('code', normalizedInvite)
        .maybeSingle();

      if (!existing) {
        return jsonResponse({ error: 'Invalid invite code.' }, 400);
      }
      if (existing.used_at) {
        return jsonResponse({ error: 'This invite code has already been used.' }, 400);
      }
      if (new Date(existing.expires_at).getTime() <= Date.now()) {
        return jsonResponse({ error: 'This invite code has expired.' }, 400);
      }
      return jsonResponse({ error: 'Invite code is not valid.' }, 400);
    }

    const inviteId = claimedInvite.id as string;

    const failWithCleanup = async (
      baseMessage: string,
      cleanupSteps: Array<{ label: string; run: () => Promise<void> }>,
    ): Promise<never> => {
      const cleanupFailures: string[] = [];

      for (const step of cleanupSteps) {
        try {
          await step.run();
        } catch (cleanupError) {
          cleanupFailures.push(`${step.label}: ${getErrorMessage(cleanupError)}`);
        }
      }

      if (cleanupFailures.length > 0) {
        console.error('create-organization cleanup failed', {
          baseMessage,
          cleanupFailures,
          orgId,
          inviteId,
        });
        throw new Error(`${baseMessage} (cleanup_failed: ${cleanupFailures.join(' | ')})`);
      }

      throw new Error(baseMessage);
    };

    // Helper to release the invite if any downstream step fails.
    const releaseInvite = async () => {
      const { data, error } = await admin
        .from('organization_invite_codes')
        .update({
          used_at: null,
          used_by_org_id: null,
          used_by_org_name: null,
        })
        .eq('id', inviteId)
        .select('id')
        .maybeSingle();

      if (error) {
        throw new Error(`failed to release invite claim: ${error.message}`);
      }
      if (!data) {
        throw new Error('failed to release invite claim: invite row not found');
      }
    };

    const deleteOrganization = async () => {
      const { data, error } = await admin
        .from('organizations')
        .delete()
        .eq('id', orgId)
        .select('id')
        .maybeSingle();

      if (error) {
        throw new Error(`failed to delete organization: ${error.message}`);
      }
      if (!data) {
        throw new Error('failed to delete organization: row not found');
      }
    };

    const deleteBranding = async () => {
      const { data, error } = await admin
        .from('organization_branding')
        .delete()
        .eq('organization_id', orgId)
        .select('id')
        .maybeSingle();

      if (error) {
        throw new Error(`failed to delete organization branding: ${error.message}`);
      }
      if (!data) {
        throw new Error('failed to delete organization branding: row not found');
      }
    };

    // 2. Check slug is not taken.
    const { data: existing } = await admin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      try {
        await releaseInvite();
      } catch (cleanupError) {
        console.error('create-organization cleanup failed', {
          baseMessage: `slug conflict for "${slug}"`,
          cleanupFailures: [`release_invite: ${getErrorMessage(cleanupError)}`],
          orgId,
          inviteId,
        });
        throw new Error(
          `An organization with the slug "${slug}" already exists, and invite cleanup failed (${getErrorMessage(cleanupError)}).`,
        );
      }

      return jsonResponse(
        {
          error: `An organization with the slug "${slug}" already exists. Try a slightly different name.`,
        },
        409,
      );
    }

    // 3. Create organization.
    const { error: orgError } = await admin.from('organizations').insert({
      id: orgId,
      slug,
      legal_name: orgName.trim(),
      display_name: orgName.trim(),
      status: 'active',
      support_email: email.trim(),
    });

    if (orgError) {
      await failWithCleanup(`Failed to create organization: ${orgError.message}`, [
        { label: 'release_invite', run: releaseInvite },
      ]);
    }

    // 3b. Stamp invite usage metadata after the organization row exists.
    const { data: stampedInvite, error: stampInviteError } = await admin
      .from('organization_invite_codes')
      .update({
        used_by_org_id: orgId,
        used_by_org_name: orgName.trim(),
      })
      .eq('id', inviteId)
      .select('id')
      .maybeSingle();

    if (stampInviteError || !stampedInvite) {
      await failWithCleanup(
        `Failed to record invite usage metadata: ${stampInviteError?.message ?? 'invite row missing'}`,
        [
          { label: 'delete_organization', run: deleteOrganization },
          { label: 'release_invite', run: releaseInvite },
        ],
      );
    }

    // 4. Create default branding. logo_url is intentionally NULL — branding
    //    upload UX is out of scope for Phase 1 (see migration 013).
    const { error: brandingError } = await admin.from('organization_branding').insert({
      organization_id: orgId,
      display_name: orgName.trim(),
      logo_url: null,
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

    if (brandingError) {
      await failWithCleanup(
        `Failed to create organization branding: ${brandingError.message}`,
        [
          { label: 'delete_organization', run: deleteOrganization },
          { label: 'release_invite', run: releaseInvite },
        ],
      );
    }

    // 5. Create auth user with correct app_metadata.
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
      await failWithCleanup(`Failed to create admin user: ${authError?.message}`, [
        { label: 'delete_branding', run: deleteBranding },
        { label: 'delete_organization', run: deleteOrganization },
        { label: 'release_invite', run: releaseInvite },
      ]);
    }

    // 6. Create profile.
    const { error: profileError } = await admin.from('profiles').insert({
      id: authData.user.id,
      organization_id: orgId,
      role: 'admin',
      display_name: adminName.trim(),
      username: adminName.trim().toLowerCase().replace(/\s+/g, '.'),
      email: email.trim(),
    });

    if (profileError) {
      await failWithCleanup(`Failed to create admin profile: ${profileError.message}`, [
        {
          label: 'delete_auth_user',
          run: async () => {
            const { error } = await admin.auth.admin.deleteUser(authData.user.id);
            if (error) {
              throw new Error(`failed to delete auth user: ${error.message}`);
            }
          },
        },
        { label: 'delete_branding', run: deleteBranding },
        { label: 'delete_organization', run: deleteOrganization },
        { label: 'release_invite', run: releaseInvite },
      ]);
    }

    return jsonResponse({ ok: true, orgId, slug }, 201);
  } catch (error) {
    console.error('create-organization failed', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      500,
    );
  }
});
