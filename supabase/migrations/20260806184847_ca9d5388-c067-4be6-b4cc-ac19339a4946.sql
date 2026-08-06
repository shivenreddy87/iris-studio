CREATE TYPE public.participation_status AS ENUM ('active', 'removed', 'completed');

CREATE TABLE public.contest_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.contest_applications(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activated_at TIMESTAMP WITH TIME ZONE,
  participation_status public.participation_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (contest_id, influencer_id)
);

CREATE INDEX idx_contest_participants_contest ON public.contest_participants(contest_id);
CREATE INDEX idx_contest_participants_influencer ON public.contest_participants(influencer_id);

GRANT SELECT ON public.contest_participants TO authenticated;
GRANT ALL ON public.contest_participants TO service_role;

ALTER TABLE public.contest_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Influencers view their own participation"
ON public.contest_participants FOR SELECT TO authenticated
USING (auth.uid() = influencer_id);

CREATE POLICY "Admins view all participants"
ON public.contest_participants FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'));