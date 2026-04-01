-- =====================================================
-- V7: Playoff Schedule Update
-- Description: Inserting 2025-26 Season Playoff Matches
-- Date: 2026-03-15
-- =====================================================

DO $$
DECLARE
    v_last_game_no INT;
BEGIN
    -- Get the last game number to ensure continuity
    SELECT COALESCE(MAX(game_no), 120) INTO v_last_game_no FROM alih_schedule;

    -- Team IDs:
    -- 1: HL Anyang
    -- 2: Red Eagles Hokkaido
    -- 3: Tohoku Free Blades
    -- 5: Nikko Icebucks

    INSERT INTO alih_schedule (game_no, home_alih_team_id, away_alih_team_id, match_at, match_place, game_status)
    VALUES 
        -- 03/19 (Thursday)
        (v_last_game_no + 1, 2, 3, '2026-03-19 18:30:00+09', 'TOMAKOMAI', 'Scheduled'),
        (v_last_game_no + 2, 1, 5, '2026-03-19 19:00:00+09', 'ANYANG', 'Scheduled'),
        
        -- 03/21 (Saturday)
        (v_last_game_no + 3, 2, 3, '2026-03-21 15:00:00+09', 'TOMAKOMAI', 'Scheduled'),
        (v_last_game_no + 4, 1, 5, '2026-03-21 16:00:00+09', 'ANYANG', 'Scheduled'),
        
        -- 03/22 (Sunday)
        (v_last_game_no + 5, 2, 3, '2026-03-22 14:00:00+09', 'TOMAKOMAI', 'Scheduled'),
        (v_last_game_no + 6, 1, 5, '2026-03-22 14:00:00+09', 'ANYANG', 'Scheduled');

    RAISE NOTICE 'Inserted 6 playoff matches starting from game_no %', v_last_game_no + 1;
END $$;
