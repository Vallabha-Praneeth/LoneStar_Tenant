# Tenant Model

## Core rule

`organization_id` is the tenant boundary for every business record.

This means:

- organizations do not share campaigns
- organizations do not share drivers
- organizations do not share clients
- organizations do not share pricing or cost data
- organizations do not share reports, uploads, or audit events

## Entities

### Platform scope

- `organizations`
- `organization_branding`
- `support_access_grants`
- `support_access_audit`

### Tenant scope

- `profiles`
- `clients`
- `drivers`
- `routes`
- `route_stops`
- `campaigns`
- `cost_types`
- `campaign_costs`
- `driver_shifts`
- `campaign_photos`

## Roles

Tenant-facing roles remain:

- `admin`
- `driver`
- `client`

Platform-only access is not a normal app role. It is an operational capability used through audited support workflows.

## Relationship model

- one organization has many users
- one organization has many clients
- one organization has many drivers
- one organization has many routes
- one organization has many campaigns
- a client belongs to one organization
- a driver belongs to one organization
- a campaign belongs to one organization and references only records from that same organization

## Cross-tenant FK safety

Tenant isolation cannot rely on RLS alone.

The schema now uses a composite-key pattern for tenant-sensitive relationships:

- parent tables expose a unique pair of `(organization_id, id)`
- child tables store both `organization_id` and the referenced row id
- foreign keys point to `(organization_id, id)`, not only to `id`

That means these relationships are structurally tenant-safe even if an application bug attempts a bad insert:

- `profiles (organization_id, client_id) -> clients (organization_id, id)`
- `drivers (organization_id, profile_id) -> profiles (organization_id, id)`
- `route_stops (organization_id, route_id) -> routes (organization_id, id)`
- `campaigns (organization_id, route_id) -> routes (organization_id, id)`
- `campaigns (organization_id, client_id) -> clients (organization_id, id)`
- `campaigns (organization_id, driver_profile_id) -> profiles (organization_id, id)`
- `campaigns (organization_id, created_by) -> profiles (organization_id, id)`
- `campaign_costs (organization_id, campaign_id) -> campaigns (organization_id, id)`
- `campaign_costs (organization_id, cost_type_id) -> cost_types (organization_id, id)`
- `driver_shifts (organization_id, campaign_id) -> campaigns (organization_id, id)`
- `driver_shifts (organization_id, driver_profile_id) -> profiles (organization_id, id)`
- `campaign_photos (organization_id, campaign_id) -> campaigns (organization_id, id)`
- `campaign_photos (organization_id, uploaded_by) -> profiles (organization_id, id)`
- `support_access_audit (organization_id, grant_id) -> support_access_grants (organization_id, id)`

This is the core hardening step for Sprint 3.

## Storage and integration scoping

Tenant-owned files and outbound integrations must be organization-scoped in the schema, not only in app code.

Rules:

- `campaign_photos.storage_path` must start with `organization_id/`
- storage paths must reject traversal-like segments such as `..`
- tenant integrations are stored in `organization_integrations`
- every integration row belongs to one organization and one provider
- provider configuration must be resolved by `organization_id` before any Drive or WhatsApp action runs

This keeps uploads, exports, and delivery jobs aligned with the same tenant boundary as campaigns and users.

## v1 membership rule

Each authenticated user belongs to exactly one organization in v1.

That keeps:

- JWT claims simple
- login deterministic
- RLS predictable
- migration lower risk

Cross-org membership can be added later only if the business actually needs it.
