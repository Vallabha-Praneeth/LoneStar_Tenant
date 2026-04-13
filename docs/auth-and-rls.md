# Auth and RLS Design

## Resolved login flow

1. user chooses organization by slug or list
2. app loads tenant branding for that organization
3. app calls `resolve-login-context` with `org_slug` and `login_identifier`
4. backend resolves the login inside the chosen organization only
5. app continues password auth using the resolved email address
6. Supabase issues a JWT containing tenant claims
7. app calls `bootstrap-tenant-session`
8. backend validates claims against `profiles`, `organizations`, and `organization_branding`
9. app receives one tenant bootstrap payload and routes to the correct shell

## Auth contract surfaces

### Pre-auth resolution

Request:

- `org_slug`
- `login_identifier`

Response:

- organization summary
- `resolved_email`
- `resolved_role`
- `login_identifier_type`

This keeps username lookup tenant-safe and prevents the current single-tenant assumption from leaking across organizations.

### Post-auth bootstrap

Request:

- authenticated user JWT
- optional `expected_org_slug`

Response:

- `session.organization`
- `session.profile`
- `session.claims`
- `session.navigation`
- `branding`

## Required JWT claims

- `organization_id`
- `org_slug`
- `org_role`
- optional `platform_role`
- optional `support_grant_id`

## Claim mapping notes

- `organization_id`: the tenant boundary used by every RLS policy
- `org_slug`: the app-facing tenant identifier used for org-aware routing and sanity checks
- `org_role`: the tenant-facing shell to load after bootstrap
- `platform_role`: optional operational role for backend-only tooling
- `support_grant_id`: optional break-glass grant id for audited support access

Bootstrap must reject sessions where:

- `profiles.id <> auth.uid()`
- `profiles.organization_id <> organization_id claim`
- `profiles.role <> org_role claim`
- selected org slug does not match the JWT org slug
- tenant status is not `active`
- profile is inactive

## Why this replaces the current model

The current product is mostly single-tenant and relies on:

- global role checks
- `client_id` as a visibility boundary for client users
- username lookup without org context

That is not safe once many organizations share one backend.

## RLS rules

Every tenant-facing policy starts with:

```sql
organization_id = public.get_jwt_org_id()
```

Then role-specific access is applied on top.

Examples:

- admin can fully manage records only inside their own organization
- driver can only access their own organization and their assigned data
- client can only access their own organization and their own organization’s campaign visibility rules

## Support access

Platform operators do not get normal cross-tenant reads.

Break-glass support works only when:

- a grant exists
- the grant is approved
- the grant is active and not expired
- the grant is audited

Normal tenant-facing clients never receive platform-wide credentials.

## Tenant bootstrap state shape

The app should not derive its shell from raw JWT claims alone.

It should route from one validated bootstrap payload containing:

- organization summary for headers and tenant guardrails
- profile summary for user identity and tenant-scoped UI
- claims for low-level auth and API calls
- navigation contract for initial route selection
- branding payload for theme, logo, and font selection

This gives web and mobile one shared post-auth contract.
