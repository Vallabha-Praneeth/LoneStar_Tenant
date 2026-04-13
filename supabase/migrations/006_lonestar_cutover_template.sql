-- ============================================================
-- org spike: LoneStar tenant #1 cutover template
-- Planning template only. Review and adapt before any real use.
-- ============================================================

-- 0. Inputs
-- Replace placeholder values before execution in a real environment.

-- Example:
-- \set lonestar_org_id '00000000-0000-0000-0000-000000000001'
-- \set lonestar_slug 'lonestar'
-- \set lonestar_legal_name 'LoneStar ERP Pvt Ltd'
-- \set lonestar_display_name 'LoneStar AdTruck'
-- \set lonestar_support_email 'support@lonestar.example'

-- 1. Create tenant shell
-- INSERT INTO public.organizations (id, slug, legal_name, display_name, status, support_email)
-- VALUES (
--   :'lonestar_org_id',
--   :'lonestar_slug',
--   :'lonestar_legal_name',
--   :'lonestar_display_name',
--   'active',
--   :'lonestar_support_email'
-- );

-- INSERT INTO public.organization_branding (
--   organization_id,
--   display_name,
--   logo_url,
--   primary_color,
--   secondary_color,
--   accent_color,
--   surface_color,
--   text_color,
--   muted_text_color,
--   border_color,
--   heading_font,
--   body_font
-- )
-- VALUES (
--   :'lonestar_org_id',
--   'LoneStar AdTruck',
--   '/brand/lonestar-logo.svg',
--   '#1d4ed8',
--   '#eff6ff',
--   '#f97316',
--   '#ffffff',
--   '#0f172a',
--   '#475569',
--   '#cbd5e1',
--   'Inter',
--   'Inter'
-- );

-- 2. Configure integrations if used
-- INSERT INTO public.organization_integrations (organization_id, provider, status, config_reference)
-- VALUES
--   (:'lonestar_org_id', 'google_drive', 'configured', 'replace-with-secret-reference'),
--   (:'lonestar_org_id', 'whatsapp', 'configured', 'replace-with-secret-reference');

-- 3. Backfill tenant id on parent tables
-- UPDATE public.profiles SET organization_id = :'lonestar_org_id' WHERE organization_id IS NULL;
-- UPDATE public.clients SET organization_id = :'lonestar_org_id' WHERE organization_id IS NULL;
-- UPDATE public.routes SET organization_id = :'lonestar_org_id' WHERE organization_id IS NULL;
-- UPDATE public.cost_types SET organization_id = :'lonestar_org_id' WHERE organization_id IS NULL;

-- 4. Backfill tenant id on dependent tables
-- UPDATE public.drivers SET organization_id = :'lonestar_org_id' WHERE organization_id IS NULL;
-- UPDATE public.campaigns SET organization_id = :'lonestar_org_id' WHERE organization_id IS NULL;
-- UPDATE public.route_stops SET organization_id = :'lonestar_org_id' WHERE organization_id IS NULL;
-- UPDATE public.campaign_costs SET organization_id = :'lonestar_org_id' WHERE organization_id IS NULL;
-- UPDATE public.driver_shifts SET organization_id = :'lonestar_org_id' WHERE organization_id IS NULL;
-- UPDATE public.campaign_photos SET organization_id = :'lonestar_org_id' WHERE organization_id IS NULL;

-- 5. Example storage-path rewrite
-- UPDATE public.campaign_photos
-- SET storage_path = :'lonestar_org_id' || '/' || ltrim(storage_path, '/')
-- WHERE storage_path NOT LIKE :'lonestar_org_id' || '/%';

-- 6. Validation queries

-- Null org ids
-- SELECT 'profiles' AS table_name, count(*) AS null_org_rows FROM public.profiles WHERE organization_id IS NULL
-- UNION ALL
-- SELECT 'clients', count(*) FROM public.clients WHERE organization_id IS NULL
-- UNION ALL
-- SELECT 'routes', count(*) FROM public.routes WHERE organization_id IS NULL
-- UNION ALL
-- SELECT 'cost_types', count(*) FROM public.cost_types WHERE organization_id IS NULL
-- UNION ALL
-- SELECT 'drivers', count(*) FROM public.drivers WHERE organization_id IS NULL
-- UNION ALL
-- SELECT 'campaigns', count(*) FROM public.campaigns WHERE organization_id IS NULL
-- UNION ALL
-- SELECT 'route_stops', count(*) FROM public.route_stops WHERE organization_id IS NULL
-- UNION ALL
-- SELECT 'campaign_costs', count(*) FROM public.campaign_costs WHERE organization_id IS NULL
-- UNION ALL
-- SELECT 'driver_shifts', count(*) FROM public.driver_shifts WHERE organization_id IS NULL
-- UNION ALL
-- SELECT 'campaign_photos', count(*) FROM public.campaign_photos WHERE organization_id IS NULL;

-- Cross-tenant relationship checks
-- SELECT count(*) AS mismatched_campaign_clients
-- FROM public.campaigns c
-- JOIN public.clients cl ON cl.id = c.client_id
-- WHERE c.organization_id <> cl.organization_id;

-- SELECT count(*) AS mismatched_campaign_routes
-- FROM public.campaigns c
-- JOIN public.routes r ON r.id = c.route_id
-- WHERE c.route_id IS NOT NULL
--   AND c.organization_id <> r.organization_id;

-- SELECT count(*) AS mismatched_campaign_drivers
-- FROM public.campaigns c
-- JOIN public.profiles p ON p.id = c.driver_profile_id
-- WHERE c.driver_profile_id IS NOT NULL
--   AND c.organization_id <> p.organization_id;

-- SELECT count(*) AS mismatched_campaign_creators
-- FROM public.campaigns c
-- JOIN public.profiles p ON p.id = c.created_by
-- WHERE c.organization_id <> p.organization_id;

-- SELECT count(*) AS mismatched_shift_campaigns
-- FROM public.driver_shifts ds
-- JOIN public.campaigns c ON c.id = ds.campaign_id
-- WHERE ds.organization_id <> c.organization_id;

-- SELECT count(*) AS mismatched_shift_drivers
-- FROM public.driver_shifts ds
-- JOIN public.profiles p ON p.id = ds.driver_profile_id
-- WHERE ds.organization_id <> p.organization_id;

-- SELECT count(*) AS mismatched_photo_campaigns
-- FROM public.campaign_photos cp
-- JOIN public.campaigns c ON c.id = cp.campaign_id
-- WHERE cp.organization_id <> c.organization_id;

-- SELECT count(*) AS mismatched_photo_uploaders
-- FROM public.campaign_photos cp
-- JOIN public.profiles p ON p.id = cp.uploaded_by
-- WHERE cp.organization_id <> p.organization_id;

-- Storage-path validation
-- SELECT count(*) AS invalid_storage_paths
-- FROM public.campaign_photos
-- WHERE storage_path IS NULL
--    OR storage_path = ''
--    OR storage_path LIKE '%..%'
--    OR storage_path NOT LIKE organization_id::text || '/%';

-- Tenant-scoped uniqueness prechecks
-- SELECT lower(username), count(*)
-- FROM public.profiles
-- WHERE organization_id = :'lonestar_org_id'
-- GROUP BY lower(username)
-- HAVING count(*) > 1;

-- SELECT lower(name), count(*)
-- FROM public.clients
-- WHERE organization_id = :'lonestar_org_id'
-- GROUP BY lower(name)
-- HAVING count(*) > 1;

-- SELECT lower(name), coalesce(lower(city), ''), count(*)
-- FROM public.routes
-- WHERE organization_id = :'lonestar_org_id'
-- GROUP BY lower(name), coalesce(lower(city), '')
-- HAVING count(*) > 1;

-- 7. Auth readiness checks
-- Verify at least one admin/driver/client profile exists inside LoneStar.
-- SELECT role, count(*) FROM public.profiles
-- WHERE organization_id = :'lonestar_org_id'
-- GROUP BY role;

-- 8. Rollback note
-- Before auth cutover, rollback should prefer:
-- - restoring backup / PITR marker if needed
-- - keeping additive columns in place
-- - disabling tenant-aware app paths
-- - withholding tenant-aware JWT claims
