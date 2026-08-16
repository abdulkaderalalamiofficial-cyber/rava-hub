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
  status text NOT NULL DEFAULT 'booked', -- booked | cancelled | completed
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
  kind text NOT NULL, -- 'order' | 'support'
  order_id text,
  captain_user_id uuid,
  customer_user_id uuid,
  topic text, -- for support: sos | bug | shift | general
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
  sender_role text NOT NULL, -- 'captain' | 'customer' | 'support' | 'admin'
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

-- Realtime
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