-- A-002: block admin self-assignment at signup and at the table level
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _requested TEXT;
  _full_name TEXT;
BEGIN
  _full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (NEW.id, _full_name, NEW.email, NEW.raw_user_meta_data ->> 'avatar_url');

  -- Only self-serve roles may come from client-supplied signup metadata.
  _requested := NULLIF(NEW.raw_user_meta_data ->> 'role', '');
  IF _requested IN ('brand', 'creator') THEN
    _role := _requested::public.app_role;
  ELSE
    _role := 'brand'::public.app_role;
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.guard_privileged_role_grant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role = 'admin'::public.app_role
     AND auth.uid() IS NOT NULL
     AND NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin roles can only be granted by an existing admin.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_privileged_role_grant ON public.user_roles;
CREATE TRIGGER guard_privileged_role_grant
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.guard_privileged_role_grant();

REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated, anon;

-- A-003: notifications are server-authored only; clients may only mark read/archived/deleted
DROP POLICY IF EXISTS "Users insert their own notifications" ON public.notifications;
REVOKE INSERT ON public.notifications FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.guard_notification_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.kind IS DISTINCT FROM OLD.kind
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.link IS DISTINCT FROM OLD.link
     OR NEW.action_url IS DISTINCT FROM OLD.action_url
     OR NEW.action_label IS DISTINCT FROM OLD.action_label
     OR NEW.priority IS DISTINCT FROM OLD.priority
     OR NEW.metadata IS DISTINCT FROM OLD.metadata
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only read, archived and deleted state can be changed on a notification.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_notification_update ON public.notifications;
CREATE TRIGGER guard_notification_update
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.guard_notification_update();

-- A-004: sender identity for messages is derived server-side, never trusted from the client
CREATE OR REPLACE FUNCTION public.enforce_message_sender()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RETURN NEW; -- trusted server-side (service role) writes, e.g. IRIS replies
  END IF;
  NEW.sender_id := _uid;
  IF private.has_role(_uid, 'creator'::public.app_role) THEN
    NEW.sender_role := 'creator'::public.msg_sender_role;
  ELSE
    NEW.sender_role := 'brand'::public.msg_sender_role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_message_sender ON public.messages;
CREATE TRIGGER enforce_message_sender
BEFORE INSERT OR UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_message_sender();

CREATE OR REPLACE FUNCTION public.enforce_iris_message_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.role <> 'user' THEN
    RAISE EXCEPTION 'Only the assistant service can author non-user messages.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_iris_message_role ON public.iris_messages;
CREATE TRIGGER enforce_iris_message_role
BEFORE INSERT OR UPDATE ON public.iris_messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_iris_message_role();

-- Scan warning: any brand account could enumerate every creator profile
DROP POLICY IF EXISTS "Creator profiles visible to owner or brands" ON public.creator_profiles;
CREATE POLICY "Creator profiles visible to owner or admins"
ON public.creator_profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- Scan warning: owners could not correct payout details before review
CREATE POLICY "Influencers update own pending payout details"
ON public.payout_details FOR UPDATE TO authenticated
USING (auth.uid() = influencer_id)
WITH CHECK (auth.uid() = influencer_id AND declaration_accepted = true);