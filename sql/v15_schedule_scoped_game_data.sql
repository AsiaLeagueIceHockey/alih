-- ARCHIVED DRAFT: do not apply. Expand/contract replacements are 202609100002 and 202609100008.
-- V15: Scope game details and cheers to the immutable schedule row.
-- This preserves 2025-26 data while allowing season-local game_no values.

ALTER TABLE public.alih_game_details
  ADD COLUMN IF NOT EXISTS schedule_id BIGINT;

UPDATE public.alih_game_details AS detail
SET schedule_id = schedule.id
FROM public.alih_schedule AS schedule
WHERE detail.schedule_id IS NULL
  AND schedule.season = '2025-26'
  AND schedule.game_no = detail.game_no;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.alih_game_details WHERE schedule_id IS NULL) THEN
    RAISE EXCEPTION 'Could not map every alih_game_details row to a 2025-26 schedule';
  END IF;
END $$;

ALTER TABLE public.alih_game_details
  ALTER COLUMN schedule_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS alih_game_details_game_no_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'alih_game_details_schedule_id_key'
      AND conrelid = 'public.alih_game_details'::regclass
  ) THEN
    ALTER TABLE public.alih_game_details
      ADD CONSTRAINT alih_game_details_schedule_id_key UNIQUE (schedule_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'alih_game_details_schedule_id_fkey'
  ) THEN
    ALTER TABLE public.alih_game_details
      ADD CONSTRAINT alih_game_details_schedule_id_fkey
      FOREIGN KEY (schedule_id) REFERENCES public.alih_schedule(id)
      ON DELETE RESTRICT NOT VALID;
  END IF;
END $$;

ALTER TABLE public.alih_game_details
  VALIDATE CONSTRAINT alih_game_details_schedule_id_fkey;

ALTER TABLE public.alih_cheers
  ADD COLUMN IF NOT EXISTS schedule_id BIGINT;

UPDATE public.alih_cheers AS cheers
SET schedule_id = schedule.id
FROM public.alih_schedule AS schedule
WHERE cheers.schedule_id IS NULL
  AND schedule.season = '2025-26'
  AND schedule.game_no = cheers.game_no;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.alih_cheers WHERE schedule_id IS NULL) THEN
    RAISE EXCEPTION 'Could not map every alih_cheers row to a 2025-26 schedule';
  END IF;
END $$;

ALTER TABLE public.alih_cheers
  ALTER COLUMN schedule_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS alih_cheers_game_no_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'alih_cheers_schedule_id_key'
      AND conrelid = 'public.alih_cheers'::regclass
  ) THEN
    ALTER TABLE public.alih_cheers
      ADD CONSTRAINT alih_cheers_schedule_id_key UNIQUE (schedule_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_alih_cheers_game_no
  ON public.alih_cheers (game_no);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'alih_cheers_schedule_id_fkey'
  ) THEN
    ALTER TABLE public.alih_cheers
      ADD CONSTRAINT alih_cheers_schedule_id_fkey
      FOREIGN KEY (schedule_id) REFERENCES public.alih_schedule(id)
      ON DELETE RESTRICT NOT VALID;
  END IF;
END $$;

ALTER TABLE public.alih_cheers
  VALIDATE CONSTRAINT alih_cheers_schedule_id_fkey;

CREATE OR REPLACE FUNCTION public.increment_schedule_cheers(
  p_schedule_id BIGINT,
  p_team TEXT,
  p_count INTEGER DEFAULT 1
)
RETURNS TABLE(home_cheers BIGINT, away_cheers BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_game_no INTEGER;
BEGIN
  IF p_team NOT IN ('home', 'away') OR p_count < 1 OR p_count > 100 THEN
    RAISE EXCEPTION 'Invalid cheer request';
  END IF;

  SELECT game_no INTO target_game_no
  FROM public.alih_schedule
  WHERE id = p_schedule_id;

  IF target_game_no IS NULL THEN
    RAISE EXCEPTION 'Unknown schedule';
  END IF;

  INSERT INTO public.alih_cheers (schedule_id, game_no, home_cheers, away_cheers)
  VALUES (
    p_schedule_id,
    target_game_no,
    CASE WHEN p_team = 'home' THEN p_count ELSE 0 END,
    CASE WHEN p_team = 'away' THEN p_count ELSE 0 END
  )
  ON CONFLICT (schedule_id)
  DO UPDATE SET
    home_cheers = public.alih_cheers.home_cheers + CASE WHEN p_team = 'home' THEN p_count ELSE 0 END,
    away_cheers = public.alih_cheers.away_cheers + CASE WHEN p_team = 'away' THEN p_count ELSE 0 END,
    updated_at = now();

  RETURN QUERY
  SELECT c.home_cheers, c.away_cheers
  FROM public.alih_cheers AS c
  WHERE c.schedule_id = p_schedule_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_schedule_cheers(BIGINT, TEXT, INTEGER)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_schedule_cheers(BIGINT, TEXT, INTEGER)
  TO anon, authenticated;

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
