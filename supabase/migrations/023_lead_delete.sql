-- Allow admin-role users to delete lead submissions.
-- The table already has SELECT and UPDATE granted to authenticated;
-- DELETE was never added, and no RLS DELETE policy existed.

GRANT DELETE ON public.lead_submissions TO authenticated;

CREATE POLICY "Admins can delete lead_submissions"
  ON public.lead_submissions FOR DELETE
  TO authenticated
  USING (is_admin_role());
