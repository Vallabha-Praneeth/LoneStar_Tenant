import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {
  type ResolveLoginContextResponse,
  type TenantBootstrapState,
} from '../../shared/tenant-types';
import {
  toMobileUserViewModel,
  type MobileUserViewModel,
} from '../constants/mobile-view-models';
import type { UserRole } from '../constants/mockData';
import {
  bootstrapTenantSession,
  resolveLoginContext,
  signInWithPassword,
} from '../constants/supabase';
import { clearTenantOperationalDataCache } from '../constants/tenant-operational-data';

const STORAGE_KEY = '@lonestar-tenant:sessionBootstrap';

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  loginContext: ResolveLoginContextResponse;
  bootstrap: TenantBootstrapState;
}

interface AuthContextValue {
  accessToken: string | null;
  /**
   * Result of resolve-login-context (mocked). Null until signed in.
   * Exposed so the next step can swap the mock resolver for a real Supabase call.
   */
  loginContext: ResolveLoginContextResponse | null;
  /**
   * Result of bootstrap-tenant-session (mocked). Null until signed in.
   * Exposed so the next step can swap the mock resolver for a real Supabase call.
   */
  bootstrap: TenantBootstrapState | null;
  /** Derived view model for screens. Null until signed in. */
  user: MobileUserViewModel | null;
  isLoading: boolean;
  signIn: (role: UserRole, orgSlug: string, password: string) => Promise<MobileUserViewModel | null>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [loginContext, setLoginContext] = React.useState<ResolveLoginContextResponse | null>(null);
  const [bootstrap, setBootstrap] = React.useState<TenantBootstrapState | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const user = React.useMemo(
    () =>
      bootstrap && loginContext
        ? toMobileUserViewModel(bootstrap, loginContext.resolvedEmail)
        : null,
    [bootstrap, loginContext],
  );

  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const session = JSON.parse(raw) as StoredSession;
            setAccessToken(session.accessToken);
            setLoginContext(session.loginContext);
            setBootstrap(session.bootstrap);
          } catch {
            void AsyncStorage.removeItem(STORAGE_KEY);
          }
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = React.useCallback(
    async (role: UserRole, orgSlug: string, password: string): Promise<MobileUserViewModel | null> => {
      const loginIdentifier = `${role}@${orgSlug}.demo`;
      let lc: ResolveLoginContextResponse;

      try {
        lc = await resolveLoginContext({ orgSlug, loginIdentifier });
      } catch (error) {
        if (error instanceof Error && error.message === 'Organization or login could not be resolved.') {
          return null;
        }
        throw error;
      }

      const authSession = await signInWithPassword(lc.resolvedEmail, password);
      const bootstrapResponse = await bootstrapTenantSession(authSession.access_token, {
        expectedOrgSlug: orgSlug,
      });
      const session: StoredSession = {
        accessToken: authSession.access_token,
        refreshToken: authSession.refresh_token,
        loginContext: lc,
        bootstrap: bootstrapResponse.session,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setAccessToken(authSession.access_token);
      setLoginContext(lc);
      setBootstrap(bootstrapResponse.session);
      return toMobileUserViewModel(bootstrapResponse.session, lc.resolvedEmail);
    },
    [],
  );

  const signOut = React.useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    clearTenantOperationalDataCache();
    setAccessToken(null);
    setLoginContext(null);
    setBootstrap(null);
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, loginContext, bootstrap, user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
