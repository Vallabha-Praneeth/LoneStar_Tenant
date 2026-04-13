# `LoneStar_Tenant` Incubation Plan for Multi-Tenant White-Label Platform

## Objective

Build a self-contained spike for a white-label, multi-tenant version of AdTruck where:

- one shared platform serves many organizations
- each organization has its own admins, drivers, clients, campaigns, pricing, and branding
- tenant data is fully isolated by `organization_id`
- org selection happens before login
- branding is runtime-configurable for logo, colors, and fonts
- LoneStar migrates later as tenant `#1`

## Deliverables in this workspace

### Foundation

- `README.md` for workspace intent and rules
- copied reference files from current web, mobile, and Supabase surfaces
- architecture docs for tenancy, auth, branding, migration, and rollout

### Schema and auth spike

- a greenfield tenant-aware schema in `supabase/migrations/`
- org-aware login resolver contract
- JWT claim model for `organization_id`, `org_slug`, and `org_role`
- tenant-first RLS
- break-glass support entities and audit trail

### Prototype shells

- minimal web shell proving:
  - org selection
  - branded login
  - role-based route handoff
  - tenant session shape
- minimal mobile shell proving the same flow

## Non-goals for this spike

- no change to existing LoneStar repos
- no store-ready binary work
- no production data migration yet
- no tenant-specific screen forks
- no billing implementation

## Decisions locked in

- `org login` is not a fourth tenant-facing business role
- tenant-facing roles remain `admin`, `driver`, and `client`
- the platform stays a shared app by default on web, iOS, and Android
- branding scope is limited to logo, colors, and fonts for v1
- platform support access is break-glass only and audited
- one user belongs to one organization in v1

## Workstreams

1. Capture minimal references from the current product
2. Define tenant-aware schema and policies
3. Define org-aware auth flow and server contracts
4. Define branding contract and theme providers
5. Build a minimal web proof
6. Build a minimal mobile proof
7. Document migration and rollout for the current product

## Exit criteria

- the schema is tenant-safe by design
- auth contracts are org-aware
- tenant branding can load before role routing
- the spike demonstrates that the current single-tenant assumptions can be removed cleanly
- the migration steps for LoneStar tenant `#1` are explicit and reversible
