-- Add cash-on-hand tracking to wallets for the captain credit-limit feature
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS cash_in_hand numeric NOT NULL DEFAULT 0;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS credit_limit numeric NOT NULL DEFAULT 150;

-- Unique wallet per owner+actor so we can upsert/provision safely
CREATE UNIQUE INDEX IF NOT EXISTS wallets_owner_actor_uidx
  ON public.wallets (owner_id, actor_kind, actor_id);

-- keep updated_at fresh
DROP TRIGGER IF EXISTS wallets_set_updated_at ON public.wallets;
CREATE TRIGGER wallets_set_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ensure grants (idempotent)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;