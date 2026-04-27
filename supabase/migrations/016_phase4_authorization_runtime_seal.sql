-- ============================================================
-- phase 4: runtime authorization seal for shifts/proofs
-- Ensure effective INSERT/storage policies enforce campaign assignment.
-- ============================================================

-- -----------------------------
-- driver_shifts INSERT hardening
-- -----------------------------
DROP POLICY IF EXISTS "driver_shifts: driver own" ON public.driver_shifts;
DROP POLICY IF EXISTS "driver_shifts: driver own insert assigned campaign" ON public.driver_shifts;

CREATE POLICY "driver_shifts: driver own insert assigned campaign"
  ON public.driver_shifts FOR INSERT
  WITH CHECK (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'driver'
    AND driver_profile_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.campaigns c
      WHERE c.id = driver_shifts.campaign_id
        AND c.organization_id = driver_shifts.organization_id
        AND c.driver_profile_id = auth.uid()
        AND c.status = 'active'
    )
  );

-- -------------------------------
-- campaign_photos INSERT hardening
-- -------------------------------
DROP POLICY IF EXISTS "campaign_photos: driver insert own" ON public.campaign_photos;
DROP POLICY IF EXISTS "campaign_photos: driver insert own assigned campaign" ON public.campaign_photos;

CREATE POLICY "campaign_photos: driver insert own assigned campaign"
  ON public.campaign_photos FOR INSERT
  WITH CHECK (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'driver'
    AND uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.campaigns c
      WHERE c.id = campaign_photos.campaign_id
        AND c.organization_id = campaign_photos.organization_id
        AND c.driver_profile_id = auth.uid()
        AND c.status = 'active'
    )
  );

-- -------------------------------------
-- storage.objects upload assignment gate
-- -------------------------------------
CREATE OR REPLACE FUNCTION public.get_campaign_id_from_proof_object_name(object_name text)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN object_name ~ '^[0-9a-fA-F-]{36}/campaigns/[0-9a-fA-F-]{36}/proofs/[A-Za-z0-9][A-Za-z0-9._-]*$'
      THEN split_part(object_name, '/', 3)::uuid
    ELSE NULL::uuid
  END
$$;

DROP POLICY IF EXISTS "campaign proof objects: admin or driver upload" ON storage.objects;

CREATE POLICY "campaign proof objects: admin or driver upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-proofs'
    AND public.is_valid_campaign_proof_object_name(name)
    AND name LIKE public.get_jwt_org_id()::text || '/%'
    AND (
      public.get_jwt_org_role() = 'admin'
      OR (
        public.get_jwt_org_role() = 'driver'
        AND EXISTS (
          SELECT 1
          FROM public.campaigns c
          WHERE c.id = public.get_campaign_id_from_proof_object_name(name)
            AND c.organization_id = public.get_jwt_org_id()
            AND c.driver_profile_id = auth.uid()
            AND c.status = 'active'
        )
      )
    )
  );
