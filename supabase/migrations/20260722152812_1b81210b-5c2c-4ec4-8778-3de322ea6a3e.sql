
-- 1) Tighten creator_profiles SELECT
DROP POLICY IF EXISTS "Creator profiles are visible to authenticated users" ON public.creator_profiles;
CREATE POLICY "Creator profiles visible to owner or brands"
ON public.creator_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'brand')
);

-- 2) Move SECURITY DEFINER helpers to private schema (not exposed by PostgREST)
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

-- Recreate functions in private schema
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION private.is_org_owner(_org_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organizations WHERE id = _org_id AND owner_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION private.is_deal_party(_deal_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deals d
    JOIN public.campaigns c ON c.id = d.campaign_id
    JOIN public.organizations o ON o.id = c.org_id
    WHERE d.id = _deal_id AND (d.creator_user_id = _user_id OR o.owner_id = _user_id)
  )
$$;

CREATE OR REPLACE FUNCTION private.is_conversation_party(_conversation_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = _conversation_id AND (brand_user_id = _user_id OR creator_user_id = _user_id)
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_org_owner(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_deal_party(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_conversation_party(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_org_owner(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_deal_party(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_conversation_party(uuid, uuid) TO authenticated, service_role;

-- 3) Rewrite policies to reference private.* helpers
DROP POLICY IF EXISTS "Org owners can view their campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Org owners can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Org owners can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Org owners can delete campaigns" ON public.campaigns;

CREATE POLICY "Org owners can view their campaigns" ON public.campaigns
FOR SELECT TO authenticated USING (private.is_org_owner(org_id, auth.uid()));
CREATE POLICY "Org owners can insert campaigns" ON public.campaigns
FOR INSERT TO authenticated WITH CHECK (private.is_org_owner(org_id, auth.uid()));
CREATE POLICY "Org owners can update campaigns" ON public.campaigns
FOR UPDATE TO authenticated USING (private.is_org_owner(org_id, auth.uid())) WITH CHECK (private.is_org_owner(org_id, auth.uid()));
CREATE POLICY "Org owners can delete campaigns" ON public.campaigns
FOR DELETE TO authenticated USING (private.is_org_owner(org_id, auth.uid()));

DROP POLICY IF EXISTS "Deal parties view events" ON public.deal_events;
DROP POLICY IF EXISTS "Deal parties insert events" ON public.deal_events;
CREATE POLICY "Deal parties view events" ON public.deal_events
FOR SELECT TO authenticated USING (private.is_deal_party(deal_id, auth.uid()));
CREATE POLICY "Deal parties insert events" ON public.deal_events
FOR INSERT TO authenticated WITH CHECK (private.is_deal_party(deal_id, auth.uid()));

DROP POLICY IF EXISTS "Conversation parties view messages" ON public.messages;
DROP POLICY IF EXISTS "Conversation parties send messages" ON public.messages;
CREATE POLICY "Conversation parties view messages" ON public.messages
FOR SELECT TO authenticated USING (private.is_conversation_party(conversation_id, auth.uid()));
CREATE POLICY "Conversation parties send messages" ON public.messages
FOR INSERT TO authenticated WITH CHECK (private.is_conversation_party(conversation_id, auth.uid()) AND sender_id = auth.uid());

-- Also update any other policies referencing the old public.* helpers
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename, policyname FROM pg_policies WHERE schemaname='public'
    AND (qual LIKE '%public.is_org_owner%' OR qual LIKE '%public.is_deal_party%' OR qual LIKE '%public.is_conversation_party%' OR qual LIKE '%public.has_role%'
      OR with_check LIKE '%public.is_org_owner%' OR with_check LIKE '%public.is_deal_party%' OR with_check LIKE '%public.is_conversation_party%' OR with_check LIKE '%public.has_role%')
  LOOP
    RAISE NOTICE 'Remaining ref: % on %', r.policyname, r.tablename;
  END LOOP;
END $$;

-- 4) Drop the exposed public.* helpers
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_org_owner(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_deal_party(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_conversation_party(uuid, uuid);
