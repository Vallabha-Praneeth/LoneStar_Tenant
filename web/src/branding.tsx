import * as React from 'react';
import type { BrandTheme } from '../../shared';
import { brandingBySlug } from './sample-org-data';

type BrandThemeContextValue = {
  theme: BrandTheme;
  setThemeByOrgSlug: (orgSlug: string) => void;
};

const defaultTheme = brandingBySlug.lonestar;

const BrandThemeContext = React.createContext<BrandThemeContextValue | undefined>(undefined);

export function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<BrandTheme>(defaultTheme);

  const setThemeByOrgSlug = React.useCallback((orgSlug: string) => {
    setTheme(brandingBySlug[orgSlug] ?? defaultTheme);
  }, []);

  const value = React.useMemo(() => ({ theme, setThemeByOrgSlug }), [theme, setThemeByOrgSlug]);

  return (
    <BrandThemeContext.Provider value={value}>
      <div
        style={{
          minHeight: '100vh',
          background: theme.colors.secondary,
          color: theme.colors.text,
          fontFamily: `${theme.fonts.body}, ${theme.fonts.bodyFallback ?? 'sans-serif'}`,
        }}
      >
        {children}
      </div>
    </BrandThemeContext.Provider>
  );
}

export function useBrandTheme() {
  const context = React.useContext(BrandThemeContext);
  if (!context)
    throw new Error('useBrandTheme must be used within BrandThemeProvider');
  return context;
}
