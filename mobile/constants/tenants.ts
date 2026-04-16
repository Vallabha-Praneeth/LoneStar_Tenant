export type TenantId = 'lonestar' | 'skyline';

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
  id: TenantId;
  name: string;
  tagline: string;
  logoInitials: string;
  theme: TenantTheme;
  fontFamily: string;
  radius: number;
}

export const TENANTS: Record<TenantId, TenantConfig> = {
  lonestar: {
    id: 'lonestar',
    name: 'LoneStar AdTruck',
    tagline: 'Mobile advertising campaign management',
    logoInitials: 'LA',
    theme: {
      primary: '#B8460B',
      primaryForeground: '#FFFFFF',
      accent: '#E8832A',
      accentForeground: '#1A0A00',
      background: '#F9F6F2',
      foreground: '#1C1410',
      card: '#FFFFFF',
      mutedForeground: '#8A7A70',
      border: '#E2D9D0',
      destructive: '#C0392B',
    },
    fontFamily: 'Inter_600SemiBold',
    radius: 6,
  },
  skyline: {
    id: 'skyline',
    name: 'Skyline Campaign Ops',
    tagline: 'Precision campaign operations and proof delivery',
    logoInitials: 'SC',
    theme: {
      primary: '#1B3A5C',
      primaryForeground: '#FFFFFF',
      accent: '#2E7DC5',
      accentForeground: '#FFFFFF',
      background: '#F4F7FB',
      foreground: '#0F1F30',
      card: '#FFFFFF',
      mutedForeground: '#6B7E90',
      border: '#D5E0EC',
      destructive: '#B53030',
    },
    fontFamily: 'Inter_600SemiBold',
    radius: 8,
  },
};

export const TENANT_LIST: TenantConfig[] = Object.values(TENANTS);
