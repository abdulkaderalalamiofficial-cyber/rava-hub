-- ============ SHIFTS ============
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
GRANT ALL ON public.shifts TO service_role;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shifts_read_authenticated" ON public.shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "shifts_admin_all" ON public.shifts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SHIFT BOOKINGS ============
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

-- ============ CHAT THREADS ============
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

-- ============ CHAT MESSAGES ============
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

-- Order verification artifacts
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
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;