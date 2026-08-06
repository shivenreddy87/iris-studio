CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role text,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  previous_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read their own audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (actor_id = auth.uid());

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs (actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);

DROP INDEX IF EXISTS public.notifications_user_created_idx;
DROP INDEX IF EXISTS public.payouts_contest_idx;
DROP INDEX IF EXISTS public.payouts_influencer_idx;
DROP INDEX IF EXISTS public.contest_submissions_contest_idx;
DROP INDEX IF EXISTS public.contest_submissions_influencer_idx;
DROP INDEX IF EXISTS public.campaign_requests_business_idx;
