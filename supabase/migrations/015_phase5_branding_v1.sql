-- ============================================================
-- phase 5: branding v1 (logo + primary color)
-- ============================================================

DROP POLICY IF EXISTS "organization_branding: tenant admin update" ON public.organization_branding;
CREATE POLICY "organization_branding: tenant admin update"
  ON public.organization_branding FOR UPDATE
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  )
  WITH CHECK (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'admin'
  );

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'branding-logos',
  'branding-logos',
  false,
  5242880,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.is_valid_branding_logo_object_name(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    object_name IS NOT NULL
    AND object_name <> ''
    AND object_name NOT LIKE '%..%'
    AND object_name ~ '^[0-9a-fA-F-]{36}/branding/[A-Za-z0-9][A-Za-z0-9._-]*$'
$$;

DROP POLICY IF EXISTS "branding logo objects: tenant read" ON storage.objects;
CREATE POLICY "branding logo objects: tenant read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'branding-logos'
    AND public.is_valid_branding_logo_object_name(name)
    AND name LIKE public.get_jwt_org_id()::text || '/%'
    AND public.get_jwt_org_role() IN ('admin', 'driver', 'client')
  );

DROP POLICY IF EXISTS "branding logo objects: admin upload" ON storage.objects;
CREATE POLICY "branding logo objects: admin upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'branding-logos'
    AND public.is_valid_branding_logo_object_name(name)
    AND name LIKE public.get_jwt_org_id()::text || '/%'
    AND public.get_jwt_org_role() = 'admin'
  );

DROP POLICY IF EXISTS "branding logo objects: admin delete" ON storage.objects;
CREATE POLICY "branding logo objects: admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'branding-logos'
    AND public.is_valid_branding_logo_object_name(name)
    AND name LIKE public.get_jwt_org_id()::text || '/%'
    AND public.get_jwt_org_role() = 'admin'
  );
