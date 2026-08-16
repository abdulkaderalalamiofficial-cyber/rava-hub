-- Wallet cash-on-hand / credit limit
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS cash_in_hand numeric NOT NULL DEFAULT 0;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS credit_limit numeric NOT NULL DEFAULT 150;
CREATE UNIQUE INDEX IF NOT EXISTS wallets_owner_actor_uidx
  ON public.wallets (owner_id, actor_kind, actor_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;

-- Seed six fixed 4-hour daily slots for the next 7 days, per fleet
DELETE FROM public.shifts WHERE notes = 'auto_4h_slot';
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

-- USER PREFERENCES
CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY,
  first_seen timestamptz NOT NULL DEFAULT now(),
  visits integer NOT NULL DEFAULT 0,
  last_greeted text,
  categories jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own preferences read" ON public.user_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own preferences insert" ON public.user_preferences
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own preferences update" ON public.user_preferences
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER user_preferences_set_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Hardening
REVOKE EXECUTE ON FUNCTION public.handle_ghost_cancellation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS shifts_read_anon ON public.shifts;
REVOKE SELECT ON public.shifts FROM anon;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;