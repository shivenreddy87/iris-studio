-- =========================================================
-- Platform administration + analytics foundation
-- =========================================================

-- ---------- platform_settings (versioned) ----------
CREATE TABLE public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version integer NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  note text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (version)
);

GRANT SELECT, INSERT ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read platform settings"
  ON public.platform_settings FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins write platform settings"
  ON public.platform_settings FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

INSERT INTO public.platform_settings (version, settings, note)
VALUES (1, jsonb_build_object(
  'default_participant_limit', 10,
  'default_winner_count', 3,
  'minimum_reward', 1000,
  'maximum_reward', 500000,
  'application_duration_days', 14,
  'contest_duration_days', 30,
  'payout_reminder_days', 7,
  'notification_defaults', jsonb_build_object(
    'email_enabled', true,
    'in_app_enabled', true,
    'campaign_updates', true,
    'contest_updates', true,
    'payout_updates', true,
    'marketing', false,
    'system', true
  )
), 'Initial platform defaults');

-- ---------- contest_templates ----------
CREATE TABLE public.contest_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  contest_brief text,
  contest_rules text,
  eligibility jsonb NOT NULL DEFAULT '{}'::jsonb,
  reward_pool numeric,
  participant_limit integer,
  winner_count integer,
  target_platform text,
  preferred_creator_category text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_templates TO authenticated;
GRANT ALL ON public.contest_templates TO service_role;
ALTER TABLE public.contest_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage contest templates"
  ON public.contest_templates FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_contest_templates_updated_at
  BEFORE UPDATE ON public.contest_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- platform_categories ----------
CREATE TABLE public.platform_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('business', 'creator')),
  name text NOT NULL,
  slug text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_categories TO authenticated;
GRANT SELECT ON public.platform_categories TO anon;
GRANT ALL ON public.platform_categories TO service_role;
ALTER TABLE public.platform_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active categories"
  ON public.platform_categories FOR SELECT TO anon, authenticated
  USING (is_active OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage categories"
  ON public.platform_categories FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update categories"
  ON public.platform_categories FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete categories"
  ON public.platform_categories FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_platform_categories_updated_at
  BEFORE UPDATE ON public.platform_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.platform_categories (kind, name, slug, sort_order) VALUES
  ('business', 'Fashion & Apparel', 'fashion-apparel', 1),
  ('business', 'Beauty & Personal Care', 'beauty-personal-care', 2),
  ('business', 'Food & Beverage', 'food-beverage', 3),
  ('business', 'Technology', 'technology', 4),
  ('business', 'Travel & Hospitality', 'travel-hospitality', 5),
  ('business', 'Health & Fitness', 'health-fitness', 6),
  ('business', 'Finance', 'finance', 7),
  ('business', 'Education', 'education', 8),
  ('business', 'Other', 'other', 99),
  ('creator', 'Lifestyle', 'lifestyle', 1),
  ('creator', 'Fashion', 'fashion', 2),
  ('creator', 'Beauty', 'beauty', 3),
  ('creator', 'Food', 'food', 4),
  ('creator', 'Tech', 'tech', 5),
  ('creator', 'Travel', 'travel', 6),
  ('creator', 'Fitness', 'fitness', 7),
  ('creator', 'Gaming', 'gaming', 8),
  ('creator', 'Comedy', 'comedy', 9),
  ('creator', 'Education', 'education', 10),
  ('creator', 'Other', 'other', 99);

-- ---------- platform_channels (social platforms) ----------
CREATE TABLE public.platform_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_channels TO authenticated;
GRANT SELECT ON public.platform_channels TO anon;
GRANT ALL ON public.platform_channels TO service_role;
ALTER TABLE public.platform_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active platforms"
  ON public.platform_channels FOR SELECT TO anon, authenticated
  USING (is_active OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins insert platforms"
  ON public.platform_channels FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update platforms"
  ON public.platform_channels FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete platforms"
  ON public.platform_channels FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_platform_channels_updated_at
  BEFORE UPDATE ON public.platform_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.platform_channels (name, slug, sort_order) VALUES
  ('Instagram', 'instagram', 1),
  ('TikTok', 'tiktok', 2),
  ('YouTube', 'youtube', 3);

-- ---------- moderation_records ----------
CREATE TABLE public.moderation_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type text NOT NULL CHECK (target_type IN ('business', 'influencer', 'contest', 'campaign_request', 'submission')),
  target_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('flag', 'unflag', 'suspend', 'reactivate', 'note')),
  reason text,
  note text,
  actor_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.moderation_records TO authenticated;
GRANT ALL ON public.moderation_records TO service_role;
ALTER TABLE public.moderation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read moderation records"
  ON public.moderation_records FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins write moderation records"
  ON public.moderation_records FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX idx_moderation_records_target ON public.moderation_records (target_type, target_id, created_at DESC);

-- ---------- user_suspensions ----------
CREATE TABLE public.user_suspensions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text,
  reason text NOT NULL,
  suspended_by uuid REFERENCES auth.users(id),
  suspended_at timestamptz NOT NULL DEFAULT now(),
  lifted_at timestamptz,
  lifted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_suspensions TO authenticated;
GRANT ALL ON public.user_suspensions TO service_role;
ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all suspensions"
  ON public.user_suspensions FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR user_id = auth.uid());

CREATE POLICY "Admins create suspensions"
  ON public.user_suspensions FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update suspensions"
  ON public.user_suspensions FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_user_suspensions_updated_at
  BEFORE UPDATE ON public.user_suspensions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE UNIQUE INDEX idx_user_suspensions_active ON public.user_suspensions (user_id) WHERE lifted_at IS NULL;

-- ---------- achievements ----------
CREATE TABLE public.achievement_definitions (
  code text NOT NULL PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.achievement_definitions TO authenticated;
GRANT ALL ON public.achievement_definitions TO service_role;
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed in users read achievement definitions"
  ON public.achievement_definitions FOR SELECT TO authenticated
  USING (true);

INSERT INTO public.achievement_definitions (code, title, description, icon, sort_order) VALUES
  ('first_application', 'First Application', 'Submitted your first contest application.', 'send', 1),
  ('first_selection', 'First Selection', 'Selected as a participant for the first time.', 'user-check', 2),
  ('first_win', 'First Win', 'Won your first contest.', 'trophy', 3),
  ('top_performer', 'Top Performer', 'Finished first in a contest.', 'crown', 4),
  ('fast_responder', 'Fast Responder', 'Submitted content within 48 hours of selection.', 'zap', 5),
  ('consistent_creator', 'Consistent Creator', 'Completed five or more contests.', 'repeat', 6);

CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL REFERENCES public.achievement_definitions(code) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);

GRANT SELECT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own achievements"
  ON public.user_achievements FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- ---------- analytics indexes ----------
CREATE INDEX IF NOT EXISTS idx_contests_business_status ON public.contests (business_id, status);
CREATE INDEX IF NOT EXISTS idx_contests_created_at ON public.contests (created_at);
CREATE INDEX IF NOT EXISTS idx_contest_applications_contest ON public.contest_applications (contest_id, status);
CREATE INDEX IF NOT EXISTS idx_contest_applications_influencer ON public.contest_applications (influencer_id, status);
CREATE INDEX IF NOT EXISTS idx_contest_applications_created_at ON public.contest_applications (created_at);
CREATE INDEX IF NOT EXISTS idx_contest_participants_contest ON public.contest_participants (contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_participants_influencer ON public.contest_participants (influencer_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_contest ON public.contest_submissions (contest_id, submission_status);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_influencer ON public.contest_submissions (influencer_id);
CREATE INDEX IF NOT EXISTS idx_contest_winners_contest ON public.contest_winners (contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_winners_influencer ON public.contest_winners (influencer_id);
CREATE INDEX IF NOT EXISTS idx_payouts_contest ON public.payouts (contest_id, status);
CREATE INDEX IF NOT EXISTS idx_payouts_influencer ON public.payouts (influencer_id, status);
CREATE INDEX IF NOT EXISTS idx_payouts_business ON public.payouts (business_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_requests_business_status ON public.campaign_requests (business_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_requests_created_at ON public.campaign_requests (created_at);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON public.activity_feed (created_at DESC);

-- ---------- statistics views ----------
CREATE VIEW public.contest_statistics
WITH (security_invoker = on) AS
SELECT
  c.id AS contest_id,
  c.business_id,
  c.title,
  c.status,
  c.reward_pool,
  c.participant_limit,
  c.winner_count,
  c.created_at,
  c.contest_end_date,
  (SELECT count(*) FROM public.contest_applications a WHERE a.contest_id = c.id) AS application_count,
  (SELECT count(*) FROM public.contest_applications a WHERE a.contest_id = c.id AND a.status = 'shortlisted') AS shortlisted_count,
  (SELECT count(*) FROM public.contest_participants p WHERE p.contest_id = c.id) AS participant_count,
  (SELECT count(*) FROM public.contest_submissions s WHERE s.contest_id = c.id) AS submission_count,
  (SELECT count(*) FROM public.contest_submissions s WHERE s.contest_id = c.id AND s.submission_status = 'verified') AS verified_count,
  (SELECT count(*) FROM public.contest_winners w WHERE w.contest_id = c.id) AS winner_count_actual,
  (SELECT COALESCE(sum(w.reward_amount), 0) FROM public.contest_winners w WHERE w.contest_id = c.id) AS reward_awarded,
  (SELECT COALESCE(sum(p.amount), 0) FROM public.payouts p WHERE p.contest_id = c.id AND p.status = 'paid') AS reward_paid,
  (SELECT COALESCE(avg(s.engagement_rate), 0) FROM public.contest_submissions s WHERE s.contest_id = c.id) AS avg_engagement
FROM public.contests c;

GRANT SELECT ON public.contest_statistics TO authenticated;
GRANT ALL ON public.contest_statistics TO service_role;

CREATE VIEW public.business_statistics
WITH (security_invoker = on) AS
SELECT
  o.id AS business_id,
  (SELECT count(*) FROM public.campaign_requests r WHERE r.business_id = o.id) AS request_count,
  (SELECT count(*) FROM public.campaign_requests r WHERE r.business_id = o.id AND r.status = 'approved') AS approved_request_count,
  (SELECT count(*) FROM public.contests c WHERE c.business_id = o.id) AS contest_count,
  (SELECT count(*) FROM public.contests c WHERE c.business_id = o.id AND c.status = 'completed') AS completed_contest_count,
  (SELECT count(*) FROM public.contest_applications a JOIN public.contests c ON c.id = a.contest_id WHERE c.business_id = o.id) AS application_count,
  (SELECT count(*) FROM public.contest_participants p JOIN public.contests c ON c.id = p.contest_id WHERE c.business_id = o.id) AS participant_count,
  (SELECT count(*) FROM public.contest_submissions s JOIN public.contests c ON c.id = s.contest_id WHERE c.business_id = o.id) AS submission_count,
  (SELECT count(*) FROM public.contest_submissions s JOIN public.contests c ON c.id = s.contest_id WHERE c.business_id = o.id AND s.submission_status = 'verified') AS verified_submission_count,
  (SELECT COALESCE(sum(p.amount), 0) FROM public.payouts p WHERE p.business_id = o.id AND p.status = 'paid') AS reward_distributed,
  (SELECT COALESCE(avg(s.engagement_rate), 0) FROM public.contest_submissions s JOIN public.contests c ON c.id = s.contest_id WHERE c.business_id = o.id) AS avg_engagement
FROM public.profiles o;

GRANT SELECT ON public.business_statistics TO authenticated;
GRANT ALL ON public.business_statistics TO service_role;

CREATE VIEW public.influencer_statistics
WITH (security_invoker = on) AS
SELECT
  p.id AS influencer_id,
  (SELECT count(*) FROM public.contest_applications a WHERE a.influencer_id = p.id) AS application_count,
  (SELECT count(*) FROM public.contest_applications a WHERE a.influencer_id = p.id AND a.status IN ('shortlisted', 'selected')) AS accepted_count,
  (SELECT count(*) FROM public.contest_participants cp WHERE cp.influencer_id = p.id) AS selected_count,
  (SELECT count(*) FROM public.contest_submissions s WHERE s.influencer_id = p.id) AS submission_count,
  (SELECT count(*) FROM public.contest_submissions s WHERE s.influencer_id = p.id AND s.submission_status = 'verified') AS verified_count,
  (SELECT count(*) FROM public.contest_winners w WHERE w.influencer_id = p.id) AS win_count,
  (SELECT count(*) FROM public.contest_winners w WHERE w.influencer_id = p.id AND w.rank = 1) AS first_place_count,
  (SELECT COALESCE(sum(w.reward_amount), 0) FROM public.contest_winners w WHERE w.influencer_id = p.id) AS reward_won,
  (SELECT COALESCE(sum(po.amount), 0) FROM public.payouts po WHERE po.influencer_id = p.id AND po.status = 'paid') AS reward_paid,
  (SELECT COALESCE(avg(s.engagement_rate), 0) FROM public.contest_submissions s WHERE s.influencer_id = p.id) AS avg_engagement
FROM public.profiles p;

GRANT SELECT ON public.influencer_statistics TO authenticated;
GRANT ALL ON public.influencer_statistics TO service_role;

CREATE VIEW public.platform_statistics
WITH (security_invoker = on) AS
SELECT
  (SELECT count(*) FROM public.profiles) AS user_count,
  (SELECT count(*) FROM public.user_roles WHERE role = 'brand') AS business_count,
  (SELECT count(*) FROM public.user_roles WHERE role = 'creator') AS influencer_count,
  (SELECT count(*) FROM public.campaign_requests) AS request_count,
  (SELECT count(*) FROM public.campaign_requests WHERE status = 'submitted') AS pending_request_count,
  (SELECT count(*) FROM public.contests) AS contest_count,
  (SELECT count(*) FROM public.contests WHERE status = 'live') AS live_contest_count,
  (SELECT count(*) FROM public.contests WHERE status = 'completed') AS completed_contest_count,
  (SELECT count(*) FROM public.contest_applications) AS application_count,
  (SELECT count(*) FROM public.contest_participants) AS participant_count,
  (SELECT count(*) FROM public.contest_submissions) AS submission_count,
  (SELECT count(*) FROM public.contest_submissions WHERE submission_status = 'verified') AS verified_submission_count,
  (SELECT count(*) FROM public.contest_winners) AS winner_count,
  (SELECT COALESCE(sum(reward_amount), 0) FROM public.contest_winners) AS reward_awarded,
  (SELECT COALESCE(sum(amount), 0) FROM public.payouts WHERE status = 'paid') AS reward_paid,
  (SELECT COALESCE(sum(amount), 0) FROM public.payouts WHERE status <> 'paid' AND status <> 'cancelled') AS reward_pending,
  (SELECT count(*) FROM public.user_suspensions WHERE lifted_at IS NULL) AS active_suspension_count;

GRANT SELECT ON public.platform_statistics TO authenticated;
GRANT ALL ON public.platform_statistics TO service_role;