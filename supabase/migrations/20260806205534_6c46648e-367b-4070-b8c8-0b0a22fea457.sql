-- 1. Social account verification -------------------------------------------

ALTER TABLE public.connected_accounts
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_code text,
  ADD COLUMN IF NOT EXISTS verification_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'connected_accounts_verification_status_check'
  ) THEN
    ALTER TABLE public.connected_accounts
      ADD CONSTRAINT connected_accounts_verification_status_check
      CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS connected_accounts_user_platform_key
  ON public.connected_accounts (user_id, platform);

CREATE INDEX IF NOT EXISTS connected_accounts_verification_status_idx
  ON public.connected_accounts (verification_status);

CREATE OR REPLACE FUNCTION public.guard_connected_account_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.verification_status := 'unverified';
    NEW.verified_at := NULL;
    NEW.verified_by := NULL;
    NEW.rejection_reason := NULL;
    RETURN NEW;
  END IF;

  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     AND NOT (NEW.verification_status = 'pending' AND OLD.verification_status <> 'verified') THEN
    NEW.verification_status := OLD.verification_status;
  END IF;

  NEW.verified_at := OLD.verified_at;
  NEW.verified_by := OLD.verified_by;
  NEW.rejection_reason := OLD.rejection_reason;

  IF NEW.verification_status = 'verified'
     AND (NEW.handle IS DISTINCT FROM OLD.handle OR NEW.profile_url IS DISTINCT FROM OLD.profile_url)
  THEN
    NEW.verification_status := 'unverified';
    NEW.verified_at := NULL;
    NEW.verified_by := NULL;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_connected_account_verification() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_connected_account_verification ON public.connected_accounts;
CREATE TRIGGER trg_guard_connected_account_verification
  BEFORE INSERT OR UPDATE ON public.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION public.guard_connected_account_verification();

DROP POLICY IF EXISTS "Admins manage connected accounts" ON public.connected_accounts;
CREATE POLICY "Admins manage connected accounts"
  ON public.connected_accounts FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.connected_accounts TO authenticated;
GRANT ALL ON public.connected_accounts TO service_role;

-- 2. Scheduled analytics rollups --------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.refresh_all_analytics_rollups()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org record;
  _count integer := 0;
BEGIN
  FOR _org IN SELECT id FROM public.organizations LOOP
    PERFORM public.refresh_analytics_rollups(_org.id);
    _count := _count + 1;
  END LOOP;
  RETURN _count;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_all_analytics_rollups() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_all_analytics_rollups() TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule('refresh-analytics-rollups');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'refresh-analytics-rollups',
  '*/15 * * * *',
  $$SELECT public.refresh_all_analytics_rollups();$$
);