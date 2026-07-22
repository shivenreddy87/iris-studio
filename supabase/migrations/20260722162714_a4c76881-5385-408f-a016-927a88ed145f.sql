
CREATE TABLE public.iris_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.iris_threads TO authenticated;
GRANT ALL ON public.iris_threads TO service_role;
ALTER TABLE public.iris_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own threads"
  ON public.iris_threads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX iris_threads_user_updated_idx
  ON public.iris_threads (user_id, updated_at DESC);

CREATE TRIGGER iris_threads_updated_at
  BEFORE UPDATE ON public.iris_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.iris_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.iris_threads(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.iris_messages TO authenticated;
GRANT ALL ON public.iris_messages TO service_role;
ALTER TABLE public.iris_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage messages in own threads"
  ON public.iris_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.iris_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.iris_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));

CREATE INDEX iris_messages_thread_created_idx
  ON public.iris_messages (thread_id, created_at ASC);
