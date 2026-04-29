-- ============================================================
-- phase 4: align driver_shifts select visibility after 016
-- Ensures authorized driver INSERT + returning path succeeds.
-- ============================================================

DROP POLICY IF EXISTS "driver_shifts: driver own select" ON public.driver_shifts;

CREATE POLICY "driver_shifts: driver own select"
  ON public.driver_shifts FOR SELECT
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'driver'
    AND driver_profile_id = auth.uid()
  );
