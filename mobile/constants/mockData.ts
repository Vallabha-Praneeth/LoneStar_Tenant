import type {
  ResolveLoginContextResponse,
  TenantBootstrapOrganization,
  TenantBootstrapState,
} from '../../shared/tenant-types';

export type UserRole = 'admin' | 'driver' | 'client';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  avatarInitials: string;
}

export interface Campaign {
  id: string;
  clientId?: string | null;
  name: string;
  client: string;
  status: 'active' | 'scheduled' | 'completed' | 'paused';
  startDate: string;
  endDate: string;
  routes: number;
  proofsRequired: number;
  proofsSubmitted: number;
  description: string;
  tenantId: string;
  assignedDriverIds: string[];
}

export interface Proof {
  id: string;
  campaignId: string;
  campaignName: string;
  driverId: string;
  driverName: string;
  submittedAt: string;
  capturedAt?: string | null;
  location: string;
  status: 'uploaded';
  notes: string;
  storagePath?: string | null;
}

export interface Shift {
  id: string;
  campaignId: string;
  campaignName: string;
  driverId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  status: 'pending' | 'active' | 'completed';
  startOdometer: number | null;
  endOdometer: number | null;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  tenantId: string;
  avatarInitials: string;
  status: 'active' | 'inactive';
  activeCampaigns: number;
  totalShifts: number;
  totalProofs: number;
  licenseClass: string;
}

export interface Client {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  tenantId: string;
  avatarInitials: string;
  status: 'active' | 'inactive';
  activeCampaigns: number;
  totalCampaigns: number;
  industry: string;
}

export interface Route {
  id: string;
  campaignId: string;
  campaignName: string;
  name: string;
  description: string;
  startPoint: string;
  endPoint: string;
  estimatedMiles: number;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  status: 'active' | 'scheduled' | 'completed';
  tenantId: string;
}

export interface CostType {
  id: string;
  name: string;
  isActive: boolean;
}

export interface CampaignCost {
  id: string;
  campaignId: string;
  costTypeId: string;
  costTypeName: string;
  amount: number;
  notes: string;
  recordedAt: string;
}

export interface AnalyticsSummary {
  tenantId: string;
  period: string;
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalProofs: number;
  uploadedProofs: number;
  totalMilesDriven: number;
  activeDrivers: number;
  activeClients: number;
  campaignCompletionRate: number;
  topCampaigns: { name: string; proofs: number; completion: number }[];
  proofsByDay: { date: string; count: number }[];
}

export const MOCK_USERS: MockUser[] = [
  { id: 'u-001', name: 'Garrett Flores', email: 'admin@lonestar.demo', role: 'admin', tenantId: 'lonestar', avatarInitials: 'GF' },
  { id: 'u-002', name: 'Marcus Webb', email: 'driver@lonestar.demo', role: 'driver', tenantId: 'lonestar', avatarInitials: 'MW' },
  { id: 'u-003', name: 'Priya Nair', email: 'client@lonestar.demo', role: 'client', tenantId: 'lonestar', avatarInitials: 'PN' },
  { id: 'u-004', name: 'Dana Carlson', email: 'admin@skyline.demo', role: 'admin', tenantId: 'skyline', avatarInitials: 'DC' },
  { id: 'u-005', name: 'Tomas Rivera', email: 'driver@skyline.demo', role: 'driver', tenantId: 'skyline', avatarInitials: 'TR' },
  { id: 'u-006', name: 'Amelia Chen', email: 'client@skyline.demo', role: 'client', tenantId: 'skyline', avatarInitials: 'AC' },
];

export const DEMO_ACCOUNTS: {
  label: string;
  email: string;
  password: string;
  role: UserRole;
}[] = [
  { label: 'Admin', email: 'admin', password: 'demo', role: 'admin' },
  { label: 'Driver', email: 'driver', password: 'demo', role: 'driver' },
  { label: 'Client', email: 'client', password: 'demo', role: 'client' },
];

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'c-001',
    name: 'Q2 Downtown Blitz',
    client: 'Texaco Regional',
    status: 'active',
    startDate: '2026-04-01',
    endDate: '2026-05-31',
    routes: 8,
    proofsRequired: 240,
    proofsSubmitted: 87,
    description: 'High-visibility downtown route coverage across 8 assigned trucks. Daily proof submission required per checkpoint.',
    tenantId: 'lonestar',
    assignedDriverIds: ['u-002', 'd-001', 'd-002'],
  },
  {
    id: 'c-002',
    name: 'Spring Rodeo Push',
    client: 'Lone Star Beer Co.',
    status: 'active',
    startDate: '2026-03-20',
    endDate: '2026-04-20',
    routes: 5,
    proofsRequired: 150,
    proofsSubmitted: 143,
    description: 'Saturation coverage around the fairgrounds and surrounding neighborhoods for the rodeo season.',
    tenantId: 'lonestar',
    assignedDriverIds: ['u-002', 'd-003'],
  },
  {
    id: 'c-003',
    name: 'Highway 290 Corridor',
    client: "Buc-ee's Expansion",
    status: 'scheduled',
    startDate: '2026-05-01',
    endDate: '2026-06-30',
    routes: 12,
    proofsRequired: 360,
    proofsSubmitted: 0,
    description: 'Pre-launch corridor awareness campaign along Hwy 290 ahead of new location opening.',
    tenantId: 'lonestar',
    assignedDriverIds: [],
  },
  {
    id: 'c-006',
    name: 'Metro Ring Coverage',
    client: 'HealthFirst Network',
    status: 'active',
    startDate: '2026-04-05',
    endDate: '2026-05-05',
    routes: 10,
    proofsRequired: 300,
    proofsSubmitted: 112,
    description: 'Geo-targeted campaign covering commuter corridors across the metro ring road system.',
    tenantId: 'skyline',
    assignedDriverIds: ['u-005', 'd-004'],
  },
  {
    id: 'c-007',
    name: 'Airport Access Push',
    client: 'Premier Parking Co.',
    status: 'active',
    startDate: '2026-03-15',
    endDate: '2026-04-30',
    routes: 4,
    proofsRequired: 120,
    proofsSubmitted: 118,
    description: 'High-frequency coverage on all four airport access routes. Campaign nearing completion.',
    tenantId: 'skyline',
    assignedDriverIds: ['u-005'],
  },
];

export const MOCK_PROOFS: Proof[] = [
  {
    id: 'p-001',
    campaignId: 'c-001',
    campaignName: 'Q2 Downtown Blitz',
    driverId: 'u-002',
    driverName: 'Marcus Webb',
    submittedAt: '2026-04-14T08:45:00Z',
    location: 'Congress Ave & 6th St',
    status: 'uploaded',
    notes: 'Morning checkpoint capture.',
  },
  {
    id: 'p-002',
    campaignId: 'c-001',
    campaignName: 'Q2 Downtown Blitz',
    driverId: 'u-002',
    driverName: 'Marcus Webb',
    submittedAt: '2026-04-14T11:10:00Z',
    location: 'Warehouse District',
    status: 'uploaded',
    notes: 'Traffic-heavy corridor.',
  },
  {
    id: 'p-003',
    campaignId: 'c-006',
    campaignName: 'Metro Ring Coverage',
    driverId: 'u-005',
    driverName: 'Tomas Rivera',
    submittedAt: '2026-04-14T10:25:00Z',
    location: 'Ring Road East',
    status: 'uploaded',
    notes: 'Ring road east pass.',
  },
];

export const MOCK_SHIFTS: Shift[] = [
  {
    id: 's-001',
    campaignId: 'c-001',
    campaignName: 'Q2 Downtown Blitz',
    driverId: 'u-002',
    date: '2026-04-14',
    startTime: '08:00',
    endTime: null,
    status: 'active',
    startOdometer: 12450,
    endOdometer: null,
  },
  {
    id: 's-002',
    campaignId: 'c-006',
    campaignName: 'Metro Ring Coverage',
    driverId: 'u-005',
    date: '2026-04-13',
    startTime: '09:15',
    endTime: '16:40',
    status: 'completed',
    startOdometer: 8640,
    endOdometer: 8788,
  },
];

export const MOCK_DRIVERS: Driver[] = [
  {
    id: 'u-002',
    name: 'Marcus Webb',
    email: 'driver@lonestar.demo',
    phone: '+1 512 555 0101',
    tenantId: 'lonestar',
    avatarInitials: 'MW',
    status: 'active',
    activeCampaigns: 2,
    totalShifts: 42,
    totalProofs: 238,
    licenseClass: 'Class B',
  },
  {
    id: 'u-005',
    name: 'Tomas Rivera',
    email: 'driver@skyline.demo',
    phone: '+1 512 555 0105',
    tenantId: 'skyline',
    avatarInitials: 'TR',
    status: 'active',
    activeCampaigns: 2,
    totalShifts: 35,
    totalProofs: 191,
    licenseClass: 'Class A',
  },
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'cl-001',
    name: 'Texaco Regional',
    contactName: 'Nina Ortiz',
    email: 'nina@texaco.example',
    phone: '+1 512 555 0111',
    tenantId: 'lonestar',
    avatarInitials: 'TR',
    status: 'active',
    activeCampaigns: 1,
    totalCampaigns: 3,
    industry: 'Fuel Retail',
  },
  {
    id: 'cl-002',
    name: 'HealthFirst Network',
    contactName: 'Arjun Mehta',
    email: 'arjun@healthfirst.example',
    phone: '+1 512 555 0112',
    tenantId: 'skyline',
    avatarInitials: 'HN',
    status: 'active',
    activeCampaigns: 1,
    totalCampaigns: 2,
    industry: 'Healthcare',
  },
];

export const MOCK_ROUTES: Route[] = [
  {
    id: 'r-001',
    campaignId: 'c-001',
    campaignName: 'Q2 Downtown Blitz',
    name: 'Downtown Core Loop',
    description: 'Primary CBD coverage loop.',
    startPoint: 'Congress Ave',
    endPoint: 'Republic Square',
    estimatedMiles: 18,
    assignedDriverId: 'u-002',
    assignedDriverName: 'Marcus Webb',
    status: 'active',
    tenantId: 'lonestar',
  },
  {
    id: 'r-002',
    campaignId: 'c-006',
    campaignName: 'Metro Ring Coverage',
    name: 'Eastern Ring Sweep',
    description: 'Peak commuter corridor.',
    startPoint: 'Ring Road East',
    endPoint: 'North Connector',
    estimatedMiles: 26,
    assignedDriverId: 'u-005',
    assignedDriverName: 'Tomas Rivera',
    status: 'active',
    tenantId: 'skyline',
  },
];

export const MOCK_ANALYTICS: Record<string, AnalyticsSummary> = {
  lonestar: {
    tenantId: 'lonestar',
    period: 'Last 30 days',
    totalCampaigns: 3,
    activeCampaigns: 2,
    completedCampaigns: 0,
    totalProofs: 230,
    uploadedProofs: 230,
    totalMilesDriven: 1420,
    activeDrivers: 1,
    activeClients: 1,
    campaignCompletionRate: 58,
    topCampaigns: [
      { name: 'Q2 Downtown Blitz', proofs: 87, completion: 36 },
      { name: 'Spring Rodeo Push', proofs: 143, completion: 95 },
    ],
    proofsByDay: [
      { date: 'Apr 10', count: 21 },
      { date: 'Apr 11', count: 18 },
      { date: 'Apr 12', count: 25 },
      { date: 'Apr 13', count: 17 },
      { date: 'Apr 14', count: 23 },
    ],
  },
  skyline: {
    tenantId: 'skyline',
    period: 'Last 30 days',
    totalCampaigns: 2,
    activeCampaigns: 2,
    completedCampaigns: 0,
    totalProofs: 118,
    uploadedProofs: 118,
    totalMilesDriven: 980,
    activeDrivers: 1,
    activeClients: 1,
    campaignCompletionRate: 76,
    topCampaigns: [
      { name: 'Metro Ring Coverage', proofs: 112, completion: 37 },
      { name: 'Airport Access Push', proofs: 118, completion: 98 },
    ],
    proofsByDay: [
      { date: 'Apr 10', count: 9 },
      { date: 'Apr 11', count: 14 },
      { date: 'Apr 12', count: 11 },
      { date: 'Apr 13', count: 16 },
      { date: 'Apr 14', count: 13 },
    ],
  },
};

// ---------------------------------------------------------------------------
// Mock contract-shaped data — shaped for shared contract alignment.
// These mirror the data in MOCK_USERS / TENANTS but use the shared contract
// types so contexts can track state in the contract shape instead of mobile-
// only MockUser / TenantConfig.
// ---------------------------------------------------------------------------

/** Mock org summaries shaped like TenantBootstrapOrganization. */
export const MOCK_BOOTSTRAP_ORGS: Record<string, TenantBootstrapOrganization> = {
  lonestar: {
    id: 'lonestar',
    slug: 'lonestar',
    displayName: 'LoneStar AdTruck',
    status: 'active',
    supportEmail: null,
  },
  skyline: {
    id: 'skyline',
    slug: 'skyline',
    displayName: 'Skyline Campaign Ops',
    status: 'active',
    supportEmail: null,
  },
};

/** Mock ResolveLoginContextResponse keyed by `${orgSlug}:${role}`. */
export const MOCK_LOGIN_CONTEXTS: Record<string, ResolveLoginContextResponse> = {
  'lonestar:admin':  { organization: { id: 'lonestar', slug: 'lonestar', displayName: 'LoneStar AdTruck',    status: 'active' }, resolvedEmail: 'admin@lonestar.demo',  resolvedRole: 'admin',  loginIdentifierType: 'email' },
  'lonestar:driver': { organization: { id: 'lonestar', slug: 'lonestar', displayName: 'LoneStar AdTruck',    status: 'active' }, resolvedEmail: 'driver@lonestar.demo', resolvedRole: 'driver', loginIdentifierType: 'email' },
  'lonestar:client': { organization: { id: 'lonestar', slug: 'lonestar', displayName: 'LoneStar AdTruck',    status: 'active' }, resolvedEmail: 'client@lonestar.demo', resolvedRole: 'client', loginIdentifierType: 'email' },
  'skyline:admin':   { organization: { id: 'skyline', slug: 'skyline', displayName: 'Skyline Campaign Ops', status: 'active' }, resolvedEmail: 'admin@skyline.demo',   resolvedRole: 'admin',  loginIdentifierType: 'email' },
  'skyline:driver':  { organization: { id: 'skyline', slug: 'skyline', displayName: 'Skyline Campaign Ops', status: 'active' }, resolvedEmail: 'driver@skyline.demo',  resolvedRole: 'driver', loginIdentifierType: 'email' },
  'skyline:client':  { organization: { id: 'skyline', slug: 'skyline', displayName: 'Skyline Campaign Ops', status: 'active' }, resolvedEmail: 'client@skyline.demo',  resolvedRole: 'client', loginIdentifierType: 'email' },
};

/** Mock TenantBootstrapState keyed by `${orgSlug}:${role}`. */
export const MOCK_BOOTSTRAP_SESSIONS: Record<string, TenantBootstrapState> = {
  'lonestar:admin': {
    organization: MOCK_BOOTSTRAP_ORGS['lonestar'] as TenantBootstrapOrganization,
    profile: { id: 'u-001', organizationId: 'lonestar', organizationSlug: 'lonestar', role: 'admin',  username: 'admin@lonestar.demo',  displayName: 'Garrett Flores', email: 'admin@lonestar.demo',  clientId: null,    isActive: true },
    claims:   { sub: 'u-001', organization_id: 'lonestar', org_slug: 'lonestar', org_role: 'admin' },
    navigation: { shell: 'admin',  initialRoute: '/(admin)/home' },
  },
  'lonestar:driver': {
    organization: MOCK_BOOTSTRAP_ORGS['lonestar'] as TenantBootstrapOrganization,
    profile: { id: 'u-002', organizationId: 'lonestar', organizationSlug: 'lonestar', role: 'driver', username: 'driver@lonestar.demo', displayName: 'Marcus Webb',    email: 'driver@lonestar.demo', clientId: null,    isActive: true },
    claims:   { sub: 'u-002', organization_id: 'lonestar', org_slug: 'lonestar', org_role: 'driver' },
    navigation: { shell: 'driver', initialRoute: '/(driver)/home' },
  },
  'lonestar:client': {
    organization: MOCK_BOOTSTRAP_ORGS['lonestar'] as TenantBootstrapOrganization,
    profile: { id: 'u-003', organizationId: 'lonestar', organizationSlug: 'lonestar', role: 'client', username: 'client@lonestar.demo', displayName: 'Priya Nair',     email: 'client@lonestar.demo', clientId: 'cl-001', isActive: true },
    claims:   { sub: 'u-003', organization_id: 'lonestar', org_slug: 'lonestar', org_role: 'client' },
    navigation: { shell: 'client', initialRoute: '/(client)/home' },
  },
  'skyline:admin': {
    organization: MOCK_BOOTSTRAP_ORGS['skyline'] as TenantBootstrapOrganization,
    profile: { id: 'u-004', organizationId: 'skyline', organizationSlug: 'skyline', role: 'admin',  username: 'admin@skyline.demo',  displayName: 'Dana Carlson',   email: 'admin@skyline.demo',  clientId: null,    isActive: true },
    claims:   { sub: 'u-004', organization_id: 'skyline', org_slug: 'skyline', org_role: 'admin' },
    navigation: { shell: 'admin',  initialRoute: '/(admin)/home' },
  },
  'skyline:driver': {
    organization: MOCK_BOOTSTRAP_ORGS['skyline'] as TenantBootstrapOrganization,
    profile: { id: 'u-005', organizationId: 'skyline', organizationSlug: 'skyline', role: 'driver', username: 'driver@skyline.demo', displayName: 'Tomas Rivera',   email: 'driver@skyline.demo', clientId: null,    isActive: true },
    claims:   { sub: 'u-005', organization_id: 'skyline', org_slug: 'skyline', org_role: 'driver' },
    navigation: { shell: 'driver', initialRoute: '/(driver)/home' },
  },
  'skyline:client': {
    organization: MOCK_BOOTSTRAP_ORGS['skyline'] as TenantBootstrapOrganization,
    profile: { id: 'u-006', organizationId: 'skyline', organizationSlug: 'skyline', role: 'client', username: 'client@skyline.demo', displayName: 'Amelia Chen',    email: 'client@skyline.demo', clientId: 'cl-002', isActive: true },
    claims:   { sub: 'u-006', organization_id: 'skyline', org_slug: 'skyline', org_role: 'client' },
    navigation: { shell: 'client', initialRoute: '/(client)/home' },
  },
};

/**
 * Mock implementation of resolve-login-context.
 * Next step: replace with a real Supabase edge-function call.
 */
export function resolveMockLoginContext(orgSlug: string, role: UserRole): ResolveLoginContextResponse | null {
  return MOCK_LOGIN_CONTEXTS[`${orgSlug}:${role}`] ?? null;
}

/**
 * Mock implementation of bootstrap-tenant-session.
 * Next step: replace with a real Supabase edge-function call.
 */
export function resolveMockBootstrap(orgSlug: string, role: UserRole): TenantBootstrapState | null {
  return MOCK_BOOTSTRAP_SESSIONS[`${orgSlug}:${role}`] ?? null;
}

export function getCampaignsForTenant(tenantId: string) {
  return MOCK_CAMPAIGNS.filter(campaign => campaign.tenantId === tenantId);
}

export function getCampaignsForDriver(driverId: string) {
  return MOCK_CAMPAIGNS.filter(campaign => campaign.assignedDriverIds.includes(driverId));
}

export function getCampaignById(campaignId: string) {
  return MOCK_CAMPAIGNS.find(campaign => campaign.id === campaignId);
}

export function getProofsForCampaign(campaignId: string) {
  return MOCK_PROOFS.filter(proof => proof.campaignId === campaignId);
}

export function getProofsForDriver(driverId: string) {
  return MOCK_PROOFS.filter(proof => proof.driverId === driverId);
}

export function getDriverById(driverId: string) {
  return MOCK_DRIVERS.find(driver => driver.id === driverId);
}

export function getDriversForTenant(tenantId: string) {
  return MOCK_DRIVERS.filter(driver => driver.tenantId === tenantId);
}

export function getClientsForTenant(tenantId: string) {
  return MOCK_CLIENTS.filter(client => client.tenantId === tenantId);
}

export function getRoutesForTenant(tenantId: string) {
  return MOCK_ROUTES.filter(route => route.tenantId === tenantId);
}

export function getRoutesForCampaign(campaignId: string) {
  return MOCK_ROUTES.filter(route => route.campaignId === campaignId);
}

export function getShiftsForDriver(driverId: string) {
  return MOCK_SHIFTS.filter(shift => shift.driverId === driverId);
}

export function getActiveShiftForDriver(driverId: string) {
  return MOCK_SHIFTS.find(shift => shift.driverId === driverId && shift.status === 'active');
}

export function progressPercent(submitted: number, required: number) {
  if (required <= 0) {
    return 0;
  }
  return Math.round((submitted / required) * 100);
}

export function formatDate(date: string) {
  // Parse date-only strings (YYYY-MM-DD) as local midnight to avoid the UTC-offset
  // shift that causes new Date("YYYY-MM-DD") to display the previous day in US time zones.
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(dateTime: string) {
  return new Date(dateTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
