# Branding Model

## Scope

v1 white-labeling is limited to:

- logo
- colors
- fonts

Layouts, features, route structure, and permissions stay shared.

## Branding source

Branding is loaded from tenant configuration after organization selection.

Suggested data split:

- `organizations`: canonical identity and slug
- `organization_branding`: visual configuration

## Required branding fields

- `display_name`
- `logo_url`
- `primary_color`
- `secondary_color`
- `accent_color`
- `surface_color`
- `font_heading`
- `font_body`

## Web behavior

- org selection screen can remain platform-neutral
- after org selection, the login and app shell use tenant branding
- routing keeps org identity explicit

## Mobile behavior

- binary remains shared in v1
- tenant branding loads after org selection
- safe fallback fonts render immediately
- tenant font overrides load after branding fetch succeeds

## Design guardrails

- no tenant-specific screen forks in v1
- no per-tenant component logic
- no custom navigation structures
- branding must degrade safely if asset or font loading fails
