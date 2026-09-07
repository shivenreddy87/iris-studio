ALTER TABLE public.connected_accounts
  ADD COLUMN IF NOT EXISTS access_token_encrypted text,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS account_type text,
  ADD COLUMN IF NOT EXISTS media_count integer,
  ADD COLUMN IF NOT EXISTS connection_method text NOT NULL DEFAULT 'manual';

CREATE UNIQUE INDEX IF NOT EXISTS connected_accounts_platform_provider_uid_key
  ON public.connected_accounts (platform, provider_user_id)
  WHERE provider_user_id IS NOT NULL;

-- The OAuth token is a credential: never readable by the Data API roles.
REVOKE SELECT (access_token_encrypted) ON public.connected_accounts FROM anon, authenticated;