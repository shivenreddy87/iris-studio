ALTER TYPE public.campaign_request_status ADD VALUE IF NOT EXISTS 'changes_requested';

ALTER TABLE public.campaign_requests
  ADD COLUMN IF NOT EXISTS review_reason TEXT,
  ADD COLUMN IF NOT EXISTS approval_reference TEXT UNIQUE;

CREATE SEQUENCE IF NOT EXISTS public.campaign_request_approval_seq START 1;
GRANT USAGE ON SEQUENCE public.campaign_request_approval_seq TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.next_approval_reference()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT 'APR-' || lpad(nextval('public.campaign_request_approval_seq')::text, 6, '0');
$$;

CREATE TABLE IF NOT EXISTS public.campaign_request_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.campaign_requests(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  note TEXT,
  internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_request_events_request_idx
  ON public.campaign_request_events (request_id, created_at);

GRANT SELECT, INSERT ON public.campaign_request_events TO authenticated;
GRANT ALL ON public.campaign_request_events TO service_role;

ALTER TABLE public.campaign_request_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and admins can read request events"
ON public.campaign_request_events
FOR SELECT
TO authenticated
USING (
  private.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.campaign_requests r
    WHERE r.id = campaign_request_events.request_id
      AND r.business_id = auth.uid()
  )
);

CREATE POLICY "Owners and admins can write request events"
ON public.campaign_request_events
FOR INSERT
TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND (
    private.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.campaign_requests r
      WHERE r.id = campaign_request_events.request_id
        AND r.business_id = auth.uid()
    )
  )
);
