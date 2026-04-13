import { createClient } from '@supabase/supabase-js';
import Env from 'env';

import { storage } from '@/lib/storage';

// MMKV-backed storage adapter — no 2048-byte limit unlike expo-secure-store
const MMKVStorageAdapter = {
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => { storage.remove(key); },
};

export const supabase = createClient(
  Env.EXPO_PUBLIC_SUPABASE_URL,
  Env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: MMKVStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // required for React Native
    },
  },
);
