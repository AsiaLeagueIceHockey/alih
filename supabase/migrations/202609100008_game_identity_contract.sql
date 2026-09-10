-- Contract-only: apply only after immutable frontend/batch/live-game deployment uses schedule_id.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.alih_game_details WHERE schedule_id IS NULL)
     OR EXISTS (SELECT 1 FROM public.alih_cheers WHERE schedule_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot contract game identity while schedule_id backfill is incomplete';
  END IF;
END $$;

ALTER TABLE public.alih_game_details
  ALTER COLUMN schedule_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS alih_game_details_game_no_key;

ALTER TABLE public.alih_cheers
  ALTER COLUMN schedule_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS alih_cheers_game_no_key;

CREATE INDEX IF NOT EXISTS idx_alih_game_details_game_no
  ON public.alih_game_details (game_no);

CREATE INDEX IF NOT EXISTS idx_alih_cheers_game_no
  ON public.alih_cheers (game_no);

REVOKE EXECUTE ON FUNCTION public.increment_cheers(INTEGER, TEXT, INTEGER)
  FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Allow anonymous insert" ON public.alih_cheers;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'alih_cheers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.alih_cheers;
  END IF;
END $$;
