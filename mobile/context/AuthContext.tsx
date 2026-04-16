import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {
  type ResolveLoginContextResponse,
  type TenantBootstrapResponse,
  type TenantBootstrapState,
} from '../../shared/tenant-types';
import {
  toMobileUserViewModel,
  type MobileUserViewModel,
} from '../constants/mobile-view-models';
import type { OrgBranding } from '../constants/tenants';
import {
  bootstrapTenantSession,
  signInWithPassword,
} from '../constants/supabase';
import { clearTenantOperationalDataCache } from '../constants/tenant-operational-data';

const STORAGE_KEY = '@lonestar-tenant:sessionBootstrap';

function deriveBrandingFromBootstrap(response: TenantBootstrapResponse): OrgBranding {
  const b = response.branding;
  return {
    name: b.name,
    logoInitials: b.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase(),
    tagline: '',
    theme: {
      primary: b.colors.primary,
      primaryForeground: '#FFFFFF',
      accent: b.colors.accent,
      accentForeground: '#FFFFFF',
      background: b.colors.surface,
      foreground: b.colors.text,
      card: '#FFFFFF',
      mutedForeground: b.colors.mutedText,
      border: b.colors.border,
      destructive: '#C0392B',
    },
    radius: 8,
  };
}

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  loginContext: ResolveLoginContextResponse;
  bootstrap: TenantBootstrapState;
  orgBranding: OrgBranding;
}

interface AuthContextValue {
  accessToken: string | null;
  loginContext: ResolveLoginContextResponse | null;
  bootstrap: TenantBootstrapState | null;
  orgBranding: OrgBranding | null;
  user: MobileUserViewModel | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<MobileUserViewModel | null>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [loginContext, setLoginContext] = React.useState<ResolveLoginContextResponse | null>(null);
  const [bootstrap, setBootstrap] = React.useState<TenantBootstrapState | null>(null);
  const [orgBranding, setOrgBranding] = React.useState<OrgBranding | null>(null);
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
            setOrgBranding(session.orgBranding ?? null);
          } catch {
            void AsyncStorage.removeItem(STORAGE_KEY);
          }
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = React.useCallback(
    async (email: string, password: string): Promise<MobileUserViewModel | null> => {
      const authSession = await signInWithPassword(email.trim(), password);
      const bootstrapResponse = await bootstrapTenantSession(authSession.access_token, {
        expectedOrgSlug: undefined,
      });
      const branding = deriveBrandingFromBootstrap(bootstrapResponse);
      const lc: ResolveLoginContextResponse = {
        organization: bootstrapResponse.session.organization,
        resolvedEmail: email.trim(),
        resolvedRole: bootstrapResponse.session.profile.role,
        loginIdentifierType: 'email',
        brandingDisplayName: bootstrapResponse.branding.name,
      };
      const session: StoredSession = {
        accessToken: authSession.access_token,
        refreshToken: authSession.refresh_token,
        loginContext: lc,
        bootstrap: bootstrapResponse.session,
        orgBranding: branding,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setAccessToken(authSession.access_token);
      setLoginContext(lc);
      setBootstrap(bootstrapResponse.session);
      setOrgBranding(branding);
      return toMobileUserViewModel(bootstrapResponse.session, email.trim());
    },
    [],
  );

  const signOut = React.useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    clearTenantOperationalDataCache();
    setAccessToken(null);
    setLoginContext(null);
    setBootstrap(null);
    setOrgBranding(null);
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, loginContext, bootstrap, orgBranding, user, isLoading, signIn, signOut }}>
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
