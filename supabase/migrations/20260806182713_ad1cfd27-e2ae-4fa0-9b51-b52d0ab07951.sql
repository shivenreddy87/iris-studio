CREATE TABLE public.saved_contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  influencer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contest_id, influencer_id)
);

CREATE INDEX saved_contests_influencer_idx ON public.saved_contests (influencer_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.saved_contests TO authenticated;
GRANT ALL ON public.saved_contests TO service_role;

ALTER TABLE public.saved_contests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Influencers read own saved contests"
ON public.saved_contests FOR SELECT TO authenticated
USING (influencer_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Influencers save contests"
ON public.saved_contests FOR INSERT TO authenticated
WITH CHECK (influencer_id = auth.uid());

CREATE POLICY "Influencers remove own saved contests"
ON public.saved_contests FOR DELETE TO authenticated
USING (influencer_id = auth.uid());

CREATE POLICY "Discoverable contests visible to authenticated users"
ON public.contests FOR SELECT TO authenticated
USING (
  status IN ('published'::public.contest_status, 'applications_open'::public.contest_status)
  AND archived_at IS NULL
  AND published_at IS NOT NULL
  AND published_at <= now()
);