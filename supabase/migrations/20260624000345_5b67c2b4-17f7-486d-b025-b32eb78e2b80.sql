
-- Order verification artifacts (pickup photo, delivery OTP, door photo, weight/cargo flag)
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

-- Customer cancellations + auto-block ledger (ghost cancel detection)
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

-- Auto-block trigger: 3 ghost cancellations in rolling 7 days = 24h block
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

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_verifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_blocks;
ALTER TABLE public.order_verifications REPLICA IDENTITY FULL;
ALTER TABLE public.customer_blocks REPLICA IDENTITY FULL;
