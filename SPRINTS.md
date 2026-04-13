# `LoneStar_Tenant` Sprint Plan

All work stays inside this repository.

The current web app and mobile app remain untouched until this incubation workspace is accepted.

## Sprint 1 — Runnable Web Harness

Status:

- complete

Goal:

- make `web/` runnable as a standalone tenant spike
- prove org selection, branding, and role routing in a browser

Deliverables:

- local `package.json`
- Vite + React entrypoint
- `index.html`
- TypeScript config
- mount `OrgWebApp`

## Sprint 2 — Runnable Mobile Harness

Status:

- complete

Goal:

- make `mobile/` a standalone Expo-style spike shell
- keep it isolated from the current mobile app

Deliverables:

- local package manifest
- Expo app entry
- minimal config for the org-first flow

## Sprint 3 — Schema Hardening

Status:

- complete

Goal:

- refine the tenant schema for real migration use
- tighten tenant-scoped uniqueness and relationship rules

Deliverables:

- schema notes on cross-tenant FK safety
- storage path and integration scoping notes
- migration validation checklist

## Sprint 4 — Auth Contract Hardening

Status:

- complete

Goal:

- replace demo-only assumptions with realistic org-aware auth flow contracts

Deliverables:

- resolved login flow documentation
- claim mapping notes
- tenant bootstrap state shape

## Sprint 5 — Migration Readiness

Status:

- complete

Goal:

- turn LoneStar tenant `#1` migration into an executable checklist

Deliverables:

- table-by-table backfill order
- rollback notes
- go/no-go validation checklist
