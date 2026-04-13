export interface OrganizationBranding {
  id: string;
  organizationId: string;
  displayName: string;
  logoUrl: string;
  colors: BrandColorSet;
  fonts: BrandFontSet;
}

export interface BrandColorSet {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
}

export interface BrandFontSet {
  heading: string;
  body: string;
  headingFallback?: string;
  bodyFallback?: string;
}

export interface BrandTheme {
  name: string;
  logoUrl: string;
  colors: BrandColorSet;
  fonts: BrandFontSet;
}
