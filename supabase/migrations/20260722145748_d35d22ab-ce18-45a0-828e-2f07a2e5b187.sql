
-- ============================================================================
-- Project Eros — Core schema
-- ============================================================================

-- Enums
CREATE TYPE public.campaign_status AS ENUM ('draft', 'live', 'review', 'completed', 'archived');
CREATE TYPE public.deal_stage AS ENUM ('invited', 'negotiating', 'agreed', 'in_production', 'delivered', 'cancelled');
CREATE TYPE public.contract_status AS ENUM ('none', 'draft', 'sent', 'signed');
CREATE TYPE public.msg_sender_role AS ENUM ('brand', 'creator', 'iris');
CREATE TYPE public.notification_kind AS ENUM ('message', 'deal_update', 'invitation', 'system');
CREATE TYPE public.creator_accent AS ENUM ('violet', 'rose');

-- ============================================================================
-- ORGANIZATIONS (brand workspaces)
-- ============================================================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their organizations"
  ON public.organizations FOR SELECT TO authenticated
  USING (owner_id = auth.uid());
CREATE POLICY "Owners can insert their organizations"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update their organizations"
  ON public.organizations FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security-definer helper: is caller a member/owner of org?
CREATE OR REPLACE FUNCTION public.is_org_owner(_org_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organizations WHERE id = _org_id AND owner_id = _user_id)
$$;

-- ============================================================================
-- CREATOR PROFILES
-- ============================================================================
CREATE TABLE public.creator_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE,
  display_name TEXT,
  niche TEXT,
  location TEXT,
  followers INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_rate INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT,
  accent public.creator_accent NOT NULL DEFAULT 'violet',
  socials JSONB NOT NULL DEFAULT '{}'::jsonb,
  match_score INTEGER NOT NULL DEFAULT 85,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_profiles TO authenticated;
GRANT ALL ON public.creator_profiles TO service_role;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can see creator profiles (discovery marketplace)
CREATE POLICY "Creator profiles are visible to authenticated users"
  ON public.creator_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creators can insert their own profile"
  ON public.creator_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Creators can update their own profile"
  ON public.creator_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_creator_profiles_updated_at
  BEFORE UPDATE ON public.creator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX creator_profiles_niche_idx ON public.creator_profiles (niche);
CREATE INDEX creator_profiles_tags_idx ON public.creator_profiles USING gin (tags);

-- ============================================================================
-- CAMPAIGNS
-- ============================================================================
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brief TEXT NOT NULL DEFAULT '',
  status public.campaign_status NOT NULL DEFAULT 'draft',
  budget INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  goal TEXT,
  starts_at DATE,
  ends_at DATE,
  reach INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  spend INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners can view their campaigns"
  ON public.campaigns FOR SELECT TO authenticated
  USING (public.is_org_owner(org_id, auth.uid()));
CREATE POLICY "Org owners can insert campaigns"
  ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (public.is_org_owner(org_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Org owners can update campaigns"
  ON public.campaigns FOR UPDATE TO authenticated
  USING (public.is_org_owner(org_id, auth.uid())) WITH CHECK (public.is_org_owner(org_id, auth.uid()));
CREATE POLICY "Org owners can delete campaigns"
  ON public.campaigns FOR DELETE TO authenticated
  USING (public.is_org_owner(org_id, auth.uid()));

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- DEALS
-- ============================================================================
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage public.deal_stage NOT NULL DEFAULT 'invited',
  offer INTEGER NOT NULL DEFAULT 0,
  counter INTEGER,
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  contract_status public.contract_status NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, creator_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Helper: is caller a party to this deal? (brand-side via org ownership, or the creator)
CREATE OR REPLACE FUNCTION public.is_deal_party(_deal_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deals d
    JOIN public.campaigns c ON c.id = d.campaign_id
    JOIN public.organizations o ON o.id = c.org_id
    WHERE d.id = _deal_id
      AND (d.creator_user_id = _user_id OR o.owner_id = _user_id)
  )
$$;

CREATE POLICY "Deal parties can view deals"
  ON public.deals FOR SELECT TO authenticated
  USING (
    creator_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.organizations o ON o.id = c.org_id
      WHERE c.id = campaign_id AND o.owner_id = auth.uid()
    )
  );
CREATE POLICY "Brand can insert deals for their campaigns"
  ON public.deals FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.organizations o ON o.id = c.org_id
      WHERE c.id = campaign_id AND o.owner_id = auth.uid()
    )
  );
CREATE POLICY "Deal parties can update deals"
  ON public.deals FOR UPDATE TO authenticated
  USING (
    creator_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.organizations o ON o.id = c.org_id
      WHERE c.id = campaign_id AND o.owner_id = auth.uid()
    )
  );

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- DEAL EVENTS (audit / timeline)
-- ============================================================================
CREATE TABLE public.deal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  kind TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.deal_events TO authenticated;
GRANT ALL ON public.deal_events TO service_role;
ALTER TABLE public.deal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal parties view events"
  ON public.deal_events FOR SELECT TO authenticated
  USING (public.is_deal_party(deal_id, auth.uid()));
CREATE POLICY "Deal parties insert events"
  ON public.deal_events FOR INSERT TO authenticated
  WITH CHECK (public.is_deal_party(deal_id, auth.uid()) AND actor_id = auth.uid());

-- ============================================================================
-- CONVERSATIONS + MESSAGES
-- ============================================================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  brand_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  brand_last_read_at TIMESTAMPTZ,
  creator_last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, brand_user_id, creator_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation parties view conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (brand_user_id = auth.uid() OR creator_user_id = auth.uid());
CREATE POLICY "Conversation parties can insert"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (brand_user_id = auth.uid() OR creator_user_id = auth.uid());
CREATE POLICY "Conversation parties can update"
  ON public.conversations FOR UPDATE TO authenticated
  USING (brand_user_id = auth.uid() OR creator_user_id = auth.uid());

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_role public.msg_sender_role NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_party(_conversation_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = _conversation_id
      AND (brand_user_id = _user_id OR creator_user_id = _user_id)
  )
$$;

CREATE POLICY "Conversation parties view messages"
  ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_party(conversation_id, auth.uid()));
CREATE POLICY "Conversation parties send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    public.is_conversation_party(conversation_id, auth.uid())
    AND (sender_id = auth.uid() OR sender_role = 'iris')
  );

CREATE INDEX messages_conversation_idx ON public.messages (conversation_id, created_at);

-- Realtime for messages + deals
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;

-- ============================================================================
-- CREATOR LISTS
-- ============================================================================
CREATE TABLE public.creator_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  accent public.creator_accent NOT NULL DEFAULT 'violet',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_lists TO authenticated;
GRANT ALL ON public.creator_lists TO service_role;
ALTER TABLE public.creator_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view their lists"
  ON public.creator_lists FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners insert their lists"
  ON public.creator_lists FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update their lists"
  ON public.creator_lists FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners delete their lists"
  ON public.creator_lists FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TRIGGER update_creator_lists_updated_at
  BEFORE UPDATE ON public.creator_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.creator_list_items (
  list_id UUID NOT NULL REFERENCES public.creator_lists(id) ON DELETE CASCADE,
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (list_id, creator_user_id)
);
GRANT SELECT, INSERT, DELETE ON public.creator_list_items TO authenticated;
GRANT ALL ON public.creator_list_items TO service_role;
ALTER TABLE public.creator_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "List owners view items"
  ON public.creator_list_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.creator_lists WHERE id = list_id AND owner_id = auth.uid()));
CREATE POLICY "List owners add items"
  ON public.creator_list_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.creator_lists WHERE id = list_id AND owner_id = auth.uid()));
CREATE POLICY "List owners remove items"
  ON public.creator_list_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.creator_lists WHERE id = list_id AND owner_id = auth.uid()));

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.notification_kind NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their notifications"
  ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update their notifications"
  ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Anyone authenticated can insert notifications for themselves or others"
  ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users delete their notifications"
  ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================================
-- Auto-ensure organization for brand signups (extend handle_new_user)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
  _full_name TEXT;
BEGIN
  _full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (NEW.id, _full_name, NEW.email, NEW.raw_user_meta_data ->> 'avatar_url');

  BEGIN
    _role := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'role', ''), 'brand')::public.app_role;
  EXCEPTION WHEN others THEN
    _role := 'brand'::public.app_role;
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role) ON CONFLICT (user_id, role) DO NOTHING;

  IF _role = 'brand' THEN
    INSERT INTO public.organizations (name, owner_id)
    VALUES (COALESCE(_full_name, 'My workspace') || '''s workspace', NEW.id);
  ELSIF _role = 'creator' THEN
    INSERT INTO public.creator_profiles (user_id, display_name, handle)
    VALUES (NEW.id, _full_name, NULL)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- Seed demo creator profiles (using synthetic UUIDs so brands see something on discover)
-- These have NULL matching auth.users row; the FK is REFERENCES auth.users so we must skip.
-- Instead, seed placeholder creators via a separate table? For simplicity, we'll seed
-- creator_profiles ONLY for users that sign up. Discover will just show real creators.
-- ============================================================================
