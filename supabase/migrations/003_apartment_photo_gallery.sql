ALTER TABLE apartments
  ADD COLUMN IF NOT EXISTS photo_urls text[];

UPDATE apartments
SET photo_urls = ARRAY[photo_url]
WHERE photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL;
