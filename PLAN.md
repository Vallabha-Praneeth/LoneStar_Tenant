# `LoneStar_Tenant` Current Plan

Last updated: 2026-04-16

## Source of Truth

The source of truth is this repository:

- repo: `/Users/praneeth/LoneStar_ERP/LoneStar_Tenant`

Replit is no longer the implementation workspace.

- `Campaign-Proof-Platform/` is only a donor/reference artifact from the earlier Replit session
- do not continue product development inside that generated workspace
- do not treat Replit code as authoritative for backend, tenancy, auth, or repo structure

The new tenant-platform Supabase project is now the active backend/runtime target for this repo.

## Boundary Lock Decisions

These decisions are now explicit.

### Keep as source

- `mobile/app/`
- `mobile/components/`
- `mobile/constants/`
- `mobile/context/`
- `mobile/hooks/`
- `web/`
- `shared/`
- `supabase/`
- `appium/`
- `docs/`
- root workspace files such as `package.json`, `package-lock.json`, and `README.md`

### Treat as generated local runtime only

- `mobile/.expo/`
- `mobile/ios/`
- any simulator build products, CocoaPods outputs, and local Xcode env files

These may exist locally for running or testing, but they are not the repo source of truth right now.

### Treat as donor/reference only

- `Campaign-Proof-Platform/`

This stays out of active development and is not part of the shipping repo structure.

### Treat as scratch, not project state

- ad hoc personal files like `Untitled_tue14.rtf`

## What Is Completed

### Repo and architecture foundation

- independent `LoneStar_Tenant` repo created and pushed
- npm workspace structure established for `web`, `mobile`, and `appium`
- tenant architecture docs written under `docs/`
- Supabase schema, auth, and support-access design captured in `supabase/migrations/` and `supabase/functions/`

### Mobile app prototype

- Replit mobile artifact was transplanted into this repo instead of replacing the repo structure
- Expo Router mobile app now exists under `mobile/app/`
- org-first login flow works with mock tenant branding
- admin, driver, and client shells exist
- campaign list/detail, proof upload placeholder, shift flow, client gallery/timeline, and admin analytics screens exist
- proof workflow was simplified from `pending -> approved/rejected` to a direct `uploaded` model
- uploaded proofs are treated as immediately visible to both admin and client in the app
- proof uploads now store real image files in Supabase Storage and create `campaign_photos` rows immediately with no approval queue
- admin, driver, and client proof surfaces now render storage-backed proof images in-app

### Mobile verification

- `npm run type-check:mobile` passes
- Appium workspace exists under `appium/`
- iOS Appium smoke suite passes end-to-end
- Android Appium has not been run from this machine because `adb` is unavailable here

### Web status

- `web/` still exists as a lighter shell
- web remains secondary and has not been upgraded to match the new mobile experience yet

## Corrected Product Model (established 2026-04-16)

The correct login flow is:
1. User opens app → sees login screen (editable email + password)
2. `supabase.auth.signInWithPassword(email, password)`
3. `bootstrap-tenant-session` reads JWT app_metadata → returns org branding + profile
4. App routes to the correct role shell

The correct onboarding flow for a new org is:
1. User taps "Create your organization"
2. Enters org name, their name, email, password
3. `create-organization` edge function creates org + admin user + profile + default branding
4. App signs in immediately, boots into admin dashboard

## What Is Not Completed

### Backend integration

- [x] Supabase project attached (zmsicldtcbpmpyuktisq)
- [x] Migrations 001–007 applied
- [x] `bootstrap-tenant-session` edge function deployed and used as the single auth bootstrap path
- [x] Demo users and operational data seeded for lonestar and skyline
- [x] `create-organization` edge function deployed for self-serve onboarding
- [ ] `resolve-login-context` deprecated from login path (kept for future SSO)
- [ ] EAS iOS preview build (blocked on Apple Developer account)
- [ ] `expo-updates` installed and OTA channel configured

### Mobile login flow correction

- [ ] `AuthContext.signIn(email, password)` — Part B, Cursor
- [ ] `TenantContext` loads branding from auth session, not from hardcoded `TENANT_LIST` — Part B, Cursor
- [ ] `index.tsx` is a pure session gate — Part B, Cursor
- [ ] `login.tsx` has editable email + password, no role picker — Part B, Cursor
- [ ] `signup.tsx` org creation screen — Part B, Cursor

### Production readiness

- no release pipeline or EAS iOS build (needs Apple Developer account)
- no real audit/event pipeline

### Web parity

- web still reflects the older shell-level spike
- web does not yet mirror the newer mobile information architecture

## Where Work Should Happen

### 1. This repo

Do product implementation here for:

- mobile UI
- shared types
- Appium automation
- Supabase client wiring
- docs
- repo cleanup

Primary agent/tool:

- Codex here

Best use:

- architecture-preserving implementation
- repo cleanup and refactors
- controlled code transplant and integration
- Appium test authoring and runtime debugging
- precise multi-file edits
- plan maintenance and technical decision tracking

Avoid using this lane for:

- throwaway visual experiments that do not map cleanly back to the repo

### 2. Supabase

Do backend/runtime setup there for:

- project creation or connection
- applying `supabase/migrations/`
- deploying edge functions
- auth provider configuration
- storage buckets
- seed data
- generated types

### 3. Replit

Do not continue core development there.

Allowed use only:

- visual reference
- comparing old generated UI ideas
- recovering a presentational component if it is clearly useful

Not allowed as active source of truth:

- backend changes
- auth changes
- schema changes
- repo structure changes
- production decisions

Primary use:

- parallel UI ideation only when a fast mockup is valuable
- disposable presentational exploration
- recovering a layout or component idea from older generated output

Best use:

- ask for one narrow, screen-level or component-level frontend artifact at a time
- constrain it to mock data and presentation only
- treat every output as a donor, never as the app

Avoid using Replit for:

- Supabase
- auth
- migrations
- security
- tenancy enforcement
- app-wide restructures
- generated backend logic

### 4. Claude Code CLI

Use as a secondary implementation worker when parallel coding helps, but keep this repo as the source of truth.

Best use:

- bounded implementation tasks with a narrow file scope
- repetitive refactors
- local cleanup passes
- test-writing passes
- repo-native feature work that does not require product/architecture decisions

Good examples:

- align mock/session types in a limited set of files
- wire one edge-function client wrapper
- clean one route group
- add missing tests for one feature slice

Avoid using Claude Code CLI for:

- decisions about tenancy/auth architecture
- whole-repo restructures
- importing generated code wholesale
- ambiguous product direction work without a tightly scoped brief

## Tool Split

### Codex here owns

- source-of-truth planning
- repo structure decisions
- Supabase contract alignment
- transplant/integration from donor code
- Appium setup and automation strategy
- debugging cross-file issues
- final review before accepting work from elsewhere

### Claude Code CLI owns

- bounded repo-native implementation tasks after scope is already decided
- cleanup and follow-through work that is expensive but not ambiguous
- supporting test additions

### Replit owns

- disposable UI exploration only
- optional screen/component prototypes to mine for ideas

## How To Extract Maximum Value From Each

### Codex here

Use this lane when correctness matters more than speed.

Prompt style:

- include exact repo path or feature area
- say what must remain unchanged
- ask for implementation plus verification, not just analysis
- use it for integration after any outside artifact is generated

Good prompts:

- align `mobile/context/*` with `shared/tenant-types.ts` without changing routing
- wire the mobile login flow to `resolve-login-context` and `bootstrap-tenant-session`
- review this imported UI artifact and port only the safe presentational parts

### Claude Code CLI

Use this lane for focused execution after the design is already settled.

Prompt style:

- assign a narrow write scope
- define the exact acceptance criteria
- state what files/modules are off-limits
- ask it to stay inside the existing repo structure

Good prompts:

- update only `mobile/context/*` and `mobile/constants/*` so session types match shared contracts
- add a typed Supabase client wrapper in `mobile/` without touching screen components
- write tests for the Appium selectors and smoke helpers only

### Replit

Use this lane as a fast sketch pad, not as an engineering owner.

Prompt style:

- ask for one screen family or one component family
- insist on mock data only
- forbid backend, auth, tenancy, and structure changes
- require modular output that can be manually ported

Good prompts:

- design a stronger admin analytics screen using the existing tenant theme structure and mock data only
- generate two alternative client gallery layouts with restrained operations-product styling and reusable presentational components only
- propose a better driver proof-upload screen composition without changing navigation or backend assumptions

Bad prompts:

- build the backend for this
- make Supabase work
- restructure the repo
- implement auth and security
- create the final product from scratch

## Suggested Execution Strategy

### Phase 1. Use Codex here

- clean repo state
- align contracts between `mobile/` and `shared/`
- decide the real Supabase integration boundary

### Phase 2. Use Claude Code CLI in parallel if needed

- once the contract boundary is fixed, offload narrow implementation slices
- examples:
  - one wrapper around `resolve-login-context`
  - one bootstrap client module
  - one mock-to-real session adapter

### Phase 3. Use Supabase directly

- create/connect project
- apply migrations
- deploy edge functions
- seed demo tenants and users

### Phase 4. Use Codex here again

- integrate real Supabase flows into mobile
- validate the app behavior end-to-end
- keep proof visibility immediate with no approval queue

### Phase 5. Optionally use Replit

- only if a specific screen needs a faster visual iteration pass
- then port the useful UI back into this repo manually

## Recommended Rule Of Thumb

If the task changes product truth, tenancy truth, auth truth, routing truth, or repo truth:

- do it here with Codex

If the task is a bounded coding slice inside a decided architecture:

- Claude Code CLI can do it

If the task is mainly visual exploration and can be discarded safely:

- Replit can do it

## Orchestration Playbook

This is the working order to follow from now on.

The rule is:

- Codex here stays in control of the source of truth
- outside tools only work on bounded subproblems
- all outside output comes back here for review and integration

### Step 1. Repo cleanup and boundary lock

Owner:

- Codex here

Why here:

- this changes repo truth and determines what is safe to hand off

Scope:

- clean source-control noise
- identify generated artifacts that should not remain tracked or relied on
- verify what `mobile/src/` remnants or native build artifacts still exist
- lock the boundary between:
  - repo source of truth
  - generated Replit donor code
  - local build/runtime artifacts

Expected output:

- cleaned repo state
- explicit keep/delete/ignore decision for generated artifacts
- clear list of active source directories

### Step 2. Mobile contract alignment

Owner:

- Codex here first
- Claude Code CLI can help only after the target contract is defined

Why here first:

- this changes the bridge between mock mobile state and real backend state

Codex task:

- define the target session/bootstrap shape using:
  - `shared/tenant-types.ts`
  - `mobile/context/*`
  - `mobile/constants/*`

Target contract:

- mobile should move toward the shared contract already used conceptually by the older web spike:
  - `ResolveLoginContextResponse`
  - `TenantBootstrapState`
  - `TenantBootstrapResponse`

- `TenantContext` should become the selected-organization and branding layer
- `AuthContext` should become the login/bootstrap/session layer
- screen components should keep reading a simple `tenant` and `user` shape, but those should be adapters derived from shared contract objects rather than mobile-only source types

Exact target for `TenantContext`:

- source of truth:
  - selected org slug/id
  - selected organization summary
  - resolved branding/theme
- keep for screens:
  - `tenant.id`
  - `tenant.name`
  - `tenant.tagline` if still needed for mock branding copy
  - `tenant.theme`
  - `tenant.radius`
- move toward shared naming:
  - map to `organization.id`
  - map to `organization.slug`
  - map to `organization.displayName`

Exact target for `AuthContext`:

- source of truth:
  - `loginContext: ResolveLoginContextResponse | null`
  - `bootstrap: TenantBootstrapState | null`
  - loading/error state for resolution and bootstrap
- keep for screens:
  - `user.id`
  - `user.role`
  - `user.name`
- derive those from:
  - `bootstrap.profile`
  - `bootstrap.claims`
  - `bootstrap.navigation`

What must not change in this step:

- no screen rewrites
- no route rewrites
- no real network calls yet
- no Supabase client yet
- no change to the proof-upload behavior

Implementation shape:

- introduce adapter/helper types if useful
- prefer mapping shared-contract objects into simple mobile view models
- remove direct dependence on `MockUser` as the long-term session source type
- do not make screen components know about raw Supabase payload details

Then Claude Code CLI task:

- implement the narrow alignment pass once the target shape is clear

Claude Code CLI prompt:

```text
Work only inside this repository and keep the current structure.

Task:
Align the mobile mock/session layer with the shared tenant contract.

Write scope:
- mobile/context/*
- mobile/constants/*
- optionally small import/type fixes in mobile/app/* if required by the type changes

Do not change:
- routing structure
- screen composition
- Supabase functions
- shared business architecture

Goal:
- mobile session/provider state should map cleanly to shared tenant types
- keep all behavior mocked for now
- do not introduce real backend calls yet
- use adapter types/helpers so screens can keep simple `tenant` and `user` reads

Acceptance criteria:
- npm run type-check:mobile passes
- no routing changes
- no new architecture invented
- providers expose enough structure to swap in real `resolve-login-context` and `bootstrap-tenant-session` next
```

Expected output:

- mobile mock/session layer prepared for real Supabase bootstrap wiring

### Step 3. Real Supabase project hookup

Owner:

- user in Supabase dashboard/CLI
- Codex here for repo-side review and integration

Why not Claude/Replit:

- this is backend truth and needs controlled execution

Tasks:

- choose/create the real Supabase project
- apply migrations
- deploy edge functions
- capture env/config values needed by the app

Execution runbook:

- `docs/supabase-step-3-hookup.md`
- `docs/supabase-demo-seed-package.md`

What Codex does here:

- review migration order
- verify edge-function assumptions
- prepare exact commands/files
- integrate resulting config back into the repo safely

### Step 4. Mobile auth/bootstrap wiring

Owner:

- Codex here

Why here:

- this is the most sensitive integration point in the whole project

Scope:

- replace mock org/user resolution with `resolve-login-context`
- replace mock tenant session creation with `bootstrap-tenant-session`
- keep proof upload/storage mocked for now

Expected output:

- real org-first login against Supabase-backed tenant resolution
- real role handoff into mobile shells

### Step 5. Optional Claude Code CLI support after integration boundary is fixed

Owner:

- Claude Code CLI for narrow slices
- Codex here for final review and merge

Use Claude only for bounded follow-up tasks such as:

- create one typed mobile API client wrapper
- refactor one provider module
- add tests for one feature slice
- clean up one route group

Prompt pattern:

```text
Work only inside this repository and do not change the repo structure.

Task:
[insert one narrow implementation task]

Write scope:
[list exact files or folders]

Do not change:
- auth architecture
- tenant model
- routing architecture
- Supabase migrations/functions unless explicitly included

Acceptance criteria:
- [one to three concrete checks]
```

### Step 6. Seed demo data

Owner:

- Codex here for planning and repo-side scripts
- user/Supabase for applying to the real project

Scope:

- seed `lonestar` and `skyline`
- seed admin/driver/client users
- seed campaigns, routes, and proof metadata

Why not Replit:

- this is backend truth, not UI exploration

### Step 7. Real proof upload path

Owner:

- Codex here

Scope:

- storage path design
- upload from mobile
- proof metadata record creation
- immediate admin/client visibility

Locked rule:

- do not reintroduce approval or pending states

### Step 8. Android validation

Owner:

- Codex here after local Android tooling exists

Scope:

- install/validate `adb`
- run Android Appium smoke
- fix Android-specific issues

### Step 9. Replit only for targeted visual exploration

Owner:

- Replit

When allowed:

- only after a specific screen/component needs visual iteration
- only if the output can be discarded safely

Good Replit brief:

```text
Work only as a frontend-only exploration.

Task:
Design one improved screen/component for the existing mobile app.

Constraints:
- mock data only
- do not change backend assumptions
- do not change auth model
- do not change tenant model
- do not restructure the repo
- output modular presentational code only

Target:
[insert one screen, such as admin analytics or driver proof upload]
```

Bad Replit brief:

- build the backend
- wire Supabase
- implement auth
- refactor the whole app
- generate the final product architecture

## Current Active Sequence

1. ✅ Repo + mobile app foundation
2. ✅ Real Supabase backend connected
3. → Login flow correction (email+password, no role picker, no hardcoded org list) — Part B in Cursor
4. → Self-serve org creation built — Part B in Cursor + Part C backend done ✅
5. → Android APK rebuild and emulator validation
6. → iOS preview build (needs Apple Developer account)
7. → expo-updates install + OTA channel
8. → Campaign form backend wiring (currently placeholder)
9. → Web parity (later)

## Next Work, In Order

### Phase 1. Repo cleanup and contract alignment

Status:

- next

Do in:

- this repo

Tasks:

- remove or ignore generated native/dev artifacts that should not live in source control
- clean up empty or obsolete mobile paths such as the old `mobile/src/` remnants if any still remain
- align mobile mock/session types with `shared/tenant-types.ts`
- make sure mobile provider state matches the intended Supabase bootstrap shape

Why this is next:

- the mobile prototype now works, but the contract boundary between mock state and real backend state needs to be cleaned before wiring Supabase

### Phase 2. Real Supabase project hookup

Status:

- next

Do in:

- Supabase plus this repo

Tasks:

- choose or create the actual Supabase project for this app
- apply migrations `001` through `006`
- deploy edge functions:
  - `resolve-login-context`
  - `bootstrap-tenant-session`
  - `create-tenant-user`
  - `grant-support-access`
- configure auth and any required env values
- generate/update local Supabase types if needed

Why this is next:

- the core architecture already exists in design and code form; it now needs a real backend target

### Phase 3. Replace mock mobile auth/bootstrap with real Supabase-backed flow

Status:

- next after Supabase hookup

Do in:

- this repo

Tasks:

- replace mock org/user resolution with calls to `resolve-login-context`
- replace mock post-login session creation with `bootstrap-tenant-session`
- preserve org-first login and runtime branding behavior
- keep proof upload/storage mocked until storage is ready

Success criteria:

- user selects organization
- branding loads
- login resolves inside the selected organization only
- authenticated session boots into the correct role shell from Supabase data

### Phase 4. Seed real demo data for one tenant pass

Status:

- done

Do in:

- Supabase plus this repo

Tasks:

- shipped:
  - [supabase/seeds/002_demo_campaigns_routes_proofs.sql](/Users/praneeth/LoneStar_ERP/LoneStar_Tenant/supabase/seeds/002_demo_campaigns_routes_proofs.sql)
  - [scripts/bootstrap-demo-data.mjs](/Users/praneeth/LoneStar_ERP/LoneStar_Tenant/scripts/bootstrap-demo-data.mjs)
  - live demo data applied to the new tenant-platform Supabase project for `lonestar` and `skyline`
  - mobile list/detail/home screens now read live campaigns, routes, shifts, and proof metadata after auth
  - iOS Appium smoke suite passes against real backend-backed records

Why this matters:

- the current UI is believable, but the next useful milestone is a real backend-backed demo tenant

### Phase 5. Real proof upload path

Status:

- done

Do in:

- this repo plus Supabase

Tasks:

- shipped:
  - [supabase/migrations/007_campaign_proof_storage.sql](/Users/praneeth/LoneStar_ERP/LoneStar_Tenant/supabase/migrations/007_campaign_proof_storage.sql)
  - private `campaign-proofs` bucket with tenant/path-aware storage RLS
  - direct mobile upload flow from [mobile/app/proof-upload.tsx](/Users/praneeth/LoneStar_ERP/LoneStar_Tenant/mobile/app/proof-upload.tsx)
  - transactional upload helper in [mobile/constants/supabase.ts](/Users/praneeth/LoneStar_ERP/LoneStar_Tenant/mobile/constants/supabase.ts) that deletes the storage object if `campaign_photos` insert fails
  - proof thumbnails rendered from tenant-scoped storage paths in admin/client/driver views
  - `npm run type-check:mobile`
  - `npm run type-check:appium`
  - iOS rebuild succeeded with `expo-image-picker`
  - iOS Appium smoke suite still passes

Important rule:

- keep the current product assumption: uploaded proof becomes visible directly; no approval queue

### Phase 6. Android verification

Status:

- next

Do in:

- this repo / local environment

Tasks:

- install `adb`
- validate Android app launch target
- run Appium Android smoke suite
- fix Android-specific accessibility or navigation issues

### Phase 7. Web catch-up

Status:

- later

Do in:

- this repo

Tasks:

- update `web/` to match the newer mobile information architecture where useful
- keep web lighter than mobile
- reuse shared contracts and branding behavior

Why later:

- mobile-first was the original product direction, and mobile is now the critical path

## Immediate Milestone To Target

The next real milestone is:

- mobile app uses a real Supabase project for org resolution and tenant bootstrap
- demo users can log in by organization
- role routing is real
- proof records are real metadata records
- proof visibility remains immediate, with no approval workflow

## Short Working Rules

- build in this repo
- wire runtime in Supabase
- use Replit only as a historical reference
- keep mobile first
- do not reintroduce proof approval
- do not redesign the tenant model or auth model
