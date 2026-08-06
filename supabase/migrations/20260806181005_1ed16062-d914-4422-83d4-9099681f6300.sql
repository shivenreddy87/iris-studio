CREATE TYPE public.contest_status AS ENUM (
  'draft','published','applications_open','applications_closed','participant_selection','live','completed','archived'
);

CREATE TABLE public.contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_request_id uuid NOT NULL UNIQUE REFERENCES public.campaign_requests(id) ON DELETE RESTRICT,
  business_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  campaign_goal text,
  business_category text,
  target_platform text,
  target_location text,
  required_views integer,
  reward_pool numeric,
  participant_limit integer,
  winner_count integer,
  preferred_creator_category text,
  minimum_followers integer,
  maximum_followers integer,
  application_start_date date,
  application_deadline date,
  contest_start_date date,
  contest_end_date date,
  contest_brief text,
  contest_rules text,
  attachment_url text,
  status public.contest_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  archived_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contests TO authenticated;
GRANT ALL ON public.contests TO service_role;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage contests" ON public.contests
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Businesses read own contests" ON public.contests
  FOR SELECT TO authenticated
  USING (business_id = auth.uid());

CREATE TRIGGER trg_contests_updated_at
  BEFORE UPDATE ON public.contests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_contests_status ON public.contests(status);
CREATE INDEX idx_contests_business ON public.contests(business_id);

CREATE TABLE public.contest_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.contest_events TO authenticated;
GRANT ALL ON public.contest_events TO service_role;
ALTER TABLE public.contest_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage contest events" ON public.contest_events
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Businesses read own contest events" ON public.contest_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.contests c
    WHERE c.id = contest_events.contest_id AND c.business_id = auth.uid()
  ));

CREATE INDEX idx_contest_events_contest ON public.contest_events(contest_id, created_at);