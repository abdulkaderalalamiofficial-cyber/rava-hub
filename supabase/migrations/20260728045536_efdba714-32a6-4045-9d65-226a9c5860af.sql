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

-- WALLETS
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  actor_kind TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EGP',
  cash_in_hand NUMERIC NOT NULL DEFAULT 0,
  credit_limit NUMERIC NOT NULL DEFAULT 150,
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

ALTER TABLE public.partner_applications REPLICA IDENTITY FULL;
ALTER TABLE public.medical_bookings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medical_bookings;

-- Role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_count int;
BEGIN
  SELECT count(*) INTO existing_count FROM public.user_roles;
  IF existing_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

ALTER TABLE public.orders REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.orders';
  END IF;
END $$;

-- SHIFTS
CREATE TABLE public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet text NOT NULL,
  governorate text,
  center text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity int NOT NULL DEFAULT 1,
  booked_count int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shifts TO authenticated;
GRANT SELECT ON public.shifts TO anon;
GRANT ALL ON public.shifts TO service_role;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shifts_read_authenticated" ON public.shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY shifts_read_anon ON public.shifts FOR SELECT TO anon USING (true);
CREATE POLICY "shifts_admin_all" ON public.shifts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SHIFT BOOKINGS
CREATE TABLE public.shift_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  captain_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'booked',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shift_id, captain_user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.shift_bookings TO authenticated;
GRANT ALL ON public.shift_bookings TO service_role;
ALTER TABLE public.shift_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_own_read" ON public.shift_bookings FOR SELECT TO authenticated
  USING (captain_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bookings_own_insert" ON public.shift_bookings FOR INSERT TO authenticated
  WITH CHECK (captain_user_id = auth.uid());
CREATE POLICY "bookings_own_update" ON public.shift_bookings FOR UPDATE TO authenticated
  USING (captain_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.shift_bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CHAT THREADS
CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  order_id text,
  captain_user_id uuid,
  customer_user_id uuid,
  topic text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "threads_participant_read" ON public.chat_threads FOR SELECT TO authenticated
  USING (
    captain_user_id = auth.uid()
    OR customer_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "threads_participant_insert" ON public.chat_threads FOR INSERT TO authenticated
  WITH CHECK (captain_user_id = auth.uid() OR customer_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_threads_updated_at BEFORE UPDATE ON public.chat_threads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CHAT MESSAGES
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  sender_role text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_participant_read" ON public.chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = chat_messages.thread_id
        AND (t.captain_user_id = auth.uid() OR t.customer_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "messages_participant_insert" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = chat_messages.thread_id
        AND (t.captain_user_id = auth.uid() OR t.customer_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_threads REPLICA IDENTITY FULL;
ALTER TABLE public.shifts REPLICA IDENTITY FULL;
ALTER TABLE public.shift_bookings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_bookings;

CREATE INDEX idx_msgs_thread ON public.chat_messages(thread_id, created_at DESC);
CREATE INDEX idx_bookings_captain ON public.shift_bookings(captain_user_id);
CREATE INDEX idx_shifts_window ON public.shifts(starts_at);

-- ORDER VERIFICATIONS
CREATE TABLE public.order_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  captain_user_id UUID,
  captain_role TEXT,
  pickup_photo_url TEXT,
  pickup_at TIMESTAMPTZ,
  delivery_photo_url TEXT,
  delivered_at TIMESTAMPTZ,
  otp_code_hash TEXT,
  otp_verified_at TIMESTAMPTZ,
  otp_attempts INT NOT NULL DEFAULT 0,
  weight_kg NUMERIC,
  cargo_only BOOLEAN NOT NULL DEFAULT false,
  bypass_reason TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);
GRANT SELECT, INSERT, UPDATE ON public.order_verifications TO authenticated;
GRANT ALL ON public.order_verifications TO service_role;
ALTER TABLE public.order_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "captain reads own order verifications"
  ON public.order_verifications FOR SELECT TO authenticated
  USING (captain_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "captain writes own order verifications"
  ON public.order_verifications FOR INSERT TO authenticated
  WITH CHECK (captain_user_id = auth.uid());
CREATE POLICY "captain updates own order verifications"
  ON public.order_verifications FOR UPDATE TO authenticated
  USING (captain_user_id = auth.uid())
  WITH CHECK (captain_user_id = auth.uid());
CREATE TRIGGER trg_order_verifications_updated_at
  BEFORE UPDATE ON public.order_verifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CUSTOMER CANCELLATIONS
CREATE TABLE public.customer_cancellations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_user_id UUID NOT NULL,
  order_id UUID,
  reason TEXT,
  after_seconds INT,
  captain_was_enroute BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.customer_cancellations TO authenticated;
GRANT ALL ON public.customer_cancellations TO service_role;
ALTER TABLE public.customer_cancellations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer reads own cancels"
  ON public.customer_cancellations FOR SELECT TO authenticated
  USING (customer_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "customer logs own cancel"
  ON public.customer_cancellations FOR INSERT TO authenticated
  WITH CHECK (customer_user_id = auth.uid());

-- CUSTOMER BLOCKS
CREATE TABLE public.customer_blocks (
  customer_user_id UUID NOT NULL PRIMARY KEY,
  reason TEXT NOT NULL,
  ghost_cancel_count INT NOT NULL DEFAULT 0,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.customer_blocks TO authenticated;
GRANT ALL ON public.customer_blocks TO service_role;
ALTER TABLE public.customer_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer reads own block"
  ON public.customer_blocks FOR SELECT TO authenticated
  USING (customer_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_customer_blocks_updated_at
  BEFORE UPDATE ON public.customer_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_ghost_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INT;
BEGIN
  IF NEW.captain_was_enroute = false THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO recent_count
    FROM public.customer_cancellations
    WHERE customer_user_id = NEW.customer_user_id
      AND captain_was_enroute = true
      AND created_at > now() - interval '7 days';
  IF recent_count >= 3 THEN
    INSERT INTO public.customer_blocks (customer_user_id, reason, ghost_cancel_count, blocked_until)
    VALUES (NEW.customer_user_id, 'ghost_cancel_threshold', recent_count, now() + interval '24 hours')
    ON CONFLICT (customer_user_id) DO UPDATE
      SET ghost_cancel_count = EXCLUDED.ghost_cancel_count,
          blocked_until = GREATEST(public.customer_blocks.blocked_until, EXCLUDED.blocked_until),
          reason = EXCLUDED.reason,
          updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_customer_ghost_cancel
  AFTER INSERT ON public.customer_cancellations
  FOR EACH ROW EXECUTE FUNCTION public.handle_ghost_cancellation();

ALTER PUBLICATION supabase_realtime ADD TABLE public.order_verifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_blocks;
ALTER TABLE public.order_verifications REPLICA IDENTITY FULL;
ALTER TABLE public.customer_blocks REPLICA IDENTITY FULL;

REVOKE EXECUTE ON FUNCTION public.handle_ghost_cancellation() FROM PUBLIC, anon, authenticated;

-- Seed six fixed 4-hour daily slots for the next 7 days, per fleet
INSERT INTO public.shifts (fleet, governorate, center, starts_at, ends_at, capacity, booked_count, notes)
SELECT
  f.fleet,
  NULL,
  'المركز الجغرافي الحالي',
  ((current_date + d) + make_interval(hours => s.h)) AT TIME ZONE 'Africa/Cairo',
  ((current_date + d) + make_interval(hours => s.h + 4)) AT TIME ZONE 'Africa/Cairo',
  8,
  0,
  'auto_4h_slot'
FROM (VALUES ('tayar'),('captain'),('cargo'),('winsh')) AS f(fleet)
CROSS JOIN generate_series(0, 6) AS d
CROSS JOIN (VALUES (0),(4),(8),(12),(16),(20)) AS s(h);