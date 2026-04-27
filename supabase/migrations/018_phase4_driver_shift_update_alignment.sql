-- ============================================================
-- phase 4: align driver_shifts update path after 016/017
-- Ensure assigned drivers can end their own active shifts.
-- ============================================================

DROP POLICY IF EXISTS "driver_shifts: driver own update" ON public.driver_shifts;

CREATE POLICY "driver_shifts: driver own update"
  ON public.driver_shifts FOR UPDATE
  USING (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'driver'
    AND driver_profile_id = auth.uid()
    AND shift_status = 'active'
    AND ended_at IS NULL
  )
  WITH CHECK (
    organization_id = public.get_jwt_org_id()
    AND public.get_jwt_org_role() = 'driver'
    AND driver_profile_id = auth.uid()
    AND shift_status = 'completed'
    AND ended_at IS NOT NULL
  );
