-- Authoritative 2026-27 regular-season Game No mapping from alhockey.com/popup/49.
-- Normalized source SHA-256 (2026-09-12 KST):
-- 21249925acb5b0ab09e0e72ea75df89269e602c0d0216b1b74689387f74520c2
--
-- Existing platform game_no values remain stable for public URL compatibility.
-- The source mapping is game_no by default, with the 54 verified exceptions below.
-- This migration deliberately does not touch score_url, live_url, score/status,
-- reminder, highlight, or any 2025-26 row.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_alih_schedule_source_popup_game_no
  ON public.alih_schedule (source_popup_id, source_game_no)
  WHERE source_popup_id IS NOT NULL AND source_game_no IS NOT NULL;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.alih_schedule WHERE season = '2026-27') <> 120
     OR (SELECT count(DISTINCT game_no) FROM public.alih_schedule WHERE season = '2026-27') <> 120
     OR EXISTS (
       SELECT 1 FROM public.alih_schedule
       WHERE season = '2026-27' AND game_status IS DISTINCT FROM 'Scheduled'
     ) THEN
    RAISE EXCEPTION '2026-27 must contain exactly 120 unstarted schedules with unique platform game_no';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.alih_schedule
    WHERE season = '2026-27'
      AND (source_popup_id IS NOT NULL OR source_game_no IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'popup source mapping already exists; use an additive correction migration instead';
  END IF;

  IF (
    SELECT count(*)
    FROM public.alih_schedule AS schedule
    JOIN (
      VALUES
        (83, '2027-01-23T15:00:00+09:00'::timestamptz),
        (86, '2027-01-24T14:00:00+09:00'::timestamptz),
        (84, '2027-01-24T13:00:00+09:00'::timestamptz),
        (93, '2027-02-07T13:00:00+09:00'::timestamptz),
        (108, '2027-02-28T14:00:00+09:00'::timestamptz)
    ) AS correction(game_no, expected_match_at)
      ON correction.game_no = schedule.game_no
     AND correction.expected_match_at = schedule.match_at
    WHERE schedule.season = '2026-27'
  ) <> 5 THEN
    RAISE EXCEPTION 'popup49 start-time correction precondition failed';
  END IF;

  IF (
    SELECT count(*)
    FROM public.alih_schedule AS schedule
    JOIN (VALUES (88), (89)) AS correction(game_no)
      ON correction.game_no = schedule.game_no
     AND schedule.match_place = 'Hachinohe'
    WHERE schedule.season = '2026-27'
  ) <> 2 THEN
    RAISE EXCEPTION 'popup49 venue correction precondition failed';
  END IF;
END $$;

UPDATE public.alih_schedule
SET source_popup_id = 49,
    -- A negative staging value avoids immediate unique-index conflicts while
    -- applying official-number swaps in the next statement.
    source_game_no = -game_no,
    season_phase = 'regular'
WHERE season = '2026-27';

UPDATE public.alih_schedule AS schedule
SET source_game_no = mapping.source_game_no
FROM (
  VALUES
    (10, 11), (11, 10), (12, 13), (13, 12), (19, 20), (20, 19),
    (23, 25), (25, 23), (26, 28), (27, 26), (28, 27), (33, 34),
    (34, 33), (41, 42), (42, 41), (43, 44), (44, 43), (46, 47),
    (47, 46), (48, 50), (49, 48), (50, 49), (51, 52), (52, 53),
    (53, 51), (58, 59), (59, 58), (66, 67), (67, 66), (69, 70),
    (70, 69), (72, 73), (73, 72), (75, 76), (76, 77), (77, 75),
    (78, 79), (79, 80), (80, 78), (81, 83), (82, 81), (83, 82),
    (84, 86), (85, 84), (86, 85), (90, 91), (91, 90), (99, 100),
    (100, 99), (102, 103), (103, 102), (118, 120), (119, 118), (120, 119)
) AS mapping(game_no, source_game_no)
WHERE schedule.season = '2026-27'
  AND schedule.game_no = mapping.game_no;

UPDATE public.alih_schedule
SET source_game_no = -source_game_no
WHERE season = '2026-27'
  AND source_game_no < 0;

UPDATE public.alih_schedule AS schedule
SET match_at = correction.match_at
FROM (
  VALUES
    (83, '2027-01-23T14:00:00+09:00'::timestamptz),
    (86, '2027-01-24T19:00:00+09:00'::timestamptz),
    (84, '2027-01-24T14:00:00+09:00'::timestamptz),
    (93, '2027-02-07T14:00:00+09:00'::timestamptz),
    (108, '2027-02-28T13:00:00+09:00'::timestamptz)
) AS correction(game_no, match_at)
WHERE schedule.season = '2026-27'
  AND schedule.game_no = correction.game_no;

UPDATE public.alih_schedule
SET match_place = 'Nishitokyo'
WHERE season = '2026-27'
  AND game_no IN (88, 89);

DO $$
BEGIN
  IF (SELECT count(*) FROM public.alih_schedule WHERE season = '2026-27' AND source_popup_id = 49) <> 120
     OR (SELECT count(DISTINCT source_game_no) FROM public.alih_schedule WHERE season = '2026-27' AND source_popup_id = 49) <> 120
     OR (SELECT min(source_game_no) FROM public.alih_schedule WHERE season = '2026-27') <> 1
     OR (SELECT max(source_game_no) FROM public.alih_schedule WHERE season = '2026-27') <> 120
     OR EXISTS (SELECT 1 FROM public.alih_schedule WHERE season = '2026-27' AND season_phase IS DISTINCT FROM 'regular')
     OR (SELECT count(*) FROM public.alih_schedule WHERE season = '2026-27' AND game_no IN (88, 89) AND match_place = 'Nishitokyo') <> 2 THEN
    RAISE EXCEPTION 'popup49 source reconciliation postcondition failed';
  END IF;
END $$;

COMMIT;
