-- Expand-only: introduce immutable schedule identity without breaking legacy game_no callers.

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
  IF (SELECT count(*) FROM public.alih_game_details) <> 129
     OR EXISTS (SELECT 1 FROM public.alih_game_details WHERE schedule_id IS NULL) THEN
    RAISE EXCEPTION 'Expected every legacy game detail to map to a 2025-26 schedule';
  END IF;
END $$;

ALTER TABLE public.alih_game_details
  ADD CONSTRAINT alih_game_details_schedule_id_key UNIQUE (schedule_id);

ALTER TABLE public.alih_game_details
  ADD CONSTRAINT alih_game_details_schedule_id_fkey
  FOREIGN KEY (schedule_id) REFERENCES public.alih_schedule(id)
  ON DELETE RESTRICT NOT VALID;

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
  IF (SELECT count(*) FROM public.alih_cheers) <> 62
     OR EXISTS (SELECT 1 FROM public.alih_cheers WHERE schedule_id IS NULL) THEN
    RAISE EXCEPTION 'Expected every legacy cheer row to map to a 2025-26 schedule';
  END IF;
END $$;

ALTER TABLE public.alih_cheers
  ADD CONSTRAINT alih_cheers_schedule_id_key UNIQUE (schedule_id);

ALTER TABLE public.alih_cheers
  ADD CONSTRAINT alih_cheers_schedule_id_fkey
  FOREIGN KEY (schedule_id) REFERENCES public.alih_schedule(id)
  ON DELETE RESTRICT NOT VALID;

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
SET search_path = ''
AS $$
DECLARE
  target_game_no INTEGER;
BEGIN
  IF p_team NOT IN ('home', 'away') OR p_count < 1 OR p_count > 100 THEN
    RAISE EXCEPTION 'Invalid cheer request';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(p_schedule_id);

  UPDATE public.alih_cheers
  SET home_cheers = home_cheers + CASE WHEN p_team = 'home' THEN p_count ELSE 0 END,
      away_cheers = away_cheers + CASE WHEN p_team = 'away' THEN p_count ELSE 0 END,
      updated_at = now()
  WHERE schedule_id = p_schedule_id;

  IF NOT FOUND THEN
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
    );
  END IF;

  RETURN QUERY
  SELECT cheers.home_cheers, cheers.away_cheers
  FROM public.alih_cheers AS cheers
  WHERE cheers.schedule_id = p_schedule_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_schedule_cheers(BIGINT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_schedule_cheers(BIGINT, TEXT, INTEGER) TO anon, authenticated;

-- Legacy game_no keys, RPC, public INSERT policy, and Realtime remain unchanged here.
