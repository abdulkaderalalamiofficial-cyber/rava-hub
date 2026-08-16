
-- Helper trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ORDERS
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  client_id TEXT,
  service TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  customer TEXT NOT NULL,
  merchant_id TEXT,
  driver_id TEXT,
  pickup TEXT NOT NULL,
  dropoff TEXT NOT NULL,
  stops JSONB NOT NULL DEFAULT '[]'::jsonb,
  distance_km NUMERIC NOT NULL DEFAULT 0,
  fare_egp NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  zone TEXT,
  dest_zone TEXT,
  country_code TEXT,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their orders" ON public.orders
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX orders_owner_idx ON public.orders(owner_id, created_at DESC);

-- PARTNER APPLICATIONS
CREATE TABLE public.partner_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  client_id TEXT,
  partner_nid TEXT NOT NULL,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  governorate TEXT,
  center TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_applications TO authenticated;
GRANT ALL ON public.partner_applications TO service_role;
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their partner applications" ON public.partner_applications
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER partner_apps_set_updated_at BEFORE UPDATE ON public.partner_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PARTNER INBOX
CREATE TABLE public.partner_inbox (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  client_id TEXT,
  partner_nid TEXT NOT NULL,
  kind TEXT NOT NULL,
  target_name TEXT NOT NULL,
  target_role TEXT NOT NULL,
  username TEXT,
  password TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_inbox TO authenticated;
GRANT ALL ON public.partner_inbox TO service_role;
ALTER TABLE public.partner_inbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their partner inbox" ON public.partner_inbox
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX partner_inbox_nid_idx ON public.partner_inbox(owner_id, partner_nid);

-- WALLETS (per-actor balances)
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  actor_kind TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EGP',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, actor_kind, actor_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their wallets" ON public.wallets
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER wallets_set_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- MEDICAL BOOKINGS
CREATE TABLE public.medical_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  client_id TEXT,
  provider_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  date_iso TEXT NOT NULL,
  service TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_bookings TO authenticated;
GRANT ALL ON public.medical_bookings TO service_role;
ALTER TABLE public.medical_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their medical bookings" ON public.medical_bookings
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER med_bookings_set_updated_at BEFORE UPDATE ON public.medical_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- AUDIT LOG
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  seq BIGINT NOT NULL,
  partner_nid TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their audit log" ON public.audit_log
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert their audit log" ON public.audit_log
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE INDEX audit_log_owner_seq_idx ON public.audit_log(owner_id, seq DESC);

-- MONTHLY CLOSURES
CREATE TABLE public.monthly_closures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  month TEXT NOT NULL,
  partner_nid TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  gross_commission NUMERIC NOT NULL DEFAULT 0,
  cash_collected NUMERIC NOT NULL DEFAULT 0,
  digital NUMERIC NOT NULL DEFAULT 0,
  debts_deducted NUMERIC NOT NULL DEFAULT 0,
  net_settlement NUMERIC NOT NULL DEFAULT 0,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_closures TO authenticated;
GRANT ALL ON public.monthly_closures TO service_role;
ALTER TABLE public.monthly_closures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their monthly closures" ON public.monthly_closures
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER closures_set_updated_at BEFORE UPDATE ON public.monthly_closures
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
