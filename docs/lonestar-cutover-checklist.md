# LoneStar Tenant `#1` Cutover Checklist

This runbook turns the migration plan into an execution checklist for moving the current LoneStar deployment into the tenant-aware platform.

Work here is still planning-only for the spike. It is not meant to be executed against production from this folder.

## Cutover objective

- create LoneStar as the first tenant
- backfill all existing LoneStar business rows with that tenant id
- enforce tenant-safe constraints
- switch auth and app bootstrap to org-aware contracts
- keep rollback possible until validation is complete

## Roles required during cutover

- database operator with migration privileges
- application operator for web/mobile configuration cutover
- product owner to verify admin, driver, and client behavior
- support owner to validate break-glass controls remain locked down

## Pre-cutover checklist

- freeze schema changes unrelated to tenancy
- capture a database backup or point-in-time restore marker
- capture a storage inventory for campaign proof files
- inventory current Google Drive and WhatsApp credentials
- identify LoneStar admin, driver, and client test users
- prepare one smoke-test campaign for post-cutover verification

## Execution order

### 1. Create tenant records

- create LoneStar row in `organizations`
- create LoneStar branding row in `organization_branding`
- create LoneStar integration rows in `organization_integrations`

Expected output:

- one stable `organization_id` for LoneStar
- provider rows for `google_drive` and `whatsapp` if those integrations are used

### 2. Add additive tenant columns

- add nullable `organization_id` to all tenant tables in production schema
- do not remove or rewrite old uniqueness yet
- keep app code on the existing single-tenant flow during this stage

### 3. Backfill parent tables first

Backfill order:

1. `profiles`
2. `clients`
3. `routes`
4. `cost_types`

Validation after this step:

- every row in these tables has the LoneStar `organization_id`
- no null `organization_id` rows remain

### 4. Backfill dependent tables

Backfill order:

1. `drivers`
2. `campaigns`
3. `route_stops`
4. `campaign_costs`
5. `driver_shifts`
6. `campaign_photos`

Validation after this step:

- every row has the LoneStar `organization_id`
- every dependent row points to a parent row already marked with the same `organization_id`

### 5. Rewrite storage paths

- rewrite proof file paths to `organization_id/...`
- verify signed URL generation reads from DB-owned storage paths only
- verify no legacy path without tenant prefix remains

### 6. Enforce tenant-safe constraints

- make `organization_id` non-null on all tenant tables
- add tenant-scoped uniqueness
- add composite foreign keys `(organization_id, id)` on parent-child relationships
- keep changes additive where possible until app validation completes

### 7. Enable auth contract cutover

- issue LoneStar JWT claims for `organization_id`, `org_slug`, and `org_role`
- enable org-aware login resolution
- enable tenant bootstrap after auth
- route web/mobile through org selection for LoneStar

### 8. Post-cutover validation

- admin can log in and manage only LoneStar data
- driver can log in and access only their assigned LoneStar data
- client can log in and access only their visible LoneStar campaign data
- support access remains blocked without an approved active grant

## Table-by-table backfill checklist

| Table | Backfill source | Depends on | Validation rule |
|---|---|---|---|
| `profiles` | current user/profile rows | `organizations` | all rows use LoneStar `organization_id` |
| `clients` | current client rows | `organizations` | names remain unique inside LoneStar |
| `routes` | current route rows | `organizations` | route uniqueness is preserved per org |
| `cost_types` | current cost type rows | `organizations` | type names remain unique per org |
| `drivers` | current driver rows | `profiles` | `(organization_id, profile_id)` matches same tenant |
| `campaigns` | current campaign rows | `clients`, `routes`, `profiles` | client, route, driver, creator all match LoneStar tenant |
| `route_stops` | current route stop rows | `routes` | `(organization_id, route_id)` matches same tenant |
| `campaign_costs` | current cost rows | `campaigns`, `cost_types` | campaign and cost type both match LoneStar tenant |
| `driver_shifts` | current shift rows | `campaigns`, `profiles` | campaign and driver both match LoneStar tenant |
| `campaign_photos` | current upload rows | `campaigns`, `profiles` | campaign, uploader, and storage path all match LoneStar tenant |

## Go / no-go gates

Go only if all are true:

- no tenant table contains null `organization_id`
- no cross-tenant composite FK validation errors remain
- no storage paths exist outside `organization_id/...`
- org-aware login resolution works for at least one admin, driver, and client test user
- tenant bootstrap returns consistent org, profile, claims, navigation, and branding data
- web/mobile smoke tests pass for LoneStar

No-go if any are true:

- duplicate usernames, route names, or cost type names block tenant-scoped uniqueness
- any child row points to a parent row with a different `organization_id`
- signed URLs or exports still use legacy global paths
- a JWT can bootstrap into a different org than its claims
- support users can read tenant data without a grant

## Rollback decision points

Rollback immediately if failure happens before auth cutover:

- leave tenant columns nullable
- keep current app login flow
- remove or ignore new tenant rows

Rollback immediately if failure happens after auth cutover but before full validation:

- restore pre-cutover auth config
- disable org-first login in app config
- keep additive tenant columns in place
- revoke newly issued tenant-aware claims

Do not continue rollout if:

- application queries still depend on single-tenant assumptions
- any admin, driver, or client smoke flow fails after auth cutover
- storage or integration routing is ambiguous

## Evidence to collect

- backup timestamp or restore marker
- SQL validation results for all tenant tables
- screenshots or notes from admin, driver, and client smoke tests
- support access audit evidence showing no unauthorized read path
- final sign-off from product owner and engineering operator
