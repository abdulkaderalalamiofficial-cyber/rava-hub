CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.settings TO service_role;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.settings (key, value)
VALUES ('control_room_password_hash', 'a840c5f705fecfcbb83593298ed37b9635f1d32a864a0a98e9d9acae27944dcb')
ON CONFLICT (key) DO NOTHING;