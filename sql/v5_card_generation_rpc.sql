-- =====================================================
-- V5: Player Card Generation RPC
-- 실행일: 2026-02-18
-- 설명: 
--   선수 카드 발급을 위한 동시성 제어 함수 (RPC)
-- 의존성: v4_player_profile.sql (player_cards 테이블)
-- =====================================================

-- 함수: generate_player_card
-- 설명: 다음 시리얼 번호를 계산하고 카드를 발급합니다. 이미 발급된 경우 기존 카드를 반환합니다.
CREATE OR REPLACE FUNCTION generate_player_card(p_player_id INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_next_serial INTEGER;
  v_card_id BIGINT;
  v_existing_card JSONB;
BEGIN
  -- 1. 현재 로그인한 사용자 ID 가져오기
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. 이미 카드가 있는지 확인
  SELECT row_to_json(pc)::jsonb INTO v_existing_card
  FROM player_cards pc
  WHERE pc.user_id = v_user_id AND pc.player_id = p_player_id;

  IF v_existing_card IS NOT NULL THEN
    RETURN v_existing_card;
  END IF;

  -- 3. 다음 시리얼 번호 계산 (Locking을 위해 perform 사용 가능하나, 여기서는 간단히 max+1)
  -- 동시성 이슈를 줄이기 위해 Advisory Lock을 사용할 수도 있지만, 
  -- 트래픽이 적으므로 테이블 락이나 단순 max+1로 처리 (Unique 제약조건으로 중복 방지됨)
  
  -- 트랜잭션 격리 수준에 따라 다르지만, SERIALIZABLE이 아니면 중복 시리얼이 생길 수 있음.
  -- 여기서는 player_id 별로 lock을 걸어 순차 발급 보장
  PERFORM pg_advisory_xact_lock(hashtext('generate_card_' || p_player_id));

  SELECT COALESCE(MAX(serial_number), 0) + 1 INTO v_next_serial
  FROM player_cards
  WHERE player_id = p_player_id;

  -- 4. 카드 생성
  INSERT INTO player_cards (user_id, player_id, serial_number)
  VALUES (v_user_id, p_player_id, v_next_serial)
  RETURNING id INTO v_card_id;

  -- 5. 생성된 카드 반환
  SELECT row_to_json(pc)::jsonb INTO v_existing_card
  FROM player_cards pc
  WHERE pc.id = v_card_id;

  RETURN v_existing_card;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
