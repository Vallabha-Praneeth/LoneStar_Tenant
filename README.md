# `LoneStar_Tenant` Multi-Tenant Workspace

This repository is an isolated workspace for the next version of the AdTruck platform.

Goals:

- design a tenant-safe architecture without changing the live app code
- prove org-aware auth, branding, and routing
- define a tenant-first Supabase schema and RLS model
- prepare a migration path where LoneStar becomes tenant `#1`

Rules:

- this repository is the writable surface for tenant work
- existing LoneStar repos are used as read-only references
- copied reference files live under `references/`
- no symlinks or in-place edits back into `adtruck-proof-main/` or `adtruck-driver-native/`

Current contents:

- `PLAN.md`: canonical implementation plan for this workspace
- `SPRINTS.md`: incremental implementation sequence for the spike
- `references/`: copied source-of-truth artifacts from the current apps
- `docs/`: architecture and migration notes
- `shared/`: tenant and branding contracts
- `supabase/`: tenant-aware schema, RLS, and edge-function spikes
- `web/`: runnable Vite shell for the tenant-aware web spike
- `mobile/`: runnable Expo-style shell for the tenant-aware mobile spike

This workspace is intentionally a spike, not a production app. It is meant to prove the architecture before any migration into the current product surfaces.
