-- 1. notification_preferences
CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  in_app_enabled boolean NOT NULL DEFAULT true,
  campaign_updates boolean NOT NULL DEFAULT true,
  contest_updates boolean NOT NULL DEFAULT true,
  payout_updates boolean NOT NULL DEFAULT true,
  marketing boolean NOT NULL DEFAULT false,
  system boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own prefs select" ON public.notification_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own prefs insert" ON public.notification_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own prefs update" ON public.notification_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. activity_feed
CREATE TABLE public.activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.activity_feed TO authenticated;
GRANT ALL ON public.activity_feed TO service_role;

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own activity select" ON public.activity_feed
  FOR SELECT TO authenticated
  USING (auth.uid() = actor_id OR auth.uid() = target_user_id);
CREATE POLICY "admins read all activity" ON public.activity_feed
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX idx_activity_feed_created_at ON public.activity_feed (created_at DESC);
CREATE INDEX idx_activity_feed_entity ON public.activity_feed (entity_type, entity_id);
CREATE INDEX idx_activity_feed_actor ON public.activity_feed (actor_id, created_at DESC);
CREATE INDEX idx_activity_feed_target ON public.activity_feed (target_user_id, created_at DESC);

-- 3. extend notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS action_url text,
  ADD COLUMN IF NOT EXISTS action_label text,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications (user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_archived
  ON public.notifications (user_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_notifications_priority
  ON public.notifications (user_id, priority);