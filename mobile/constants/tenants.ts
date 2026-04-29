export interface TenantTheme {
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  card: string;
  mutedForeground: string;
  border: string;
  destructive: string;
}

export interface TenantConfig {
  id: string;
  name: string;
  tagline: string;
  logoInitials: string;
  logoUrl: string;
  theme: TenantTheme;
  fontFamily: string;
  radius: number;
}

// OrgBranding is what AuthContext derives from the bootstrap response
// and stores in session. TenantContext converts it to TenantConfig for screens.
export interface OrgBranding {
  name: string;
  tagline: string;
  logoInitials: string;
  logoUrl: string;
  theme: TenantTheme;
  radius: number;
}
