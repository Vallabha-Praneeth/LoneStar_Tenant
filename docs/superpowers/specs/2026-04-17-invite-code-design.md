# Invite Code — Design Spec
**Date:** 2026-04-17
**Branch:** `codex-mobile-proof-upload`
**Status:** Approved

---

## Problem

The `create-organization` flow is fully open — anyone who downloads the app can create an org, provision an admin account, and consume platform infrastructure. This needs to be gated so only customers explicitly onboarded by the platform owner (Praneeth) can create organisations.

---

## Approach

Tier 2 invite code pattern (used by Gmail beta, Superhuman, Linear, Robinhood). A single-use, time-limited code is required at org creation. The platform owner generates codes out-of-band (via mobile super-admin panel or web panel) and delivers them to customers via email or WhatsApp. No code = no org.

---

## Decisions

| Decision | Choice |
|---|---|
| Code type | Single-use |
| Code format | Random alphanumeric — `X7K2-MP94-3QWL` |
| Default expiry | 14 days (configurable per code at generation time) |
| Who generates | Platform owner + small trusted team |
| Generation surfaces | Mobile app (hidden panel) + Vercel web app |
| Mobile trigger | 7 taps on app logo on login screen |
| Web entry point | Direct URL `/super-admin` (not linked from main nav) |
| Super-admin auth | Single master password, validated against `ADMIN_MASTER_SECRET` Supabase env var |
| Post-creation isolation | Super-admin can see which org used a code and when — but has zero access to that org's business data (campaigns, drivers, clients, routes, shifts, photos). RLS enforces this structurally. |
| RLS | Enabled on all tables including `org_invite_codes`. No RLS disabled anywhere. Edge functions use service role server-side (same pattern as existing `create-organization` and `create-tenant-user`). |

---

## Section 1 — Data Model

### New table: `org_invite_codes`

```sql
CREATE TABLE public.org_invite_codes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text UNIQUE NOT NULL,        -- e.g. X7K2-MP94-3QWL
  label            text NOT NULL,               -- e.g. "Acme Trucking - John"
  used             boolean NOT NULL DEFAULT false,
  revoked          boolean NOT NULL DEFAULT false,
  expires_at       timestamptz NOT NULL,        -- created_at + N days
  created_at       timestamptz NOT NULL DEFAULT now(),
  used_at          timestamptz NULL,            -- stamped on successful org creation
  used_by_org_id   uuid NULL REFERENCES public.organizations(id),
  used_by_org_name text NULL                   -- snapshot of org display_name at time of use
);

ALTER TABLE public.org_invite_codes ENABLE ROW LEVEL SECURITY;
-- No direct client policies. All access via edge functions using service role.
```

**Why no org data in the code record beyond `used_by_org_id` and `used_by_org_name`:** The super-admin knows a code was used by "Acme Trucking" on a given date. They cannot traverse from that into campaigns, drivers, or any business data — RLS blocks it because the super-admin JWT carries no `organization_id` claim.

### Status derivation (computed, not stored)

| Condition | Status |
|---|---|
| `used = true` | Used |
| `revoked = true` | Revoked |
| `expires_at < now()` and not used | Expired |
| none of the above | Active |

---

## Section 2 — Edge Functions

### Authentication pattern (all three new functions)

```
Header:  X-Admin-Secret: <master-password>
Checked: Deno.env.get('ADMIN_MASTER_SECRET')
On fail: 401 — no DB access attempted
```

All three are deployed with `--no-verify-jwt` (no Supabase user JWT required — super-admin is not a Supabase auth user).

---

### `generate-invite-code` — POST

**Input:**
```json
{ "label": "Acme Trucking - John", "expiryDays": 14 }
```

**Logic:**
1. Validate `X-Admin-Secret`
2. Generate code: take `crypto.randomUUID()`, strip hyphens, uppercase, format as `XXXX-XXXX-XXXX`
3. Insert into `org_invite_codes` with `expires_at = now() + expiryDays`
4. Return `{ id, code, label, expires_at }`

---

### `list-invite-codes` — GET

**Input:** none

**Logic:**
1. Validate `X-Admin-Secret`
2. Select all rows from `org_invite_codes` ordered by `created_at DESC`
3. Derive status per row (see status table above)
4. Return array of `{ id, code, label, status, created_at, expires_at, used_at, used_by_org_name }`

---

### `revoke-invite-code` — POST

**Input:**
```json
{ "id": "<uuid>" }
```

**Logic:**
1. Validate `X-Admin-Secret`
2. Fetch code by id — 404 if not found
3. If `used = true` → 409 "Cannot revoke a code that has already been used"
4. Set `revoked = true`
5. Return `{ ok: true }`

---

### `create-organization` — modification to existing function

**Add invite code validation before any org creation:**

1. Accept new field `inviteCode: string` in request body
2. Look up code in `org_invite_codes` — 400 if not found
3. Validate: not used, not revoked, `expires_at > now()` — specific error per failure state
4. Proceed with existing org creation logic (unchanged)
5. On success: `UPDATE org_invite_codes SET used = true, used_at = now(), used_by_org_id = <new org id>, used_by_org_name = <orgName> WHERE id = <code id>`

**Atomicity note:** The UPDATE runs after org creation succeeds. If org creation fails, the code remains unused. If the UPDATE fails after a successful org creation, the org exists but the code stays unused — acceptable: the admin will see the code still "Active" and can investigate. The org is not broken.

**Error messages returned to client:**

| Condition | Message |
|---|---|
| Code not found | "That invite code doesn't exist. Check for typos." |
| Code expired | "That invite code has expired. Ask for a new one." |
| Code already used | "That invite code has already been used." |
| Code revoked | "That invite code is no longer valid. Ask for a new one." |

---

## Section 3 — Mobile Super-Admin Screen

### Trigger

7 taps on the app logo on the login screen → `router.push('/super-admin')`.

`/super-admin` is a hidden Expo Router screen registered with `href: null` in the root layout (not in any tab shell).

### Step 1 — Password gate

Full-screen password prompt. On submit: calls `list-invite-codes` with the entered value as `X-Admin-Secret`. 200 → authenticated, load panel. 401 → "Incorrect password" inline error. Password held in component state only — never persisted to AsyncStorage.

### Step 2 — Panel

Single scrollable screen using `AppHeader` with back arrow (returns to login).

**Generate section (top)**
- Label `TextInput`
- Expiry days `TextInput` (numeric, default 14)
- "Generate Code" `Button`
- On success: highlighted box shows the new code in monospace with a copy-to-clipboard `Pressable`. Stays visible until next generation.

**All Codes list (below)**
- Ordered `created_at DESC`
- Each row: label, code (monospace, tap to copy), status badge, created date, used date or expiry date
- Active codes only: "Revoke" button → `Alert.alert` confirmation → calls `revoke-invite-code`
- Pull-to-refresh (`RefreshControl`) reloads the list

**No tenant context required.** Super-admin screen uses `SUPABASE_URL` and `SUPABASE_ANON_KEY` directly for edge function calls, same as the `create-organization` call already does.

---

## Section 4 — Web Panel (Vercel App)

### Entry point

Direct navigation to `https://lonestar-adtruck-proof.vercel.app/super-admin`. Not linked from the main app. The URL is known only to the platform team.

### Routing

No router library needed. Check `window.location.pathname` at app entry:

```tsx
if (window.location.pathname === '/super-admin') {
  return <SuperAdminPanel />;
}
return <OrgWebApp />;
```

### `vercel.json` addition

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Prevents 404 on direct navigation to `/super-admin`.

### Step 1 — Password gate

Same logic as mobile: password field → calls `list-invite-codes` with `X-Admin-Secret` header → 200 unlocks, 401 error. State only, never persisted.

### Step 2 — Panel

Two-column desktop layout (single column on narrow screens).

**Left column — Generate Code**
- Label input
- Expiry days input (default 14)
- "Generate" button
- Generated code displayed in a highlighted monospace box with one-click copy

**Right column — All Codes table**
- Columns: Label | Code | Status | Created | Used / Expires
- Status badges with colour: Active (green) / Used (blue) / Expired (grey) / Revoked (red)
- Active rows: "Revoke" button → browser `confirm()` dialog → calls `revoke-invite-code`
- Refresh button reloads the list

**`ADMIN_MASTER_SECRET` lives only in Supabase edge function env vars.** The web app sends whatever the user types as a header — the secret is never in the Vercel build or browser.

---

## Section 5 — Signup Screen

### Field order (updated)

1. **Invite Code** ← new, first field
2. Organization Name
3. Your Name
4. Work Email
5. Password

**Invite Code field spec:**
- Label: `Invite Code`
- Sub-label (muted): `You should have received this via email or WhatsApp`
- Placeholder: `e.g. X7K2-MP94-3QWL`
- `autoCapitalize="none"`, `autoCorrect={false}`
- Client normalises on submit: `trim()` + `toUpperCase()`

### Validation

No real-time validation. Code validated server-side on submit by `create-organization`. Specific error messages surfaced on the existing error banner (same component used today).

### Login screen

No change. Existing users sign in normally. Invite code is only needed for new org creation.

---

## Migration

New migration file: `009_invite_codes.sql`

Creates `org_invite_codes` table with RLS enabled and no direct client policies.

---

## Security summary

| Layer | What it enforces |
|---|---|
| `ADMIN_MASTER_SECRET` env var | Only the platform team can generate/list/revoke codes |
| Single-use codes | One customer per code, no sharing |
| `expires_at` | Stale codes don't accumulate indefinitely |
| RLS on `org_invite_codes` | No direct client REST access to the codes table |
| RLS on all business tables | Super-admin has no Supabase JWT — edge functions only expose invite code data, service role is never used for org business queries |
| Service role (server-side only) | Used in edge functions, never exposed to client |
