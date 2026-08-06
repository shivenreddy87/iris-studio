CREATE TYPE public.contest_application_status AS ENUM ('submitted','withdrawn','shortlisted','selected','rejected');

CREATE TABLE public.contest_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  influencer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_url text NOT NULL,
  content_idea text NOT NULL,
  notes text,
  status public.contest_application_status NOT NULL DEFAULT 'submitted',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contest_id, influencer_id)
);

GRANT SELECT, INSERT, UPDATE ON public.contest_applications TO authenticated;
GRANT ALL ON public.contest_applications TO service_role;
ALTER TABLE public.contest_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Influencers read own applications"
  ON public.contest_applications FOR SELECT TO authenticated
  USING (influencer_id = auth.uid());

CREATE POLICY "Admins read all applications"
  ON public.contest_applications FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Influencers create own applications"
  ON public.contest_applications FOR INSERT TO authenticated
  WITH CHECK (influencer_id = auth.uid());

CREATE POLICY "Influencers update own applications"
  ON public.contest_applications FOR UPDATE TO authenticated
  USING (influencer_id = auth.uid())
  WITH CHECK (influencer_id = auth.uid());

CREATE TRIGGER trg_contest_applications_updated_at
  BEFORE UPDATE ON public.contest_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_contest_applications_contest ON public.contest_applications(contest_id);
CREATE INDEX idx_contest_applications_influencer ON public.contest_applications(influencer_id);

CREATE TABLE public.contest_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.contest_applications(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.contest_application_events TO authenticated;
GRANT ALL ON public.contest_application_events TO service_role;
ALTER TABLE public.contest_application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants read own application history"
  ON public.contest_application_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.contest_applications a
    WHERE a.id = application_id AND a.influencer_id = auth.uid()
  ));

CREATE POLICY "Admins read all application history"
  ON public.contest_application_events FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Applicants log own application history"
  ON public.contest_application_events FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.contest_applications a
      WHERE a.id = application_id AND a.influencer_id = auth.uid()
    )
  );

CREATE INDEX idx_contest_application_events_application
  ON public.contest_application_events(application_id);

-- Aggregate counts for the owning business (and admins) without exposing applicants.
CREATE OR REPLACE FUNCTION public.contest_application_counts(_contest_id uuid)
RETURNS TABLE (status public.contest_application_status, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.status, count(*)::bigint
  FROM public.contest_applications a
  JOIN public.contests c ON c.id = a.contest_id
  WHERE a.contest_id = _contest_id
    AND (c.business_id = auth.uid() OR private.has_role(auth.uid(), 'admin'))
  GROUP BY a.status;
$$;

REVOKE ALL ON FUNCTION public.contest_application_counts(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contest_application_counts(uuid) TO authenticated, service_role;