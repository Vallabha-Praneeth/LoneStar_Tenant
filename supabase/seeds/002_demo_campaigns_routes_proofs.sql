-- ============================================================
-- demo seed: campaigns + routes + shifts + proof metadata
-- Purpose:
-- - replace mobile mock collections with real demo records
-- - keep the app backend-backed after auth/bootstrap
-- - preserve immediate proof visibility (no approval workflow)
-- ============================================================

begin;

-- ---------------------------------------------------------------------------
-- Drivers: enrich the two driver rows seeded in 001 for more realistic metadata
-- ---------------------------------------------------------------------------

insert into public.drivers (
  organization_id,
  profile_id,
  license_number,
  license_type,
  license_expiry,
  emergency_contact_name,
  emergency_contact_phone,
  base_daily_wage,
  city,
  is_active
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    (select id from public.profiles where email = 'driver@lonestar.demo'),
    'TX-LS-2201',
    'Class B',
    '2028-06-30',
    'Elena Webb',
    '+1-555-0108',
    220.00,
    'Austin',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    (select id from public.profiles where email = 'driver@skyline.demo'),
    'TX-SK-4108',
    'Class A',
    '2028-11-30',
    'Marta Rivera',
    '+1-555-0208',
    240.00,
    'Austin',
    true
  )
on conflict (profile_id) do update
set
  license_number = excluded.license_number,
  license_type = excluded.license_type,
  license_expiry = excluded.license_expiry,
  emergency_contact_name = excluded.emergency_contact_name,
  emergency_contact_phone = excluded.emergency_contact_phone,
  base_daily_wage = excluded.base_daily_wage,
  city = excluded.city,
  is_active = excluded.is_active;

-- ---------------------------------------------------------------------------
-- Additional demo clients
-- ---------------------------------------------------------------------------

insert into public.clients (
  id,
  organization_id,
  name,
  phone_number,
  is_active
)
values
  (
    '11111111-1111-1111-1111-111111111202',
    '11111111-1111-1111-1111-111111111111',
    'Lone Star Beer Co.',
    '+1-555-0102',
    true
  ),
  (
    '11111111-1111-1111-1111-111111111203',
    '11111111-1111-1111-1111-111111111111',
    'Buc-ee''s Expansion',
    '+1-555-0103',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    '22222222-2222-2222-2222-222222222222',
    'Premier Parking Co.',
    '+1-555-0202',
    true
  )
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  name = excluded.name,
  phone_number = excluded.phone_number,
  is_active = excluded.is_active;

-- ---------------------------------------------------------------------------
-- Routes
-- ---------------------------------------------------------------------------

insert into public.routes (
  id,
  organization_id,
  name,
  city,
  is_active
)
values
  ('11111111-1111-1111-1111-111111111301', '11111111-1111-1111-1111-111111111111', 'Downtown Core Loop', 'Austin', true),
  ('11111111-1111-1111-1111-111111111302', '11111111-1111-1111-1111-111111111111', 'Rodeo Grounds Sweep', 'Austin', true),
  ('11111111-1111-1111-1111-111111111303', '11111111-1111-1111-1111-111111111111', 'Highway 290 Corridor East', 'Austin', true),
  ('22222222-2222-2222-2222-222222222301', '22222222-2222-2222-2222-222222222222', 'Eastern Ring Sweep', 'Austin', true),
  ('22222222-2222-2222-2222-222222222302', '22222222-2222-2222-2222-222222222222', 'Airport Access North', 'Austin', true)
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  name = excluded.name,
  city = excluded.city,
  is_active = excluded.is_active;

insert into public.route_stops (
  id,
  organization_id,
  route_id,
  stop_order,
  venue_name,
  address
)
values
  ('11111111-1111-1111-1111-111111111501', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111301', 1, 'Congress Ave & 6th St', '600 Congress Ave'),
  ('11111111-1111-1111-1111-111111111502', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111301', 2, 'Warehouse District', '3rd St & Colorado St'),
  ('11111111-1111-1111-1111-111111111503', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111301', 3, 'Republic Square', '422 Guadalupe St'),
  ('11111111-1111-1111-1111-111111111504', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111302', 1, 'Fairgrounds Gate A', '7311 Decker Ln'),
  ('11111111-1111-1111-1111-111111111505', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111302', 2, 'Riverside Dr Corridor', 'E Riverside Dr'),
  ('11111111-1111-1111-1111-111111111506', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111302', 3, 'South Congress Hub', '1412 S Congress Ave'),
  ('11111111-1111-1111-1111-111111111507', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111303', 1, 'US-290 West Entry', 'US-290 & Springdale Rd'),
  ('11111111-1111-1111-1111-111111111508', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111303', 2, 'Oak Hill Connector', 'US-290 & Monterey Oaks'),
  ('11111111-1111-1111-1111-111111111509', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111303', 3, 'Dripping Springs Gateway', 'US-290 & RR 12'),
  ('22222222-2222-2222-2222-222222222501', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222301', 1, 'Ring Road East', 'Ring Rd E & Lamar Blvd'),
  ('22222222-2222-2222-2222-222222222502', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222301', 2, 'North Connector', 'Airport Blvd & Hwy 183'),
  ('22222222-2222-2222-2222-222222222503', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222301', 3, 'South Interchange', 'Ben White Blvd & I-35'),
  ('22222222-2222-2222-2222-222222222504', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222302', 1, 'Airport Toll Plaza', 'SH 130 Airport Connector'),
  ('22222222-2222-2222-2222-222222222505', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222302', 2, 'Terminal B Arrivals', '3600 Presidential Blvd'),
  ('22222222-2222-2222-2222-222222222506', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222302', 3, 'Hotel Shuttle Corridor', 'Spirit of Texas Dr')
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  route_id = excluded.route_id,
  stop_order = excluded.stop_order,
  venue_name = excluded.venue_name,
  address = excluded.address;

-- ---------------------------------------------------------------------------
-- Campaigns
-- ---------------------------------------------------------------------------

insert into public.campaigns (
  id,
  organization_id,
  title,
  campaign_date,
  route_id,
  status,
  client_id,
  driver_profile_id,
  internal_notes,
  client_billed_amount,
  created_by
)
values
  (
    '11111111-1111-1111-1111-111111111401',
    '11111111-1111-1111-1111-111111111111',
    'Q2 Downtown Blitz',
    date '2026-04-14',
    '11111111-1111-1111-1111-111111111301',
    'active',
    '11111111-1111-1111-1111-111111111201',
    (select id from public.profiles where email = 'driver@lonestar.demo'),
    'High-visibility downtown route coverage. Daily checkpoint proofs are expected.',
    6400.00,
    (select id from public.profiles where email = 'admin@lonestar.demo')
  ),
  (
    '11111111-1111-1111-1111-111111111402',
    '11111111-1111-1111-1111-111111111111',
    'Spring Rodeo Push',
    date '2026-04-12',
    '11111111-1111-1111-1111-111111111302',
    'active',
    '11111111-1111-1111-1111-111111111202',
    (select id from public.profiles where email = 'driver@lonestar.demo'),
    'Fairgrounds and surrounding neighborhood saturation ahead of weekend crowds.',
    4100.00,
    (select id from public.profiles where email = 'admin@lonestar.demo')
  ),
  (
    '11111111-1111-1111-1111-111111111403',
    '11111111-1111-1111-1111-111111111111',
    'Highway 290 Corridor',
    date '2026-04-20',
    '11111111-1111-1111-1111-111111111303',
    'pending',
    '11111111-1111-1111-1111-111111111203',
    null,
    'Pre-launch corridor awareness run scheduled for next week.',
    7200.00,
    (select id from public.profiles where email = 'admin@lonestar.demo')
  ),
  (
    '22222222-2222-2222-2222-222222222401',
    '22222222-2222-2222-2222-222222222222',
    'Metro Ring Coverage',
    date '2026-04-14',
    '22222222-2222-2222-2222-222222222301',
    'active',
    '22222222-2222-2222-2222-222222222201',
    (select id from public.profiles where email = 'driver@skyline.demo'),
    'Ring-road commuter corridor coverage with morning and lunch proof windows.',
    6800.00,
    (select id from public.profiles where email = 'admin@skyline.demo')
  ),
  (
    '22222222-2222-2222-2222-222222222402',
    '22222222-2222-2222-2222-222222222222',
    'Airport Access Push',
    date '2026-04-11',
    '22222222-2222-2222-2222-222222222302',
    'active',
    '22222222-2222-2222-2222-222222222202',
    (select id from public.profiles where email = 'driver@skyline.demo'),
    'Airport access coverage timed to arrival and parking demand surges.',
    3500.00,
    (select id from public.profiles where email = 'admin@skyline.demo')
  )
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  title = excluded.title,
  campaign_date = excluded.campaign_date,
  route_id = excluded.route_id,
  status = excluded.status,
  client_id = excluded.client_id,
  driver_profile_id = excluded.driver_profile_id,
  internal_notes = excluded.internal_notes,
  client_billed_amount = excluded.client_billed_amount,
  created_by = excluded.created_by;

-- ---------------------------------------------------------------------------
-- Driver shifts
-- ---------------------------------------------------------------------------

insert into public.driver_shifts (
  id,
  organization_id,
  campaign_id,
  driver_profile_id,
  started_at,
  ended_at,
  shift_status
)
values
  (
    '11111111-1111-1111-1111-111111111601',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111401',
    (select id from public.profiles where email = 'driver@lonestar.demo'),
    timestamptz '2026-04-15T08:00:00Z',
    null,
    'active'
  ),
  (
    '11111111-1111-1111-1111-111111111602',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111402',
    (select id from public.profiles where email = 'driver@lonestar.demo'),
    timestamptz '2026-04-13T09:15:00Z',
    timestamptz '2026-04-13T16:40:00Z',
    'completed'
  ),
  (
    '22222222-2222-2222-2222-222222222601',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222401',
    (select id from public.profiles where email = 'driver@skyline.demo'),
    timestamptz '2026-04-15T07:45:00Z',
    null,
    'active'
  ),
  (
    '22222222-2222-2222-2222-222222222602',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222402',
    (select id from public.profiles where email = 'driver@skyline.demo'),
    timestamptz '2026-04-14T10:10:00Z',
    timestamptz '2026-04-14T17:05:00Z',
    'completed'
  )
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  campaign_id = excluded.campaign_id,
  driver_profile_id = excluded.driver_profile_id,
  started_at = excluded.started_at,
  ended_at = excluded.ended_at,
  shift_status = excluded.shift_status;

-- ---------------------------------------------------------------------------
-- Campaign photo metadata
-- ---------------------------------------------------------------------------

insert into public.campaign_photos (
  id,
  organization_id,
  campaign_id,
  uploaded_by,
  storage_path,
  note,
  submitted_at,
  captured_at,
  is_hidden
)
values
  (
    '11111111-1111-1111-1111-111111111701',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111401',
    (select id from public.profiles where email = 'driver@lonestar.demo'),
    '11111111-1111-1111-1111-111111111111/campaigns/11111111-1111-1111-1111-111111111401/proofs/downtown-1.jpg',
    'Congress Ave & 6th St | Morning checkpoint capture.',
    timestamptz '2026-04-15T08:45:00Z',
    timestamptz '2026-04-15T08:43:00Z',
    false
  ),
  (
    '11111111-1111-1111-1111-111111111702',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111401',
    (select id from public.profiles where email = 'driver@lonestar.demo'),
    '11111111-1111-1111-1111-111111111111/campaigns/11111111-1111-1111-1111-111111111401/proofs/downtown-2.jpg',
    'Warehouse District | Mid-route visibility pass.',
    timestamptz '2026-04-15T11:10:00Z',
    timestamptz '2026-04-15T11:07:00Z',
    false
  ),
  (
    '11111111-1111-1111-1111-111111111703',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111402',
    (select id from public.profiles where email = 'driver@lonestar.demo'),
    '11111111-1111-1111-1111-111111111111/campaigns/11111111-1111-1111-1111-111111111402/proofs/rodeo-1.jpg',
    'Fairgrounds Gate A | Early afternoon event traffic checkpoint.',
    timestamptz '2026-04-13T14:15:00Z',
    timestamptz '2026-04-13T14:10:00Z',
    false
  ),
  (
    '22222222-2222-2222-2222-222222222701',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222401',
    (select id from public.profiles where email = 'driver@skyline.demo'),
    '22222222-2222-2222-2222-222222222222/campaigns/22222222-2222-2222-2222-222222222401/proofs/ring-1.jpg',
    'Ring Road East | First commuter corridor pass.',
    timestamptz '2026-04-15T10:25:00Z',
    timestamptz '2026-04-15T10:20:00Z',
    false
  ),
  (
    '22222222-2222-2222-2222-222222222702',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222401',
    (select id from public.profiles where email = 'driver@skyline.demo'),
    '22222222-2222-2222-2222-222222222222/campaigns/22222222-2222-2222-2222-222222222401/proofs/ring-2.jpg',
    'North Connector | Lunch-hour proof capture.',
    timestamptz '2026-04-15T12:10:00Z',
    timestamptz '2026-04-15T12:07:00Z',
    false
  ),
  (
    '22222222-2222-2222-2222-222222222703',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222402',
    (select id from public.profiles where email = 'driver@skyline.demo'),
    '22222222-2222-2222-2222-222222222222/campaigns/22222222-2222-2222-2222-222222222402/proofs/airport-1.jpg',
    'Airport Toll Plaza | Parking demand surge checkpoint.',
    timestamptz '2026-04-14T15:05:00Z',
    timestamptz '2026-04-14T15:00:00Z',
    false
  )
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  campaign_id = excluded.campaign_id,
  uploaded_by = excluded.uploaded_by,
  storage_path = excluded.storage_path,
  note = excluded.note,
  submitted_at = excluded.submitted_at,
  captured_at = excluded.captured_at,
  is_hidden = excluded.is_hidden;

commit;
