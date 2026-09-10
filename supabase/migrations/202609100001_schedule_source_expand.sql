-- Expand-only: bind the verified 2026-27 official score URLs to existing schedule rows.
-- Auto-generated from asiaicehockey.com

-- Additive source reconciliation for an already-created season.
-- Preserves scores, statuses, reminders, highlights, YouTube live URLs, and all historical seasons.

ALTER TABLE public.alih_schedule ADD COLUMN IF NOT EXISTS score_url TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_alih_schedule_score_url ON public.alih_schedule (score_url) WHERE score_url IS NOT NULL;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.alih_schedule WHERE season = '2026-27') <> 120
     OR (SELECT count(DISTINCT game_no) FROM public.alih_schedule WHERE season = '2026-27') <> 120
     OR EXISTS (SELECT 1 FROM public.alih_schedule WHERE season = '2026-27' AND game_status IS DISTINCT FROM 'Scheduled') THEN
    RAISE EXCEPTION '2026-27 schedule must contain exactly 120 unique, unstarted games';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alih_schedule_season_game_no_key' AND conrelid = 'public.alih_schedule'::regclass) THEN
    ALTER TABLE public.alih_schedule ADD CONSTRAINT alih_schedule_season_game_no_key UNIQUE (season, game_no);
  END IF;
END $$;

WITH source(match_at, match_place, home_alih_team_id, away_alih_team_id, score_url) AS (
VALUES
('2026-09-12 15:00:00+09', 'Tomakomai', 2, 5, 'https://asiaicehockey.com/score/26924'),
('2026-09-12 15:00:00+09', 'Shinyokohama', 4, 6, 'https://asiaicehockey.com/score/26925'),
('2026-09-13 14:00:00+09', 'Tomakomai', 2, 5, 'https://asiaicehockey.com/score/26926'),
('2026-09-13 14:00:00+09', 'Shinyokohama', 4, 6, 'https://asiaicehockey.com/score/26927'),
('2026-09-18 18:30:00+09', 'Nikko', 5, 1, 'https://asiaicehockey.com/score/26928'),
('2026-09-19 14:00:00+09', 'Kofu', 4, 3, 'https://asiaicehockey.com/score/26929'),
('2026-09-20 14:00:00+09', 'Nikko', 5, 1, 'https://asiaicehockey.com/score/26930'),
('2026-09-20 14:00:00+09', 'Kofu', 4, 3, 'https://asiaicehockey.com/score/26931'),
('2026-09-21 14:00:00+09', 'Nikko', 5, 1, 'https://asiaicehockey.com/score/26932'),
('2026-09-26 14:00:00+09', 'Hachinohe', 3, 6, 'https://asiaicehockey.com/score/26934'),
('2026-09-26 15:00:00+09', 'Tomakomai', 2, 4, 'https://asiaicehockey.com/score/26933'),
('2026-09-27 13:00:00+09', 'Hachinohe', 3, 6, 'https://asiaicehockey.com/score/26936'),
('2026-09-27 14:00:00+09', 'Tomakomai', 2, 4, 'https://asiaicehockey.com/score/26935'),
('2026-10-03 14:00:00+09', 'Amagasaki', 6, 5, 'https://asiaicehockey.com/score/26937'),
('2026-10-03 16:00:00+09', 'Anyang', 1, 2, 'https://asiaicehockey.com/score/26938'),
('2026-10-04 13:00:00+09', 'Amagasaki', 6, 5, 'https://asiaicehockey.com/score/26939'),
('2026-10-04 14:00:00+09', 'Anyang', 1, 2, 'https://asiaicehockey.com/score/26940'),
('2026-10-06 19:00:00+09', 'Anyang', 1, 2, 'https://asiaicehockey.com/score/26941'),
('2026-10-10 14:00:00+09', 'Nikko', 5, 3, 'https://asiaicehockey.com/score/26943'),
('2026-10-10 15:00:00+09', 'Sapporo', 2, 6, 'https://asiaicehockey.com/score/26942'),
('2026-10-11 14:00:00+09', 'Sapporo', 2, 6, 'https://asiaicehockey.com/score/26944'),
('2026-10-11 14:00:00+09', 'Nikko', 5, 3, 'https://asiaicehockey.com/score/26945'),
('2026-10-17 14:00:00+09', 'Amagasaki', 6, 1, 'https://asiaicehockey.com/score/26948'),
('2026-10-17 14:00:00+09', 'Nikko', 5, 4, 'https://asiaicehockey.com/score/26947'),
('2026-10-17 15:00:00+09', 'Tomakomai', 2, 3, 'https://asiaicehockey.com/score/26946'),
('2026-10-18 13:00:00+09', 'Amagasaki', 6, 1, 'https://asiaicehockey.com/score/26951'),
('2026-10-18 14:00:00+09', 'Tomakomai', 2, 3, 'https://asiaicehockey.com/score/26949'),
('2026-10-18 14:00:00+09', 'Nikko', 5, 4, 'https://asiaicehockey.com/score/26950'),
('2026-10-24 15:00:00+09', 'Shinyokohama', 4, 2, 'https://asiaicehockey.com/score/26952'),
('2026-10-25 14:00:00+09', 'Shinyokohama', 4, 2, 'https://asiaicehockey.com/score/26953'),
('2026-10-31 14:00:00+09', 'Hachinohe', 3, 1, 'https://asiaicehockey.com/score/26954'),
('2026-10-31 14:00:00+09', 'Kushiro', 6, 4, 'https://asiaicehockey.com/score/26955'),
('2026-11-01 13:00:00+09', 'Kushiro', 6, 4, 'https://asiaicehockey.com/score/26957'),
('2026-11-01 14:00:00+09', 'Hachinohe', 3, 1, 'https://asiaicehockey.com/score/26956'),
('2026-11-03 14:00:00+09', 'Hachinohe', 3, 1, 'https://asiaicehockey.com/score/26958'),
('2026-11-12 19:00:00+09', 'Anyang', 1, 4, 'https://asiaicehockey.com/score/26959'),
('2026-11-14 14:00:00+09', 'Nikko', 5, 6, 'https://asiaicehockey.com/score/26960'),
('2026-11-14 16:00:00+09', 'Anyang', 1, 4, 'https://asiaicehockey.com/score/26961'),
('2026-11-15 14:00:00+09', 'Nikko', 5, 6, 'https://asiaicehockey.com/score/26962'),
('2026-11-15 14:00:00+09', 'Anyang', 1, 4, 'https://asiaicehockey.com/score/26963'),
('2026-11-21 14:00:00+09', 'Amagasaki', 6, 2, 'https://asiaicehockey.com/score/26965'),
('2026-11-21 14:00:00+09', 'Hachinohe', 3, 4, 'https://asiaicehockey.com/score/26964'),
('2026-11-22 13:00:00+09', 'Amagasaki', 6, 2, 'https://asiaicehockey.com/score/26967'),
('2026-11-22 14:00:00+09', 'Hachinohe', 3, 4, 'https://asiaicehockey.com/score/26966'),
('2026-11-28 14:00:00+09', 'Nikko', 5, 2, 'https://asiaicehockey.com/score/26968'),
('2026-11-28 14:00:00+09', 'Amagasaki', 6, 3, 'https://asiaicehockey.com/score/26970'),
('2026-11-28 15:00:00+09', 'Shinyokohama', 4, 1, 'https://asiaicehockey.com/score/26969'),
('2026-11-29 13:00:00+09', 'Amagasaki', 6, 3, 'https://asiaicehockey.com/score/26973'),
('2026-11-29 14:00:00+09', 'Nikko', 5, 2, 'https://asiaicehockey.com/score/26971'),
('2026-11-29 14:00:00+09', 'Shinyokohama', 4, 1, 'https://asiaicehockey.com/score/26972'),
('2026-12-05 14:00:00+09', 'Hachinohe', 3, 5, 'https://asiaicehockey.com/score/26975'),
('2026-12-05 15:00:00+09', 'Shinyokohama', 4, 6, 'https://asiaicehockey.com/score/26976'),
('2026-12-05 15:00:00+09', 'Tomakomai', 2, 1, 'https://asiaicehockey.com/score/26974'),
('2026-12-06 14:00:00+09', 'Tomakomai', 2, 1, 'https://asiaicehockey.com/score/26977'),
('2026-12-06 14:00:00+09', 'Hachinohe', 3, 5, 'https://asiaicehockey.com/score/26978'),
('2026-12-06 14:00:00+09', 'Shinyokohama', 4, 6, 'https://asiaicehockey.com/score/26979'),
('2026-12-10 19:00:00+09', 'Anyang', 1, 6, 'https://asiaicehockey.com/score/26980'),
('2026-12-12 14:00:00+09', 'Nikko', 5, 4, 'https://asiaicehockey.com/score/26982'),
('2026-12-12 15:00:00+09', 'Sapporo', 2, 3, 'https://asiaicehockey.com/score/26981'),
('2026-12-12 16:00:00+09', 'Anyang', 1, 6, 'https://asiaicehockey.com/score/26983'),
('2026-12-13 14:00:00+09', 'Sapporo', 2, 3, 'https://asiaicehockey.com/score/26984'),
('2026-12-13 14:00:00+09', 'Nikko', 5, 4, 'https://asiaicehockey.com/score/26985'),
('2026-12-13 14:00:00+09', 'Anyang', 1, 6, 'https://asiaicehockey.com/score/26986'),
('2026-12-26 14:00:00+09', 'Hachinohe', 3, 2, 'https://asiaicehockey.com/score/26987'),
('2026-12-26 14:00:00+09', 'Kobe', 6, 5, 'https://asiaicehockey.com/score/26988'),
('2026-12-27 13:00:00+09', 'Kobe', 6, 5, 'https://asiaicehockey.com/score/26990'),
('2026-12-27 14:00:00+09', 'Hachinohe', 3, 2, 'https://asiaicehockey.com/score/26989'),
('2027-01-07 19:00:00+09', 'Anyang', 1, 5, 'https://asiaicehockey.com/score/26991'),
('2027-01-09 14:00:00+09', 'Kobe', 6, 2, 'https://asiaicehockey.com/score/26993'),
('2027-01-09 15:00:00+09', 'Shinyokohama', 4, 3, 'https://asiaicehockey.com/score/26992'),
('2027-01-09 16:00:00+09', 'Anyang', 1, 5, 'https://asiaicehockey.com/score/26994'),
('2027-01-10 13:00:00+09', 'Kobe', 6, 2, 'https://asiaicehockey.com/score/26996'),
('2027-01-10 14:00:00+09', 'Shinyokohama', 4, 3, 'https://asiaicehockey.com/score/26995'),
('2027-01-10 14:00:00+09', 'Anyang', 1, 5, 'https://asiaicehockey.com/score/26997'),
('2027-01-16 14:00:00+09', 'Hachinohe', 3, 1, 'https://asiaicehockey.com/score/26999'),
('2027-01-16 14:00:00+09', 'Nikko', 5, 6, 'https://asiaicehockey.com/score/27000'),
('2027-01-16 15:00:00+09', 'Tomakomai', 2, 4, 'https://asiaicehockey.com/score/26998'),
('2027-01-17 14:00:00+09', 'Hachinohe', 3, 1, 'https://asiaicehockey.com/score/27002'),
('2027-01-17 14:00:00+09', 'Nikko', 5, 6, 'https://asiaicehockey.com/score/27003'),
('2027-01-17 14:00:00+09', 'Tomakomai', 2, 4, 'https://asiaicehockey.com/score/27001'),
('2027-01-23 14:00:00+09', 'Amagasaki', 6, 3, 'https://asiaicehockey.com/score/27006'),
('2027-01-23 15:00:00+09', 'Tomakomai', 2, 1, 'https://asiaicehockey.com/score/27004'),
('2027-01-23 15:00:00+09', 'Shinyokohama', 4, 5, 'https://asiaicehockey.com/score/27005'),
('2027-01-24 13:00:00+09', 'Amagasaki', 6, 3, 'https://asiaicehockey.com/score/27009'),
('2027-01-24 14:00:00+09', 'Tomakomai', 2, 1, 'https://asiaicehockey.com/score/27007'),
('2027-01-24 14:00:00+09', 'Shinyokohama', 4, 5, 'https://asiaicehockey.com/score/27008'),
('2027-01-26 18:30:00+09', 'Tomakomai', 2, 1, 'https://asiaicehockey.com/score/27010'),
('2027-01-30 14:00:00+09', 'Nishitokyo', 3, 5, 'https://asiaicehockey.com/score/27011'),
('2027-01-31 14:00:00+09', 'Nishitokyo', 3, 5, 'https://asiaicehockey.com/score/27012'),
('2027-02-06 14:00:00+09', 'Nikko', 5, 1, 'https://asiaicehockey.com/score/27014'),
('2027-02-06 14:00:00+09', 'Hachinohe', 3, 6, 'https://asiaicehockey.com/score/27013'),
('2027-02-06 15:00:00+09', 'Shinyokohama', 4, 2, 'https://asiaicehockey.com/score/27015'),
('2027-02-07 13:00:00+09', 'Hachinohe', 3, 6, 'https://asiaicehockey.com/score/27016'),
('2027-02-07 14:00:00+09', 'Nikko', 5, 1, 'https://asiaicehockey.com/score/27017'),
('2027-02-07 14:00:00+09', 'Shinyokohama', 4, 2, 'https://asiaicehockey.com/score/27018'),
('2027-02-13 14:00:00+09', 'Nikko', 5, 3, 'https://asiaicehockey.com/score/27019'),
('2027-02-14 14:00:00+09', 'Nikko', 5, 3, 'https://asiaicehockey.com/score/27020'),
('2027-02-18 19:00:00+09', 'Anyang', 1, 3, 'https://asiaicehockey.com/score/27021'),
('2027-02-20 14:00:00+09', 'Kobe', 6, 4, 'https://asiaicehockey.com/score/27023'),
('2027-02-20 15:00:00+09', 'Tomakomai', 2, 5, 'https://asiaicehockey.com/score/27022'),
('2027-02-20 16:00:00+09', 'Anyang', 1, 3, 'https://asiaicehockey.com/score/27024'),
('2027-02-21 13:00:00+09', 'Kobe', 6, 4, 'https://asiaicehockey.com/score/27026'),
('2027-02-21 14:00:00+09', 'Tomakomai', 2, 5, 'https://asiaicehockey.com/score/27025'),
('2027-02-21 14:00:00+09', 'Anyang', 1, 3, 'https://asiaicehockey.com/score/27027'),
('2027-02-27 14:00:00+09', 'Hachinohe', 3, 2, 'https://asiaicehockey.com/score/27028'),
('2027-02-27 15:00:00+09', 'Shinyokohama', 4, 1, 'https://asiaicehockey.com/score/27029'),
('2027-02-28 14:00:00+09', 'Hachinohe', 3, 2, 'https://asiaicehockey.com/score/27030'),
('2027-02-28 14:00:00+09', 'Shinyokohama', 4, 1, 'https://asiaicehockey.com/score/27031'),
('2027-03-02 19:00:00+09', 'Shinyokohama', 4, 1, 'https://asiaicehockey.com/score/27032'),
('2027-03-06 15:00:00+09', 'Tomakomai', 2, 6, 'https://asiaicehockey.com/score/27033'),
('2027-03-06 15:00:00+09', 'Shinyokohama', 4, 5, 'https://asiaicehockey.com/score/27034'),
('2027-03-07 14:00:00+09', 'Tomakomai', 2, 6, 'https://asiaicehockey.com/score/27035'),
('2027-03-07 14:00:00+09', 'Shinyokohama', 4, 5, 'https://asiaicehockey.com/score/27036'),
('2027-03-11 19:00:00+09', 'Amagasaki', 6, 1, 'https://asiaicehockey.com/score/27037'),
('2027-03-13 14:00:00+09', 'Hachinohe', 3, 4, 'https://asiaicehockey.com/score/27038'),
('2027-03-13 14:00:00+09', 'Nikko', 5, 2, 'https://asiaicehockey.com/score/27039'),
('2027-03-13 14:00:00+09', 'Amagasaki', 6, 1, 'https://asiaicehockey.com/score/27040'),
('2027-03-14 13:00:00+09', 'Amagasaki', 6, 1, 'https://asiaicehockey.com/score/27043'),
('2027-03-14 14:00:00+09', 'Hachinohe', 3, 4, 'https://asiaicehockey.com/score/27041'),
('2027-03-14 14:00:00+09', 'Nikko', 5, 2, 'https://asiaicehockey.com/score/27042')
), matched AS (
  SELECT schedule.id, source.score_url
  FROM source
  JOIN public.alih_schedule AS schedule
    ON schedule.season = '2026-27'
   AND schedule.match_at = source.match_at::timestamptz
   AND schedule.home_alih_team_id = source.home_alih_team_id
   AND schedule.away_alih_team_id = source.away_alih_team_id
), guard AS (
  SELECT CASE WHEN count(*) = 120 AND count(DISTINCT id) = 120 THEN 1 ELSE 1 / 0 END AS ok
  FROM matched
)
UPDATE public.alih_schedule AS schedule
SET score_url = matched.score_url
FROM matched CROSS JOIN guard
WHERE schedule.id = matched.id;


DO $$
BEGIN
  IF (SELECT count(*) FROM public.alih_schedule WHERE season = '2026-27' AND score_url IS NOT NULL) <> 120
     OR (SELECT count(DISTINCT score_url) FROM public.alih_schedule WHERE season = '2026-27') <> 120 THEN
    RAISE EXCEPTION '2026-27 score_url reconciliation did not map 120 unique games';
  END IF;
END $$;
