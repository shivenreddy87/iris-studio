-- 1. Performance metrics on submissions
ALTER TABLE public.contest_submissions
  ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_score numeric,
  ADD COLUMN IF NOT EXISTS review_notes text;

-- 2. Winners
CREATE TABLE public.contest_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.contest_participants(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.contest_submissions(id) ON DELETE CASCADE,
  influencer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank integer NOT NULL CHECK (rank > 0),
  performance_score numeric NOT NULL DEFAULT 0,
  manual_score numeric,
  final_score numeric NOT NULL DEFAULT 0,
  reward_amount numeric,
  winner_notes text,
  selected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  selected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contest_id, rank),
  UNIQUE (contest_id, influencer_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_winners TO authenticated;
GRANT ALL ON public.contest_winners TO service_role;

ALTER TABLE public.contest_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage contest winners"
ON public.contest_winners FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Influencers read their own wins"
ON public.contest_winners FOR SELECT TO authenticated
USING (influencer_id = auth.uid());

CREATE POLICY "Businesses read winners of their contests"
ON public.contest_winners FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.contests c
  WHERE c.id = contest_winners.contest_id AND c.business_id = auth.uid()
));

CREATE TRIGGER trg_contest_winners_updated_at
BEFORE UPDATE ON public.contest_winners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_contest_winners_contest ON public.contest_winners(contest_id);
CREATE INDEX idx_contest_winners_influencer ON public.contest_winners(influencer_id);

-- 3. Result events (insert-only audit trail)
CREATE TABLE public.contest_result_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('winner_selected','winner_removed','winner_finalized','contest_completed')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.contest_result_events TO authenticated;
GRANT ALL ON public.contest_result_events TO service_role;

ALTER TABLE public.contest_result_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage contest result events"
ON public.contest_result_events FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Businesses read result events for their contests"
ON public.contest_result_events FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.contests c
  WHERE c.id = contest_result_events.contest_id AND c.business_id = auth.uid()
));

CREATE POLICY "Participants read result events for their contests"
ON public.contest_result_events FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.contest_participants p
  WHERE p.contest_id = contest_result_events.contest_id AND p.influencer_id = auth.uid()
));

CREATE INDEX idx_contest_result_events_contest ON public.contest_result_events(contest_id, created_at);