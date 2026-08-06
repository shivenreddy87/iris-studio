CREATE TYPE public.campaign_request_status AS ENUM ('draft','submitted','under_review','approved','rejected','cancelled');

CREATE TABLE public.campaign_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  campaign_goal text,
  business_category text,
  target_audience text,
  target_platform text,
  target_location text,
  required_views integer,
  budget numeric,
  duration_days integer,
  preferred_creator_category text,
  minimum_followers integer,
  maximum_followers integer,
  campaign_description text,
  attachment_url text,
  status public.campaign_request_status NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX campaign_requests_business_idx ON public.campaign_requests (business_id, created_at DESC);
CREATE INDEX campaign_requests_status_idx ON public.campaign_requests (status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_requests TO authenticated;
GRANT ALL ON public.campaign_requests TO service_role;

ALTER TABLE public.campaign_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own campaign requests"
ON public.campaign_requests FOR SELECT TO authenticated
USING (business_id = auth.uid());

CREATE POLICY "Admins read all campaign requests"
ON public.campaign_requests FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Owners create own campaign requests"
ON public.campaign_requests FOR INSERT TO authenticated
WITH CHECK (business_id = auth.uid());

CREATE POLICY "Owners update own draft campaign requests"
ON public.campaign_requests FOR UPDATE TO authenticated
USING (business_id = auth.uid() AND status = 'draft')
WITH CHECK (business_id = auth.uid() AND status IN ('draft','submitted'));

CREATE POLICY "Owners delete own draft campaign requests"
ON public.campaign_requests FOR DELETE TO authenticated
USING (business_id = auth.uid() AND status = 'draft');

CREATE TRIGGER trg_campaign_requests_updated_at
BEFORE UPDATE ON public.campaign_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();