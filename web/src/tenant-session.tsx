import * as React from 'react';
import type { ResolveLoginContextResponse, TenantBootstrapState } from '../../shared';
import { sampleBootstraps } from './sample-org-data';

type TenantSessionState = {
  selectedOrgSlug: string | null;
  loginContext: ResolveLoginContextResponse | null;
  bootstrap: TenantBootstrapState | null;
  selectOrg: (orgSlug: string) => void;
  setLoginContext: (context: ResolveLoginContextResponse | null) => void;
  signInAsRoleDemo: (role: 'admin' | 'driver' | 'client') => void;
  signOut: () => void;
};

const TenantSessionContext = React.createContext<TenantSessionState | undefined>(undefined);

export function TenantSessionProvider({ children }: { children: React.ReactNode }) {
  const [selectedOrgSlug, setSelectedOrgSlug] = React.useState<string | null>(null);
  const [loginContext, setLoginContext] = React.useState<ResolveLoginContextResponse | null>(null);
  const [bootstrap, setBootstrap] = React.useState<TenantBootstrapState | null>(null);

  const selectOrg = React.useCallback((orgSlug: string) => {
    setSelectedOrgSlug(orgSlug);
    setLoginContext(null);
    setBootstrap(null);
  }, []);

  const signInAsRoleDemo = React.useCallback((role: 'admin' | 'driver' | 'client') => {
    if (!selectedOrgSlug)
      return;
    const match = sampleBootstraps[`${selectedOrgSlug}:${role}`];
    if (!match)
      return;
    setBootstrap(match);
  }, [selectedOrgSlug]);

  const signOut = React.useCallback(() => {
    setBootstrap(null);
    setLoginContext(null);
  }, []);

  return (
    <TenantSessionContext.Provider
      value={{
        selectedOrgSlug,
        loginContext,
        bootstrap,
        selectOrg,
        setLoginContext,
        signInAsRoleDemo,
        signOut,
      }}
    >
      {children}
    </TenantSessionContext.Provider>
  );
}

export function useTenantSession() {
  const context = React.useContext(TenantSessionContext);
  if (!context)
    throw new Error('useTenantSession must be used within TenantSessionProvider');
  return context;
}
