CREATE TYPE public.contest_submission_status AS ENUM ('pending', 'submitted', 'verified', 'flagged');

CREATE TABLE public.contest_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.contest_participants(id) ON DELETE CASCADE,
  influencer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  content_url text NOT NULL,
  caption text,
  notes text,
  submission_status public.contest_submission_status NOT NULL DEFAULT 'submitted',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contest_submissions_participant_unique UNIQUE (participant_id)
);

CREATE INDEX contest_submissions_contest_idx ON public.contest_submissions (contest_id);
CREATE INDEX contest_submissions_influencer_idx ON public.contest_submissions (influencer_id);

GRANT SELECT, INSERT ON public.contest_submissions TO authenticated;
GRANT UPDATE ON public.contest_submissions TO authenticated;
GRANT ALL ON public.contest_submissions TO service_role;

ALTER TABLE public.contest_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Influencers read own submission"
  ON public.contest_submissions FOR SELECT TO authenticated
  USING (influencer_id = auth.uid());

CREATE POLICY "Admins read all submissions"
  ON public.contest_submissions FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Influencers create own submission"
  ON public.contest_submissions FOR INSERT TO authenticated
  WITH CHECK (influencer_id = auth.uid());

CREATE POLICY "Admins review submissions"
  ON public.contest_submissions FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_contest_submissions_updated_at
  BEFORE UPDATE ON public.contest_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.contest_submission_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.contest_submissions(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX contest_submission_events_submission_idx ON public.contest_submission_events (submission_id);

GRANT SELECT, INSERT ON public.contest_submission_events TO authenticated;
GRANT ALL ON public.contest_submission_events TO service_role;

ALTER TABLE public.contest_submission_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Submission owner reads events"
  ON public.contest_submission_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.contest_submissions s
    WHERE s.id = contest_submission_events.submission_id
      AND s.influencer_id = auth.uid()
  ));

CREATE POLICY "Admins read submission events"
  ON public.contest_submission_events FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Participants and admins write submission events"
  ON public.contest_submission_events FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.contest_submissions s
      WHERE s.id = contest_submission_events.submission_id
        AND (s.influencer_id = auth.uid() OR private.has_role(auth.uid(), 'admin'))
    )
  );