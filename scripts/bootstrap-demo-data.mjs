import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const mobileEnvPath = path.join(repoRoot, 'mobile', '.env');
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? '';

if (!DEMO_PASSWORD) {
  throw new Error('Missing DEMO_PASSWORD. Set it in your shell before bootstrapping demo data: DEMO_PASSWORD=... node scripts/bootstrap-demo-data.mjs');
}

function readEnvValue(key) {
  const candidates = [mobileEnvPath];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [name, ...rest] = trimmed.split('=');
      if (name === key) {
        return rest.join('=').trim();
      }
    }
  }

  return process.env[key] ?? '';
}

const SUPABASE_URL = readEnvValue('EXPO_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = readEnvValue('EXPO_PUBLIC_SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Populate mobile/.env first.');
}

const ORGS = {
  lonestar: {
    id: '11111111-1111-1111-1111-111111111111',
    adminEmail: 'admin@lonestar.demo',
    driverEmail: 'driver@lonestar.demo',
    clients: [
      { id: '11111111-1111-1111-1111-111111111201', name: 'Texaco Regional', phone_number: '+1-555-0101', is_active: true },
      { id: '11111111-1111-1111-1111-111111111202', name: 'Lone Star Beer Co.', phone_number: '+1-555-0102', is_active: true },
      { id: '11111111-1111-1111-1111-111111111203', name: "Buc-ee's Expansion", phone_number: '+1-555-0103', is_active: true },
    ],
    routes: [
      { id: '11111111-1111-1111-1111-111111111301', name: 'Downtown Core Loop', city: 'Austin', is_active: true },
      { id: '11111111-1111-1111-1111-111111111302', name: 'Rodeo Grounds Sweep', city: 'Austin', is_active: true },
      { id: '11111111-1111-1111-1111-111111111303', name: 'Highway 290 Corridor East', city: 'Austin', is_active: true },
    ],
    routeStops: [
      { id: '11111111-1111-1111-1111-111111111501', route_id: '11111111-1111-1111-1111-111111111301', stop_order: 1, venue_name: 'Congress Ave & 6th St', address: '600 Congress Ave' },
      { id: '11111111-1111-1111-1111-111111111502', route_id: '11111111-1111-1111-1111-111111111301', stop_order: 2, venue_name: 'Warehouse District', address: '3rd St & Colorado St' },
      { id: '11111111-1111-1111-1111-111111111503', route_id: '11111111-1111-1111-1111-111111111301', stop_order: 3, venue_name: 'Republic Square', address: '422 Guadalupe St' },
      { id: '11111111-1111-1111-1111-111111111504', route_id: '11111111-1111-1111-1111-111111111302', stop_order: 1, venue_name: 'Fairgrounds Gate A', address: '7311 Decker Ln' },
      { id: '11111111-1111-1111-1111-111111111505', route_id: '11111111-1111-1111-1111-111111111302', stop_order: 2, venue_name: 'Riverside Dr Corridor', address: 'E Riverside Dr' },
      { id: '11111111-1111-1111-1111-111111111506', route_id: '11111111-1111-1111-1111-111111111302', stop_order: 3, venue_name: 'South Congress Hub', address: '1412 S Congress Ave' },
      { id: '11111111-1111-1111-1111-111111111507', route_id: '11111111-1111-1111-1111-111111111303', stop_order: 1, venue_name: 'US-290 West Entry', address: 'US-290 & Springdale Rd' },
      { id: '11111111-1111-1111-1111-111111111508', route_id: '11111111-1111-1111-1111-111111111303', stop_order: 2, venue_name: 'Oak Hill Connector', address: 'US-290 & Monterey Oaks' },
      { id: '11111111-1111-1111-1111-111111111509', route_id: '11111111-1111-1111-1111-111111111303', stop_order: 3, venue_name: 'Dripping Springs Gateway', address: 'US-290 & RR 12' },
    ],
    campaigns: [
      { id: '11111111-1111-1111-1111-111111111401', title: 'Q2 Downtown Blitz', campaign_date: '2026-04-14', route_id: '11111111-1111-1111-1111-111111111301', status: 'active', client_id: '11111111-1111-1111-1111-111111111201', internal_notes: 'High-visibility downtown route coverage. Daily checkpoint proofs are expected.', client_billed_amount: 6400 },
      { id: '11111111-1111-1111-1111-111111111402', title: 'Spring Rodeo Push', campaign_date: '2026-04-12', route_id: '11111111-1111-1111-1111-111111111302', status: 'active', client_id: '11111111-1111-1111-1111-111111111202', internal_notes: 'Fairgrounds and surrounding neighborhood saturation ahead of weekend crowds.', client_billed_amount: 4100 },
      { id: '11111111-1111-1111-1111-111111111403', title: 'Highway 290 Corridor', campaign_date: '2026-04-20', route_id: '11111111-1111-1111-1111-111111111303', status: 'pending', client_id: '11111111-1111-1111-1111-111111111203', internal_notes: 'Pre-launch corridor awareness run scheduled for next week.', client_billed_amount: 7200 },
    ],
    shifts: [
      { id: '11111111-1111-1111-1111-111111111601', campaign_id: '11111111-1111-1111-1111-111111111401', started_at: '2026-04-15T08:00:00Z', ended_at: null, shift_status: 'active' },
      { id: '11111111-1111-1111-1111-111111111602', campaign_id: '11111111-1111-1111-1111-111111111402', started_at: '2026-04-13T09:15:00Z', ended_at: '2026-04-13T16:40:00Z', shift_status: 'completed' },
    ],
    photos: [
      { id: '11111111-1111-1111-1111-111111111701', campaign_id: '11111111-1111-1111-1111-111111111401', storage_path: '11111111-1111-1111-1111-111111111111/campaigns/11111111-1111-1111-1111-111111111401/proofs/downtown-1.jpg', note: 'Congress Ave & 6th St | Morning checkpoint capture.', submitted_at: '2026-04-15T08:45:00Z', captured_at: '2026-04-15T08:43:00Z', is_hidden: false },
      { id: '11111111-1111-1111-1111-111111111702', campaign_id: '11111111-1111-1111-1111-111111111401', storage_path: '11111111-1111-1111-1111-111111111111/campaigns/11111111-1111-1111-1111-111111111401/proofs/downtown-2.jpg', note: 'Warehouse District | Mid-route visibility pass.', submitted_at: '2026-04-15T11:10:00Z', captured_at: '2026-04-15T11:07:00Z', is_hidden: false },
      { id: '11111111-1111-1111-1111-111111111703', campaign_id: '11111111-1111-1111-1111-111111111402', storage_path: '11111111-1111-1111-1111-111111111111/campaigns/11111111-1111-1111-1111-111111111402/proofs/rodeo-1.jpg', note: 'Fairgrounds Gate A | Early afternoon event traffic checkpoint.', submitted_at: '2026-04-13T14:15:00Z', captured_at: '2026-04-13T14:10:00Z', is_hidden: false },
    ],
  },
  skyline: {
    id: '22222222-2222-2222-2222-222222222222',
    adminEmail: 'admin@skyline.demo',
    driverEmail: 'driver@skyline.demo',
    clients: [
      { id: '22222222-2222-2222-2222-222222222201', name: 'HealthFirst Network', phone_number: '+1-555-0201', is_active: true },
      { id: '22222222-2222-2222-2222-222222222202', name: 'Premier Parking Co.', phone_number: '+1-555-0202', is_active: true },
    ],
    routes: [
      { id: '22222222-2222-2222-2222-222222222301', name: 'Eastern Ring Sweep', city: 'Austin', is_active: true },
      { id: '22222222-2222-2222-2222-222222222302', name: 'Airport Access North', city: 'Austin', is_active: true },
    ],
    routeStops: [
      { id: '22222222-2222-2222-2222-222222222501', route_id: '22222222-2222-2222-2222-222222222301', stop_order: 1, venue_name: 'Ring Road East', address: 'Ring Rd E & Lamar Blvd' },
      { id: '22222222-2222-2222-2222-222222222502', route_id: '22222222-2222-2222-2222-222222222301', stop_order: 2, venue_name: 'North Connector', address: 'Airport Blvd & Hwy 183' },
      { id: '22222222-2222-2222-2222-222222222503', route_id: '22222222-2222-2222-2222-222222222301', stop_order: 3, venue_name: 'South Interchange', address: 'Ben White Blvd & I-35' },
      { id: '22222222-2222-2222-2222-222222222504', route_id: '22222222-2222-2222-2222-222222222302', stop_order: 1, venue_name: 'Airport Toll Plaza', address: 'SH 130 Airport Connector' },
      { id: '22222222-2222-2222-2222-222222222505', route_id: '22222222-2222-2222-2222-222222222302', stop_order: 2, venue_name: 'Terminal B Arrivals', address: '3600 Presidential Blvd' },
      { id: '22222222-2222-2222-2222-222222222506', route_id: '22222222-2222-2222-2222-222222222302', stop_order: 3, venue_name: 'Hotel Shuttle Corridor', address: 'Spirit of Texas Dr' },
    ],
    campaigns: [
      { id: '22222222-2222-2222-2222-222222222401', title: 'Metro Ring Coverage', campaign_date: '2026-04-14', route_id: '22222222-2222-2222-2222-222222222301', status: 'active', client_id: '22222222-2222-2222-2222-222222222201', internal_notes: 'Ring-road commuter corridor coverage with morning and lunch proof windows.', client_billed_amount: 6800 },
      { id: '22222222-2222-2222-2222-222222222402', title: 'Airport Access Push', campaign_date: '2026-04-11', route_id: '22222222-2222-2222-2222-222222222302', status: 'active', client_id: '22222222-2222-2222-2222-222222222202', internal_notes: 'Airport access coverage timed to arrival and parking demand surges.', client_billed_amount: 3500 },
    ],
    shifts: [
      { id: '22222222-2222-2222-2222-222222222601', campaign_id: '22222222-2222-2222-2222-222222222401', started_at: '2026-04-15T07:45:00Z', ended_at: null, shift_status: 'active' },
      { id: '22222222-2222-2222-2222-222222222602', campaign_id: '22222222-2222-2222-2222-222222222402', started_at: '2026-04-14T10:10:00Z', ended_at: '2026-04-14T17:05:00Z', shift_status: 'completed' },
    ],
    photos: [
      { id: '22222222-2222-2222-2222-222222222701', campaign_id: '22222222-2222-2222-2222-222222222401', storage_path: '22222222-2222-2222-2222-222222222222/campaigns/22222222-2222-2222-2222-222222222401/proofs/ring-1.jpg', note: 'Ring Road East | First commuter corridor pass.', submitted_at: '2026-04-15T10:25:00Z', captured_at: '2026-04-15T10:20:00Z', is_hidden: false },
      { id: '22222222-2222-2222-2222-222222222702', campaign_id: '22222222-2222-2222-2222-222222222401', storage_path: '22222222-2222-2222-2222-222222222222/campaigns/22222222-2222-2222-2222-222222222401/proofs/ring-2.jpg', note: 'North Connector | Lunch-hour proof capture.', submitted_at: '2026-04-15T12:10:00Z', captured_at: '2026-04-15T12:07:00Z', is_hidden: false },
      { id: '22222222-2222-2222-2222-222222222703', campaign_id: '22222222-2222-2222-2222-222222222402', storage_path: '22222222-2222-2222-2222-222222222222/campaigns/22222222-2222-2222-2222-222222222402/proofs/airport-1.jpg', note: 'Airport Toll Plaza | Parking demand surge checkpoint.', submitted_at: '2026-04-14T15:05:00Z', captured_at: '2026-04-14T15:00:00Z', is_hidden: false },
    ],
  },
};

// Minimal 1×1 gray JPEG used as a placeholder for seeded proof photos.
// Generated offline; no external dependency needed at seed time.
const PLACEHOLDER_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
  'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN' +
  'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
  'MjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAA' +
  'AAAAAAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAA' +
  'AAAA/9oADAMBAAIRAxEAPwCwABmX/9k=';

const PLACEHOLDER_JPEG = Buffer.from(PLACEHOLDER_JPEG_BASE64, 'base64');
const CAMPAIGN_PROOFS_BUCKET = 'campaign-proofs';

async function uploadPlaceholderProofs(photos, accessToken) {
  for (const photo of photos) {
    const encodedPath = photo.storage_path
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${CAMPAIGN_PROOFS_BUCKET}/${encodedPath}`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true',
      },
      body: PLACEHOLDER_JPEG,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Storage upload failed for ${photo.storage_path}: ${response.status} ${body}`);
    }
  }
}

async function requestJson(pathname, init) {
  const response = await fetch(`${SUPABASE_URL}${pathname}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${pathname} -> ${response.status} ${body}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

async function signIn(email) {
  const body = await requestJson('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password: DEMO_PASSWORD }),
  });

  return body.access_token;
}

async function fetchProfileMap(accessToken, organizationId) {
  const rows = await requestJson(`/rest/v1/profiles?${new URLSearchParams({
    select: 'id,email,role',
    organization_id: `eq.${organizationId}`,
  }).toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return new Map(rows.map((row) => [row.email, row.id]));
}

async function upsert(table, rows, accessToken) {
  if (!rows.length) return;
  await requestJson(`/rest/v1/${table}?on_conflict=id`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
}

async function bootstrapOrg(org) {
  const accessToken = await signIn(org.adminEmail);
  const profileMap = await fetchProfileMap(accessToken, org.id);
  const adminProfileId = profileMap.get(org.adminEmail);
  const driverProfileId = profileMap.get(org.driverEmail);

  if (!adminProfileId || !driverProfileId) {
    throw new Error(`Missing admin or driver profile for ${org.adminEmail}`);
  }

  await upsert('clients', org.clients.map((client) => ({ ...client, organization_id: org.id })), accessToken);
  await upsert('routes', org.routes.map((route) => ({ ...route, organization_id: org.id })), accessToken);
  await upsert('route_stops', org.routeStops.map((stop) => ({ ...stop, organization_id: org.id })), accessToken);
  await upsert('campaigns', org.campaigns.map((campaign) => ({
    ...campaign,
    organization_id: org.id,
    driver_profile_id: campaign.status === 'pending' ? null : driverProfileId,
    created_by: adminProfileId,
  })), accessToken);
  await upsert('driver_shifts', org.shifts.map((shift) => ({
    ...shift,
    organization_id: org.id,
    driver_profile_id: driverProfileId,
  })), accessToken);
  await uploadPlaceholderProofs(org.photos, accessToken);
  await upsert('campaign_photos', org.photos.map((photo) => ({
    ...photo,
    organization_id: org.id,
    uploaded_by: driverProfileId,
  })), accessToken);

  return { organizationId: org.id, campaigns: org.campaigns.length, routes: org.routes.length, photos: org.photos.length, shifts: org.shifts.length };
}

async function main() {
  const summaries = [];
  for (const org of Object.values(ORGS)) {
    summaries.push(await bootstrapOrg(org));
  }
  console.log(JSON.stringify({ ok: true, summaries }, null, 2));
}

await main();
