CREATE TYPE public.payout_status AS ENUM (
  'pending','details_requested','waiting_for_details','processing','paid','failed','cancelled'
);

CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  winner_id uuid NOT NULL REFERENCES public.contest_winners(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  influencer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  status public.payout_status NOT NULL DEFAULT 'pending',
  payment_method text,
  payment_reference text,
  payment_provider text NOT NULL DEFAULT 'manual',
  provider_transaction_id text,
  provider_status text,
  provider_response jsonb,
  internal_notes text,
  failure_reason text,
  requested_at timestamptz,
  processing_at timestamptz,
  paid_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (winner_id)
);

CREATE INDEX payouts_contest_idx ON public.payouts (contest_id);
CREATE INDEX payouts_influencer_idx ON public.payouts (influencer_id);
CREATE INDEX payouts_status_idx ON public.payouts (status);

GRANT SELECT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Influencers read own payouts"
  ON public.payouts FOR SELECT TO authenticated
  USING (auth.uid() = influencer_id);

CREATE POLICY "Admins read all payouts"
  ON public.payouts FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.payout_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id uuid NOT NULL REFERENCES public.contest_winners(id) ON DELETE CASCADE,
  influencer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  country text NOT NULL,
  bank_holder_name text NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  ifsc text,
  swift text,
  upi_id text,
  paypal_email text,
  government_id_url text,
  tax_id text,
  declaration_accepted boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (winner_id)
);

CREATE INDEX payout_details_influencer_idx ON public.payout_details (influencer_id);

GRANT SELECT, INSERT ON public.payout_details TO authenticated;
GRANT ALL ON public.payout_details TO service_role;
ALTER TABLE public.payout_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Influencers read own payout details"
  ON public.payout_details FOR SELECT TO authenticated
  USING (auth.uid() = influencer_id);

CREATE POLICY "Influencers submit own payout details"
  ON public.payout_details FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = influencer_id AND declaration_accepted = true);

CREATE POLICY "Admins read all payout details"
  ON public.payout_details FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.payout_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL REFERENCES public.payouts(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  note text,
  internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payout_events_payout_idx ON public.payout_events (payout_id);

GRANT SELECT ON public.payout_events TO authenticated;
GRANT ALL ON public.payout_events TO service_role;
ALTER TABLE public.payout_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Influencers read own payout events"
  ON public.payout_events FOR SELECT TO authenticated
  USING (
    NOT internal
    AND EXISTS (
      SELECT 1 FROM public.payouts p
      WHERE p.id = payout_events.payout_id AND p.influencer_id = auth.uid()
    )
  );

CREATE POLICY "Admins read all payout events"
  ON public.payout_events FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_payout_details_updated_at
  BEFORE UPDATE ON public.payout_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();