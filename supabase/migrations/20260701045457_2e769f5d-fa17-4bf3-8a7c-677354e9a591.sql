-- Allow the prototype (no auth session) to read shift slots
CREATE POLICY shifts_read_anon ON public.shifts FOR SELECT TO anon USING (true);
GRANT SELECT ON public.shifts TO anon;

-- Clean any previously seeded auto slots to avoid duplicates
DELETE FROM public.shifts WHERE notes = 'auto_4h_slot';

-- Seed six fixed 4-hour daily slots for the next 7 days, per fleet
INSERT INTO public.shifts (fleet, governorate, center, starts_at, ends_at, capacity, booked_count, notes)
SELECT
  f.fleet,
  NULL,
  'المركز الجغرافي الحالي',
  ((current_date + d) + make_interval(hours => h)) AT TIME ZONE 'Africa/Cairo',
  ((current_date + d) + make_interval(hours => h + 4)) AT TIME ZONE 'Africa/Cairo',
  8,
  0,
  'auto_4h_slot'
FROM (VALUES ('tayar'),('captain'),('cargo'),('winsh')) AS f(fleet)
CROSS JOIN generate_series(0, 6) AS d
CROSS JOIN (VALUES (0),(4),(8),(12),(16),(20)) AS s(h);