
-- Tighten notification insert policy: users can only create notifications for themselves.
-- Server-side inserts to other users go via service_role.
DROP POLICY IF EXISTS "Anyone authenticated can insert notifications for themselves or others" ON public.notifications;
CREATE POLICY "Users insert their own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Lock down SECURITY DEFINER helpers: they're only called from RLS policies (which run
-- with elevated privileges internally) and from server code. Revoke public/anon execute.
REVOKE EXECUTE ON FUNCTION public.is_org_owner(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_deal_party(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_conversation_party(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
