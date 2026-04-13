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
  const [theme, setTheme] = React.useState(defaultTheme);

  const setThemeByOrgSlug = React.useCallback((orgSlug: string) => {
    setTheme(brandingBySlug[orgSlug] ?? defaultTheme);
  }, []);

  return (
    <BrandThemeContext.Provider value={{ theme, setThemeByOrgSlug }}>
      {children}
    </BrandThemeContext.Provider>
  );
}

export function useBrandTheme() {
  const context = React.useContext(BrandThemeContext);
  if (!context)
    throw new Error('useBrandTheme must be used within BrandThemeProvider');
  return context;
}
