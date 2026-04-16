import type { TenantRole } from '../../shared/tenant-types';
import type { MobileUserViewModel } from './mobile-view-models';
import type {
  Campaign,
  Client,
  Driver,
  Proof,
  Route,
  Shift,
} from './mockData';
import { fetchSupabaseRows } from './supabase';

type CampaignStatus = Campaign['status'];

interface ProfileRow {
  id: string;
  role: TenantRole;
  display_name: string;
  email: string | null;
  client_id: string | null;
  is_active: boolean;
}

interface ClientRow {
  id: string;
  name: string;
  phone_number: string | null;
  is_active: boolean;
}

interface RouteRow {
  id: string;
  name: string;
  city: string | null;
  is_active: boolean;
}

interface RouteStopRow {
  route_id: string;
  stop_order: number;
  venue_name: string;
  address: string | null;
}

interface CampaignRow {
  id: string;
  title: string;
  campaign_date: string;
  route_id: string | null;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled';
  client_id: string;
  driver_profile_id: string | null;
  internal_notes: string | null;
  client_billed_amount: number | null;
}

interface DriverShiftRow {
  id: string;
  campaign_id: string;
  driver_profile_id: string;
  started_at: string;
  ended_at: string | null;
  shift_status: 'scheduled' | 'active' | 'completed' | 'no_show' | 'cancelled';
}

interface CampaignPhotoRow {
  id: string;
  campaign_id: string;
  uploaded_by: string;
  storage_path: string;
  note: string | null;
  submitted_at: string;
  captured_at: string | null;
  is_hidden: boolean;
}

interface RawOperationalDataset {
  profiles: ProfileRow[];
  clients: ClientRow[];
  routes: RouteRow[];
  routeStops: RouteStopRow[];
  campaigns: CampaignRow[];
  shifts: DriverShiftRow[];
  photos: CampaignPhotoRow[];
}

export interface TenantOperationalData {
  campaigns: Campaign[];
  proofs: Proof[];
  routes: Route[];
  shifts: Shift[];
  drivers: Driver[];
  clients: Client[];
}

export interface ScopedTenantOperationalData extends TenantOperationalData {
  visibleCampaigns: Campaign[];
  visibleProofs: Proof[];
  visibleRoutes: Route[];
  visibleShifts: Shift[];
}

const CACHE = new Map<string, TenantOperationalData>();
const IN_FLIGHT = new Map<string, Promise<TenantOperationalData>>();

function mapCampaignStatus(status: CampaignRow['status']): CampaignStatus {
  switch (status) {
    case 'active':
      return 'active';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'paused';
    case 'draft':
    case 'pending':
    default:
      return 'scheduled';
  }
}

function mapShiftStatus(status: DriverShiftRow['shift_status']): Shift['status'] {
  switch (status) {
    case 'active':
      return 'active';
    case 'scheduled':
      return 'pending';
    default:
      return 'completed';
  }
}

function addDays(date: string, days: number) {
  const stamp = new Date(`${date}T00:00:00Z`);
  stamp.setUTCDate(stamp.getUTCDate() + days);
  return stamp.toISOString().slice(0, 10);
}

function toClock(value: string | null) {
  if (!value) {
    return null;
  }
  return new Date(value).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });
}

function buildCampaignWindow(campaignDate: string, status: CampaignStatus) {
  if (status === 'completed') {
    return { startDate: campaignDate, endDate: addDays(campaignDate, 1) };
  }

  if (status === 'scheduled') {
    return { startDate: campaignDate, endDate: addDays(campaignDate, 14) };
  }

  return { startDate: campaignDate, endDate: addDays(campaignDate, 7) };
}

function parsePhotoNote(note: string | null) {
  if (!note) {
    return {
      location: 'Proof checkpoint',
      notes: '',
    };
  }

  const [location, ...rest] = note.split('|').map((segment) => segment.trim());
  return {
    location: location || 'Proof checkpoint',
    notes: rest.join(' | '),
  };
}

function initialsFor(name: string) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return initials || 'NA';
}

function deriveEstimatedMiles(stops: RouteStopRow[]) {
  if (stops.length <= 1) {
    return 6;
  }
  return Math.max(8, (stops.length - 1) * 6);
}

function buildScopedView(
  data: TenantOperationalData,
  user: MobileUserViewModel | null,
  clientId: string | null | undefined,
): ScopedTenantOperationalData {
  if (!user) {
    return {
      ...data,
      visibleCampaigns: [],
      visibleProofs: [],
      visibleRoutes: [],
      visibleShifts: [],
    };
  }

  let visibleCampaigns = data.campaigns;
  let visibleProofs = data.proofs;
  let visibleRoutes = data.routes;
  let visibleShifts = data.shifts;

  if (user.role === 'driver') {
    visibleCampaigns = data.campaigns.filter((campaign) => campaign.assignedDriverIds.includes(user.id));
    visibleProofs = data.proofs.filter((proof) => proof.driverId === user.id);
    visibleShifts = data.shifts.filter((shift) => shift.driverId === user.id);
    const allowedCampaignIds = new Set(visibleCampaigns.map((campaign) => campaign.id));
    visibleRoutes = data.routes.filter((route) => allowedCampaignIds.has(route.campaignId));
  } else if (user.role === 'client' && clientId) {
    visibleCampaigns = data.campaigns.filter((campaign) => campaign.clientId === clientId);
    const allowedCampaignIds = new Set(visibleCampaigns.map((campaign) => campaign.id));
    visibleProofs = data.proofs.filter((proof) => allowedCampaignIds.has(proof.campaignId));
    visibleRoutes = data.routes.filter((route) => allowedCampaignIds.has(route.campaignId));
    visibleShifts = [];
  }

  return {
    ...data,
    visibleCampaigns,
    visibleProofs,
    visibleRoutes,
    visibleShifts,
  };
}

function buildCacheKey(accessToken: string, organizationId: string) {
  return `${organizationId}:${accessToken.slice(-12)}`;
}

async function fetchRawOperationalDataset(accessToken: string, organizationId: string): Promise<RawOperationalDataset> {
  const baseFilter = { organization_id: `eq.${organizationId}` };

  const [
    profiles,
    clients,
    routes,
    routeStops,
    campaigns,
    shifts,
    photos,
  ] = await Promise.all([
    fetchSupabaseRows<ProfileRow>('profiles', {
      select: 'id,role,display_name,email,client_id,is_active',
      ...baseFilter,
      order: 'display_name.asc',
    }, accessToken),
    fetchSupabaseRows<ClientRow>('clients', {
      select: 'id,name,phone_number,is_active',
      ...baseFilter,
      order: 'name.asc',
    }, accessToken),
    fetchSupabaseRows<RouteRow>('routes', {
      select: 'id,name,city,is_active',
      ...baseFilter,
      order: 'name.asc',
    }, accessToken),
    fetchSupabaseRows<RouteStopRow>('route_stops', {
      select: 'route_id,stop_order,venue_name,address',
      ...baseFilter,
      order: 'route_id.asc,stop_order.asc',
    }, accessToken),
    fetchSupabaseRows<CampaignRow>('campaigns', {
      select: 'id,title,campaign_date,route_id,status,client_id,driver_profile_id,internal_notes,client_billed_amount',
      ...baseFilter,
      order: 'campaign_date.desc,title.asc',
    }, accessToken),
    fetchSupabaseRows<DriverShiftRow>('driver_shifts', {
      select: 'id,campaign_id,driver_profile_id,started_at,ended_at,shift_status',
      ...baseFilter,
      order: 'started_at.desc',
    }, accessToken),
    fetchSupabaseRows<CampaignPhotoRow>('campaign_photos', {
      select: 'id,campaign_id,uploaded_by,storage_path,note,submitted_at,captured_at,is_hidden',
      ...baseFilter,
      is_hidden: 'eq.false',
      order: 'submitted_at.desc',
    }, accessToken),
  ]);

  return {
    profiles,
    clients,
    routes,
    routeStops,
    campaigns,
    shifts,
    photos,
  };
}

function mapOperationalDataset(raw: RawOperationalDataset, organizationId: string): TenantOperationalData {
  const profileById = new Map(raw.profiles.map((profile) => [profile.id, profile]));
  const clientById = new Map(raw.clients.map((client) => [client.id, client]));
  const routeById = new Map(raw.routes.map((route) => [route.id, route]));
  const routeStopsByRouteId = raw.routeStops.reduce<Map<string, RouteStopRow[]>>((map, stop) => {
    const current = map.get(stop.route_id) ?? [];
    current.push(stop);
    map.set(stop.route_id, current);
    return map;
  }, new Map());
  const photosByCampaignId = raw.photos.reduce<Map<string, CampaignPhotoRow[]>>((map, photo) => {
    const current = map.get(photo.campaign_id) ?? [];
    current.push(photo);
    map.set(photo.campaign_id, current);
    return map;
  }, new Map());

  const campaigns: Campaign[] = raw.campaigns.map((campaign) => {
    const status = mapCampaignStatus(campaign.status);
    const routeStops = campaign.route_id ? routeStopsByRouteId.get(campaign.route_id) ?? [] : [];
    const photoCount = photosByCampaignId.get(campaign.id)?.length ?? 0;
    const client = clientById.get(campaign.client_id);
    const { startDate, endDate } = buildCampaignWindow(campaign.campaign_date, status);

    return {
      id: campaign.id,
      clientId: campaign.client_id,
      name: campaign.title,
      client: client?.name ?? 'Client',
      status,
      startDate,
      endDate,
      routes: campaign.route_id ? 1 : 0,
      proofsRequired: Math.max(routeStops.length * 3, 3),
      proofsSubmitted: photoCount,
      description: campaign.internal_notes?.trim() || `Campaign run scheduled for ${campaign.campaign_date}.`,
      tenantId: organizationId,
      assignedDriverIds: campaign.driver_profile_id ? [campaign.driver_profile_id] : [],
    };
  });

  const campaignById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));

  const routes: Route[] = raw.campaigns
    .filter((campaign) => campaign.route_id)
    .map((campaign) => {
      const route = routeById.get(campaign.route_id as string);
      if (!route) {
        return null;
      }

      const stops = routeStopsByRouteId.get(route.id) ?? [];
      const firstStop = stops[0];
      const lastStop = stops[stops.length - 1];
      const driverProfile = campaign.driver_profile_id ? profileById.get(campaign.driver_profile_id) : null;

      return {
        id: route.id,
        campaignId: campaign.id,
        campaignName: campaign.title,
        name: route.name,
        description: stops.map((stop) => stop.venue_name).join(' · ') || route.city || 'Route assignment',
        startPoint: firstStop?.venue_name ?? route.city ?? route.name,
        endPoint: lastStop?.venue_name ?? route.city ?? route.name,
        estimatedMiles: deriveEstimatedMiles(stops),
        assignedDriverId: campaign.driver_profile_id,
        assignedDriverName: driverProfile?.display_name ?? null,
        status: mapCampaignStatus(campaign.status) === 'paused' ? 'completed' : mapCampaignStatus(campaign.status),
        tenantId: organizationId,
      };
    })
    .filter((route): route is Route => route !== null);

  const proofs: Proof[] = raw.photos.map((photo) => {
    const campaign = campaignById.get(photo.campaign_id);
    const uploader = profileById.get(photo.uploaded_by);
    const { location, notes } = parsePhotoNote(photo.note);

    return {
      id: photo.id,
      campaignId: photo.campaign_id,
      campaignName: campaign?.name ?? 'Campaign',
      driverId: photo.uploaded_by,
      driverName: uploader?.display_name ?? 'Driver',
      submittedAt: photo.submitted_at,
      capturedAt: photo.captured_at,
      location,
      status: 'uploaded',
      notes,
      storagePath: photo.storage_path,
    };
  });

  const shifts: Shift[] = raw.shifts.map((shift) => {
    const campaign = campaignById.get(shift.campaign_id);
    return {
      id: shift.id,
      campaignId: shift.campaign_id,
      campaignName: campaign?.name ?? 'Campaign',
      driverId: shift.driver_profile_id,
      date: shift.started_at.slice(0, 10),
      startTime: toClock(shift.started_at),
      endTime: toClock(shift.ended_at),
      status: mapShiftStatus(shift.shift_status),
      startOdometer: null,
      endOdometer: null,
    };
  });

  const driverShiftCount = shifts.reduce<Map<string, number>>((map, shift) => {
    map.set(shift.driverId, (map.get(shift.driverId) ?? 0) + 1);
    return map;
  }, new Map());
  const driverProofCount = proofs.reduce<Map<string, number>>((map, proof) => {
    map.set(proof.driverId, (map.get(proof.driverId) ?? 0) + 1);
    return map;
  }, new Map());
  const activeCampaignCount = campaigns.reduce<Map<string, number>>((map, campaign) => {
    for (const driverId of campaign.assignedDriverIds) {
      map.set(driverId, (map.get(driverId) ?? 0) + (campaign.status === 'active' ? 1 : 0));
    }
    return map;
  }, new Map());
  const clientCampaignCount = campaigns.reduce<Map<string, { active: number; total: number }>>((map, campaign) => {
    const current = map.get(campaign.clientId ?? '') ?? { active: 0, total: 0 };
    current.total += 1;
    if (campaign.status === 'active') {
      current.active += 1;
    }
    map.set(campaign.clientId ?? '', current);
    return map;
  }, new Map());

  const drivers: Driver[] = raw.profiles
    .filter((profile) => profile.role === 'driver')
    .map((profile) => ({
      id: profile.id,
      name: profile.display_name,
      email: profile.email ?? '',
      phone: '',
      tenantId: organizationId,
      avatarInitials: initialsFor(profile.display_name),
      status: profile.is_active ? 'active' : 'inactive',
      activeCampaigns: activeCampaignCount.get(profile.id) ?? 0,
      totalShifts: driverShiftCount.get(profile.id) ?? 0,
      totalProofs: driverProofCount.get(profile.id) ?? 0,
      licenseClass: 'Class B',
    }));

  const clients: Client[] = raw.clients.map((client) => {
    const stats = clientCampaignCount.get(client.id) ?? { active: 0, total: 0 };
    return {
      id: client.id,
      name: client.name,
      contactName: client.name,
      email: '',
      phone: client.phone_number ?? '',
      tenantId: organizationId,
      avatarInitials: initialsFor(client.name),
      status: client.is_active ? 'active' : 'inactive',
      activeCampaigns: stats.active,
      totalCampaigns: stats.total,
      industry: 'Campaign Client',
    };
  });

  return {
    campaigns,
    proofs,
    routes,
    shifts,
    drivers,
    clients,
  };
}

export async function loadTenantOperationalData(accessToken: string, organizationId: string) {
  const cacheKey = buildCacheKey(accessToken, organizationId);
  const cached = CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  const inFlight = IN_FLIGHT.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const request = fetchRawOperationalDataset(accessToken, organizationId)
    .then((raw) => {
      const mapped = mapOperationalDataset(raw, organizationId);
      CACHE.set(cacheKey, mapped);
      return mapped;
    })
    .finally(() => {
      IN_FLIGHT.delete(cacheKey);
    });

  IN_FLIGHT.set(cacheKey, request);
  return request;
}

export function clearTenantOperationalDataCache() {
  CACHE.clear();
  IN_FLIGHT.clear();
}

export function scopeTenantOperationalData(
  data: TenantOperationalData,
  user: MobileUserViewModel | null,
  clientId: string | null | undefined,
) {
  return buildScopedView(data, user, clientId);
}
