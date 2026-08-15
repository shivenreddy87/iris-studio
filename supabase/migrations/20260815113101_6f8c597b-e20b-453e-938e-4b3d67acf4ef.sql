-- 1. connected_accounts extensions
ALTER TABLE public.connected_accounts
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS provider_user_id text,
  ADD COLUMN IF NOT EXISTS connection_status text NOT NULL DEFAULT 'connected';

CREATE UNIQUE INDEX IF NOT EXISTS connected_accounts_one_primary_per_platform
  ON public.connected_accounts (user_id, platform)
  WHERE is_primary;

-- 2. contest_submissions metrics architecture
ALTER TABLE public.contest_submissions
  ADD COLUMN IF NOT EXISTS reach integer,
  ADD COLUMN IF NOT EXISTS metrics_source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS metrics_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS metrics_last_synced_at timestamptz;

-- 3. contest_winners performance linkage
ALTER TABLE public.contest_winners
  ADD COLUMN IF NOT EXISTS verified_views integer,
  ADD COLUMN IF NOT EXISTS reward_tier_id uuid;

-- 4. reward tiers
CREATE TABLE IF NOT EXISTS public.contest_reward_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  minimum_views bigint NOT NULL,
  maximum_views bigint,
  reward_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contest_reward_tiers_min_nonneg CHECK (minimum_views >= 0),
  CONSTRAINT contest_reward_tiers_amount_nonneg CHECK (reward_amount >= 0),
  CONSTRAINT contest_reward_tiers_range_valid CHECK (maximum_views IS NULL OR maximum_views >= minimum_views)
);

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.contest_reward_tiers
  DROP CONSTRAINT IF EXISTS contest_reward_tiers_no_overlap;
ALTER TABLE public.contest_reward_tiers
  ADD CONSTRAINT contest_reward_tiers_no_overlap
  EXCLUDE USING gist (
    contest_id WITH =,
    int8range(minimum_views, COALESCE(maximum_views, 9223372036854775806), '[]') WITH &&
  );

CREATE INDEX IF NOT EXISTS contest_reward_tiers_contest_idx
  ON public.contest_reward_tiers (contest_id, minimum_views);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_reward_tiers TO authenticated;
GRANT ALL ON public.contest_reward_tiers TO service_role;

ALTER TABLE public.contest_reward_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read reward tiers" ON public.contest_reward_tiers;
CREATE POLICY "Authenticated can read reward tiers"
  ON public.contest_reward_tiers FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage reward tiers" ON public.contest_reward_tiers;
CREATE POLICY "Admins manage reward tiers"
  ON public.contest_reward_tiers FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS trg_contest_reward_tiers_updated_at ON public.contest_reward_tiers;
CREATE TRIGGER trg_contest_reward_tiers_updated_at
  BEFORE UPDATE ON public.contest_reward_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();