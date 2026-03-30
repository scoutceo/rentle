ALTER TABLE apartments
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'synthetic',
  ADD COLUMN IF NOT EXISTS source_listing_id text,
  ADD COLUMN IF NOT EXISTS listing_url text,
  ADD COLUMN IF NOT EXISTS photos_hosted boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_apartments_source ON apartments(source);
