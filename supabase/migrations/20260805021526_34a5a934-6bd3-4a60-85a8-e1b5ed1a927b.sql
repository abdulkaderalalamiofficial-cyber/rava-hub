DROP POLICY IF EXISTS shifts_read_anon ON public.shifts;
REVOKE SELECT ON public.shifts FROM anon;