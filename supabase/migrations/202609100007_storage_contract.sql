-- Contract-only: inspect actual storage policy names immediately before applying.

DROP POLICY IF EXISTS "Allow Public Uploads hylejo_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Uploads hylejo_1" ON storage.objects;

UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'player-images';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'player-images') THEN
    RAISE EXCEPTION 'player-images bucket does not exist';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd IN ('INSERT', 'UPDATE')
      AND (with_check::text LIKE '%player-images%' OR qual::text LIKE '%player-images%')
  ) THEN
    RAISE EXCEPTION 'Unsafe player-images write policy remains after contract';
  END IF;
END $$;
