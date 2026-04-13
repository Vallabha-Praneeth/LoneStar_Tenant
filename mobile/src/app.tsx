import * as React from 'react';
import { BrandThemeProvider } from './branding';
import { OrgRouter } from './org-router';
import { TenantSessionProvider } from './tenant-session';

export function OrgMobileApp() {
  return (
    <BrandThemeProvider>
      <TenantSessionProvider>
        <OrgRouter />
      </TenantSessionProvider>
    </BrandThemeProvider>
  );
}
