import type { LoginFormProps } from './components/login-form';

import type { Profile } from '@/lib/types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { FocusAwareStatusBar } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { LoginForm } from './components/login-form';
import { useAuthStore } from './use-auth-store';

export function LoginScreen() {
  const signIn = useAuthStore.use.signIn();
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit: LoginFormProps['onSubmit'] = async ({ username, password }) => {
    setError(null);
    try {
      let email: string;

      if (username.includes('@')) {
        // Direct email login (admin/client)
        email = username;
      }
      else {
        // Username login — resolve via RPC (any role)
        const { data: resolvedEmail, error: rpcError } = await supabase.rpc(
          'get_auth_email_by_username',
          { p_username: username, p_role: null },
        );
        if (rpcError || !resolvedEmail) {
          setError('Invalid username or password.');
          return;
        }
        email = resolvedEmail;
      }

      // Sign in with resolved email + password
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError || !data.session) {
        setError('Invalid username or password.');
        return;
      }

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (profileError || !profile) {
        setError('Could not load profile. Please try again.');
        return;
      }

      signIn(data.session, profile as Profile);

      // Route based on role
      const role = (profile as Profile).role;
      if (role === 'admin') {
        router.replace('/(app)/admin/campaigns');
      }
      else if (role === 'client') {
        router.replace('/(app)/client');
      }
      else {
        router.replace('/(app)');
      }
    }
    catch {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <FocusAwareStatusBar />
      <LoginForm onSubmit={onSubmit} error={error} />
    </>
  );
}
