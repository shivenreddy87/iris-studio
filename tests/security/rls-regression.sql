-- Role-isolation / payout / winner / auth regression suite (QA A-006..A-009).
-- Runs as one DO block and ALWAYS aborts at the end so nothing persists.
-- The final exception message is the report: every line must start with PASS.
DO $$
DECLARE
  c1 uuid := '9bc9adf4-7c5d-4aa2-96ae-de3475f36a93'; -- creator
  c2 uuid := 'd5ade3db-ef3a-45a8-a85b-9ec0f12dcf78'; -- creator
  b1 uuid := '1e4591c3-a4aa-4806-8e24-d0a510e2ea9e'; -- brand
  b2 uuid := '99f85a59-0e14-4395-8a01-f3b6a3e6c311'; -- brand
  report text := '';
  n int;
  PROCEDURE_OK boolean;
BEGIN
  -- helper: act as a user
  PERFORM set_config('role', 'authenticated', true);

  -- A-009 auth: creator cannot grant self admin
  PERFORM set_config('request.jwt.claims', json_build_object('sub', c1, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO public.user_roles(user_id, role) VALUES (c1, 'admin');
    report := report || E'\nFAIL creator self-granted admin';
  EXCEPTION WHEN others THEN report := report || E'\nPASS creator cannot self-grant admin'; END;

  -- A-006 notifications forge
  BEGIN
    INSERT INTO public.notifications(user_id, kind, title) VALUES (c2, 'system', 'forged');
    report := report || E'\nFAIL creator forged notification';
  EXCEPTION WHEN others THEN report := report || E'\nPASS creator cannot forge notifications'; END;

  -- A-006 cross-creator payout visibility
  SELECT count(*) INTO n FROM public.payouts WHERE influencer_id <> c1;
  report := report || CASE WHEN n = 0 THEN E'\nPASS creator sees only own payouts' ELSE E'\nFAIL creator sees others payouts' END;
  SELECT count(*) INTO n FROM public.payout_details WHERE influencer_id <> c1;
  report := report || CASE WHEN n = 0 THEN E'\nPASS creator sees only own payout details' ELSE E'\nFAIL payout details leak' END;
  SELECT count(*) INTO n FROM public.contest_applications WHERE influencer_id <> c1;
  report := report || CASE WHEN n = 0 THEN E'\nPASS creator sees only own applications' ELSE E'\nFAIL applications leak' END;

  -- A-007 payouts: creator cannot create or mark payouts
  BEGIN
    UPDATE public.payouts SET status = 'paid' WHERE influencer_id = c1;
    GET DIAGNOSTICS n = ROW_COUNT;
    report := report || CASE WHEN n = 0 THEN E'\nPASS creator cannot mark payouts paid' ELSE E'\nFAIL creator updated payout' END;
  EXCEPTION WHEN others THEN report := report || E'\nPASS creator cannot mark payouts paid'; END;

  -- A-008 winners: creator cannot insert winners
  BEGIN
    INSERT INTO public.contest_winners(contest_id, influencer_id, rank)
      SELECT id, c1, 1 FROM public.contests LIMIT 1;
    GET DIAGNOSTICS n = ROW_COUNT;
    report := report || CASE WHEN n = 0 THEN E'\nPASS creator cannot declare winners (no contest)' ELSE E'\nFAIL creator declared winner' END;
  EXCEPTION WHEN others THEN report := report || E'\nPASS creator cannot declare winners'; END;

  -- campaign requests impersonation
  BEGIN
    INSERT INTO public.campaign_requests(business_id, title) VALUES (b1, 'forged');
    report := report || E'\nFAIL creator created request for brand';
  EXCEPTION WHEN others THEN report := report || E'\nPASS creator cannot create requests for a business'; END;

  -- brand isolation
  PERFORM set_config('request.jwt.claims', json_build_object('sub', b2, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO n FROM public.campaign_requests WHERE business_id <> b2;
  report := report || CASE WHEN n = 0 THEN E'\nPASS business sees only own campaign requests' ELSE E'\nFAIL campaign request leak' END;
  SELECT count(*) INTO n FROM public.payouts;
  report := report || CASE WHEN n = 0 THEN E'\nPASS business cannot read payouts' ELSE E'\nFAIL business reads payouts' END;
  SELECT count(*) INTO n FROM public.creator_profiles WHERE user_id <> b2;
  report := report || CASE WHEN n = 0 THEN E'\nPASS business cannot bulk-read creator profiles' ELSE E'\nFAIL creator profile leak' END;
  BEGIN
    INSERT INTO public.user_roles(user_id, role) VALUES (b2, 'admin');
    report := report || E'\nFAIL business self-granted admin';
  EXCEPTION WHEN others THEN report := report || E'\nPASS business cannot self-grant admin'; END;

  RAISE EXCEPTION 'REPORT%', report;
END $$;
