DROP POLICY IF EXISTS "Owners update own draft campaign requests" ON public.campaign_requests;

CREATE POLICY "Owners update own editable campaign requests"
ON public.campaign_requests
FOR UPDATE
TO authenticated
USING (
  business_id = auth.uid()
  AND status = ANY (ARRAY['draft'::campaign_request_status, 'changes_requested'::campaign_request_status])
)
WITH CHECK (
  business_id = auth.uid()
  AND status = ANY (ARRAY['draft'::campaign_request_status, 'changes_requested'::campaign_request_status, 'submitted'::campaign_request_status])
);

CREATE POLICY "Admins update campaign requests"
ON public.campaign_requests
FOR UPDATE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));
