-- Storage policies (buckets already created via storage_create_bucket)
DROP POLICY IF EXISTS "avatar read" ON storage.objects;
CREATE POLICY "avatar read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatar owner write" ON storage.objects;
CREATE POLICY "avatar owner write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "avatar owner update" ON storage.objects;
CREATE POLICY "avatar owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "avatar owner delete" ON storage.objects;
CREATE POLICY "avatar owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "media-kit read" ON storage.objects;
CREATE POLICY "media-kit read" ON storage.objects
  FOR SELECT USING (bucket_id = 'media-kit');

DROP POLICY IF EXISTS "media-kit owner write" ON storage.objects;
CREATE POLICY "media-kit owner write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media-kit' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "media-kit owner update" ON storage.objects;
CREATE POLICY "media-kit owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media-kit' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "media-kit owner delete" ON storage.objects;
CREATE POLICY "media-kit owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media-kit' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Analytics rollups
CREATE TABLE IF NOT EXISTS public.analytics_rollups (
  org_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_count integer NOT NULL DEFAULT 0,
  active_campaigns integer NOT NULL DEFAULT 0,
  total_spend numeric NOT NULL DEFAULT 0,
  total_reach bigint NOT NULL DEFAULT 0,
  avg_engagement numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.analytics_rollups TO authenticated;
GRANT ALL ON public.analytics_rollups TO service_role;

ALTER TABLE public.analytics_rollups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org owners can view rollups" ON public.analytics_rollups;
CREATE POLICY "Org owners can view rollups"
  ON public.analytics_rollups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = analytics_rollups.org_id AND o.owner_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.refresh_analytics_rollups(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.analytics_rollups (org_id, campaign_count, active_campaigns, total_spend, total_reach, avg_engagement, updated_at)
  SELECT
    _org_id,
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE status = 'live')::int,
    COALESCE(SUM(budget), 0),
    0::bigint,
    0::numeric,
    now()
  FROM public.campaigns
  WHERE org_id = _org_id
  ON CONFLICT (org_id) DO UPDATE SET
    campaign_count = EXCLUDED.campaign_count,
    active_campaigns = EXCLUDED.active_campaigns,
    total_spend = EXCLUDED.total_spend,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_analytics_rollups(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_analytics_rollups(uuid) TO service_role;