-- ============================================================
-- tenant storage: campaign proof bucket and object RLS
-- ============================================================

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'campaign-proofs',
  'campaign-proofs',
  false,
  15728640,
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

CREATE OR REPLACE FUNCTION public.is_valid_campaign_proof_object_name(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    object_name IS NOT NULL
    AND object_name <> ''
    AND object_name NOT LIKE '%..%'
    AND object_name ~ '^[0-9a-fA-F-]{36}/campaigns/[0-9a-fA-F-]{36}/proofs/[A-Za-z0-9][A-Za-z0-9._-]*$'
$$;

DROP POLICY IF EXISTS "campaign proof objects: tenant read" ON storage.objects;
CREATE POLICY "campaign proof objects: tenant read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'campaign-proofs'
    AND public.is_valid_campaign_proof_object_name(name)
    AND name LIKE public.get_jwt_org_id()::text || '/%'
    AND public.get_jwt_org_role() IN ('admin', 'driver', 'client')
  );

DROP POLICY IF EXISTS "campaign proof objects: admin or driver upload" ON storage.objects;
CREATE POLICY "campaign proof objects: admin or driver upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-proofs'
    AND public.is_valid_campaign_proof_object_name(name)
    AND name LIKE public.get_jwt_org_id()::text || '/%'
    AND public.get_jwt_org_role() IN ('admin', 'driver')
  );

DROP POLICY IF EXISTS "campaign proof objects: admin or driver delete" ON storage.objects;
CREATE POLICY "campaign proof objects: admin or driver delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'campaign-proofs'
    AND public.is_valid_campaign_proof_object_name(name)
    AND name LIKE public.get_jwt_org_id()::text || '/%'
    AND public.get_jwt_org_role() IN ('admin', 'driver')
  );
