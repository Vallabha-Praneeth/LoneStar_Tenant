import type { Session } from '@supabase/supabase-js';

import type { Profile } from '@/lib/types';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { createSelectors } from '@/lib/utils';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  status: 'idle' | 'signOut' | 'signIn';
  signIn: (session: Session, profile: Profile) => void;
  signOut: () => Promise<void>;
  hydrate: () => void;
};

const _useAuthStore = create<AuthState>(set => ({
  status: 'idle',
  session: null,
  profile: null,

  signIn: (session, profile) => {
    set({ status: 'signIn', session, profile });
  },

  signOut: async () => {
    set({ status: 'signOut', session: null, profile: null });
    await supabase.auth.signOut();
  },

  hydrate: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        set({ status: 'signOut' });
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) {
        set({ status: 'signOut' });
        return;
      }

      set({ status: 'signIn', session, profile: profile as Profile });
    }
    catch {
      set({ status: 'signOut' });
    }
  },
}));

export const useAuthStore = createSelectors(_useAuthStore);

export const signOut = () => _useAuthStore.getState().signOut() as Promise<void>;
export const hydrateAuth = () => _useAuthStore.getState().hydrate();
