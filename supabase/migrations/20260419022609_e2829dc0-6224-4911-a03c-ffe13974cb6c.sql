-- Tambahkan kolom token_hash untuk reset password internal
ALTER TABLE public.password_reset_requests
  ADD COLUMN IF NOT EXISTS token_hash text,
  ADD COLUMN IF NOT EXISTS used_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_pwd_reset_token_hash ON public.password_reset_requests(token_hash);