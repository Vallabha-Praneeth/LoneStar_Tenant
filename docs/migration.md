# Migration Blueprint

## Goal

Move the current LoneStar / AdTruck deployment into the tenant-first platform later, after this spike is accepted.

LoneStar becomes tenant `#1`.

Primary execution artifacts:

- `docs/lonestar-cutover-checklist.md`
- `supabase/migrations/006_lonestar_cutover_template.sql`

## Migration phases

### Phase 1: Foundation

1. create `organizations`
2. create LoneStar org row
3. create `organization_branding` row for LoneStar
4. add `organization_id` to all tenant tables as nullable
5. backfill all current rows with LoneStar `organization_id`
6. validate there are no orphan rows
7. make `organization_id` non-null

### Phase 2: Constraints and indexes

1. replace global uniqueness with tenant-scoped uniqueness
2. add tenant-scoped foreign-key checks
3. update storage path conventions to include organization scope
4. update edge-function payloads to require tenant context

### Phase 3: Auth and claims

1. add org-aware login resolver
2. add JWT tenant claims
3. update current users so claims include LoneStar org context
4. cut current auth bootstrap over to org-aware session handling

### Phase 4: Application cutover

1. route web and mobile through org selection
2. replace hardcoded branding with tenant branding
3. replace single-tenant query assumptions with tenant-scoped access
4. run regression tests on admin, driver, and client flows

## Table backfill order

1. `organizations`
2. `organization_branding`
3. `profiles`
4. `clients`
5. `drivers`
6. `routes`
7. `cost_types`
8. `campaigns`
9. `route_stops`
10. `campaign_costs`
11. `driver_shifts`
12. `campaign_photos`

## Detailed execution model

The recommended operator sequence is:

1. create LoneStar tenant shell and integration rows
2. add nullable `organization_id` columns in the production schema
3. backfill parent tables
4. backfill dependent tables
5. rewrite storage paths to `organization_id/...`
6. validate uniqueness and cross-tenant relationships
7. enforce non-null, tenant-scoped uniqueness, and composite foreign keys
8. issue tenant-aware JWT claims
9. enable org-aware login and bootstrap
10. run admin, driver, and client smoke tests

This keeps rollback cheap until auth cutover starts.

## Rollback approach

- keep the current product live until the tenant-aware app is proven
- backfill in additive migrations first
- avoid destructive column removals until the new surfaces are stable
- keep a reversible claim strategy during transition

## Validation checklist

### Before validating composite foreign keys

- every tenant table has `organization_id` populated
- every child row points to an existing parent row by plain id
- no duplicate values exist for new tenant-scoped uniqueness rules
- every storage path can be rewritten to `organization_id/...`
- current Drive and WhatsApp credentials are inventoried and mapped to LoneStar tenant `#1`

### After validating composite foreign keys

- every tenant row has `organization_id`
- no child row references a parent from a different organization
- same username can exist in a different organization
- same client name can exist in a different organization
- same route name can exist in a different organization
- no cross-tenant joins succeed through direct SQL
- all current LoneStar records map to a single tenant cleanly
- campaign photos resolve tenant-safe storage prefixes
- Drive and WhatsApp actions resolve the correct `organization_integrations` row

### Cutover gates

- web and mobile queries always filter by tenant context
- edge functions reject missing `organization_id`
- service-role jobs write tenant audit rows for sensitive actions
- support access requires an active approved grant
- the operator runbook and SQL template have both been reviewed before production work begins
