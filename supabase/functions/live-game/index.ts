import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// deno-dom 버전을 고정(v0.1.38)하여 안정성 확보
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
// [중요 수정] esm.sh 대신 npm: 스키마 사용 (Node 호환성 문제 해결)
import webpush from "npm:web-push@3.6.3";

// 1. Supabase 클라이언트 설정
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

// VAPID 설정
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

// 2. 일본어 팀명 -> DB Team ID 매핑
const TEAM_NAME_MAP: Record<string, number> = {
  "HLアニャンアイスホッケークラブ": 1,
  "レッドイーグルス北海道": 2,
  "東北フリーブレイズ": 3,
  "横浜GRITS": 4,
  "H.C.栃木日光アイスバックス": 5,
  "スターズ神戸": 6,
  "HLアニャン": 1,
  "レッドイーグルス": 2,
  "イーグルス": 2,
  "フリーブレイズ": 3,
  "グリッツ": 4,
  "アイスバックス": 5,
  "スターズ": 6
};

// 숫자 파싱 헬퍼
const safeParseInt = (text: string | undefined | null): number | null => {
  if (!text) return null;
  const cleaned = text.trim();
  if (cleaned === "") return null;
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
};

// 알림 전송 함수
async function sendNotification(teamId: number | null, title: string, body: string, url: string) {
  if (!teamId) return;

  try {
    // 1. 해당 팀을 구독한 유저들의 ID 조회
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .contains('favorite_team_ids', [teamId]);

    if (profileError || !profiles || profiles.length === 0) {
      console.log(`No users found subscribing to team ${teamId}`);
      return;
    }

    const userIds = profiles.map(p => p.id);

    // 2. 해당 유저들의 알림 토큰 조회
    const { data: tokens, error: tokenError } = await supabase
      .from('notification_tokens')
      .select('token')
      .in('user_id', userIds);

    if (tokenError || !tokens || tokens.length === 0) {
      console.log(`No tokens found for interested users.`);
      return;
    }

    console.log(`Sending notification to ${tokens.length} devices for team ${teamId}...`);

    // 3. 알림 전송 (Promise.allSettled)
    const notifications = tokens.map(async (t) => {
      try {
        const pushSubscription = t.token; 
        
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            title,
            body,
            url, 
          })
        );
      } catch (error) {
        console.error("Error sending push:", error);
        // 필요 시 410 Gone 에러 처리(토큰 삭제) 로직 추가
      }
    });

    await Promise.allSettled(notifications);
    console.log("Notifications sent.");

  } catch (err) {
    console.error("Notification logic error:", err);
  }
}

serve(async (req) => {
  try {
    console.log("Starting Live Polling...");

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // ---------------------------------------------------------
    // 3. 진행 중인 경기 조회
    // ---------------------------------------------------------
    const { data: potentialGames, error: fetchError } = await supabase
      .from("alih_schedule")
      .select("*")
      .gte("match_at", yesterday.toISOString())
      .lte("match_at", now.toISOString());

    if (fetchError) throw fetchError;

    // 종료된 게임 필터링
    const ongoingGames = (potentialGames || []).filter((game) => {
      const status = game.game_status ? game.game_status.toLowerCase() : "";
      if (status.includes("finish") || status.includes("final") || status.includes("試合終了")) {
        return false;
      }
      return true;
    });

    if (ongoingGames.length === 0) {
      return new Response(JSON.stringify({ message: "No ongoing games to update." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${ongoingGames.length} active games.`);

    const results = [];

    // ---------------------------------------------------------
    // 4. 각 경기별 Polling 및 파싱
    // ---------------------------------------------------------
    for (const game of ongoingGames) {
      const targetUrlId = (game.game_no ?? 0) + 20388;
      const targetUrl = `https://asiaicehockey.com/score/${targetUrlId}`;
      console.log(`Fetching: ${targetUrl}`);

      const response = await fetch(targetUrl);
      const htmlText = await response.text();
      const doc = new DOMParser().parseFromString(htmlText, "text/html");

      if (!doc) continue;

      // --- A. 경기 시간 및 상태 텍스트 파싱 ---
      const statusNode = doc.querySelector(".uk-text-lighter.uk-text-right");
      let gameStatus = "Live"; 
      let rawStatusText = ""; 

      if (statusNode) {
        rawStatusText = statusNode.textContent.trim(); 
        gameStatus = rawStatusText.split("(")[0].trim();
      }

      // --- B. 스코어 파싱 ---
      const scoreRows = doc.querySelectorAll("table.alh-table.report tbody tr");
      let homeScoreTotal = 0;
      let awayScoreTotal = 0;
      
      const periodScores = {
        "1p": { home: null as number | null, away: null as number | null },
        "2p": { home: null as number | null, away: null as number | null },
        "3p": { home: null as number | null, away: null as number | null },
        "ovt": { home: null as number | null, away: null as number | null },
        "pss": { home: null as number | null, away: null as number | null },
      };

      if (scoreRows.length > 0) {
        const totalHeaders = (scoreRows[0] as Element).querySelectorAll("th");
        if (totalHeaders.length >= 2) {
            homeScoreTotal = safeParseInt(totalHeaders[0].textContent) ?? 0;
            awayScoreTotal = safeParseInt(totalHeaders[1].textContent) ?? 0;
        }
        
        const row0Cells = (scoreRows[0] as Element).querySelectorAll("td");
        if (row0Cells.length >= 4) {
             periodScores["1p"].home = safeParseInt(row0Cells[1].textContent);
             periodScores["1p"].away = safeParseInt(row0Cells[3].textContent);
        }
        const parseSubRow = (rowIndex: number) => {
            if (scoreRows.length <= rowIndex) return { home: null, away: null };
            const cells = (scoreRows[rowIndex] as Element).querySelectorAll("td");
            if (cells.length >= 3) {
                return { home: safeParseInt(cells[0].textContent), away: safeParseInt(cells[2].textContent) };
            }
            return { home: null, away: null };
        };
        periodScores["2p"] = parseSubRow(1);
        periodScores["3p"] = parseSubRow(2);
        periodScores["ovt"] = parseSubRow(3);
        periodScores["pss"] = parseSubRow(4);
      }

      // --- 3 Period 20:00 종료 감지 로직 ---
      let endRegulationDetectedAt = game.live_data?.end_regulation_detected_at ?? null;
      const isThirdPeriodEnd = rawStatusText.includes("3 Period") && rawStatusText.includes("20:00");
      const isTied = homeScoreTotal === awayScoreTotal;

      if (!gameStatus.toLowerCase().includes("finish") && !gameStatus.includes("試合終了")) {
        if (isThirdPeriodEnd && !isTied) {
            if (!endRegulationDetectedAt) {
                endRegulationDetectedAt = new Date().toISOString();
            } else {
                const diffMs = now.getTime() - new Date(endRegulationDetectedAt).getTime();
                if (diffMs / (1000 * 60) >= 3) {
                    gameStatus = "Game Finished";
                }
            }
        } else {
            if (endRegulationDetectedAt) endRegulationDetectedAt = null;
        }
      }
      if (gameStatus.toLowerCase().includes("game finished") || gameStatus.includes("試合終了")) {
         gameStatus = "Game Finished"; 
      }

      // --- [NOTIFICATION LOGIC] ---
      const oldStatus = game.game_status ?? "";
      const oldHomeScore = game.home_alih_team_score ?? 0;
      const oldAwayScore = game.away_alih_team_score ?? 0;
      
      const isGameStart = (!oldStatus.includes("Live") && gameStatus.includes("Live"));
      const isGameEnd = (!oldStatus.includes("Finish") && gameStatus.includes("Game Finished"));

      // 1. 경기 시작 알림
      if (isGameStart) {
        const title = "🏒 경기 시작!";
        const body = `경기가 시작되었습니다!\n${game.match_place}`;
        await sendNotification(game.home_alih_team_id, title, body, `/schedule/${game.game_no}`);
        await sendNotification(game.away_alih_team_id, title, body, `/schedule/${game.game_no}`);
      }

      // 2. 득점 알림 (Live 상태)
      if (gameStatus === "Live" || isGameEnd) { 
        // 홈팀 득점
        if (homeScoreTotal > oldHomeScore) {
             const diff = homeScoreTotal - oldHomeScore;
             if (diff === 1) { 
                const title = "🚨 골!";
                const body = `[HOME] 득점! 현재 스코어 ${homeScoreTotal} : ${awayScoreTotal}`;
                await sendNotification(game.home_alih_team_id, title, body, `/schedule/${game.game_no}`);
             }
        }
        // 원정팀 득점
        if (awayScoreTotal > oldAwayScore) {
             const diff = awayScoreTotal - oldAwayScore;
             if (diff === 1) {
                const title = "🚨 골!";
                const body = `[AWAY] 득점! 현재 스코어 ${homeScoreTotal} : ${awayScoreTotal}`;
                await sendNotification(game.away_alih_team_id, title, body, `/schedule/${game.game_no}`);
             }
        }
      }

      // 3. 경기 종료 알림
      if (isGameEnd) {
         const title = "🏁 경기 종료";
         const body = `최종 스코어 ${homeScoreTotal} : ${awayScoreTotal}`;
         await sendNotification(game.home_alih_team_id, title, body, `/schedule/${game.game_no}`);
         await sendNotification(game.away_alih_team_id, title, body, `/schedule/${game.game_no}`);
      }

      // --- C. 이벤트 파싱 ---
      const eventRows = doc.querySelectorAll("div.uk-overflow-auto table.alh-table tbody tr");
      const events = [];
      for (const row of eventRows) {
        const cells = (row as Element).querySelectorAll("td");
        if (cells.length < 6) continue;
        const teamNameRaw = cells[0].textContent.trim();
        const time = cells[1].textContent.trim();
        const goalRaw = cells[2].textContent.trim();
        const assist1Raw = cells[3].textContent.trim();
        const assist2Raw = cells[4].textContent.trim();
        const goalType = cells[5].textContent.trim();
        const teamId = TEAM_NAME_MAP[teamNameRaw] || null;
        
        const parsePlayerSimple = (raw: string) => { 
            if (!raw) return null; 
            const parts = raw.split("."); 
            if (parts.length > 1) return { name: parts[1].trim(), number: parseInt(parts[0], 10) };
            return { name: raw, number: null };
        };
        events.push({ 
            team_id: teamId, 
            time, 
            goal_type: goalType, 
            scorer: parsePlayerSimple(goalRaw), 
            assist1: parsePlayerSimple(assist1Raw), 
            assist2: parsePlayerSimple(assist2Raw)
        });
      }

      // --- D. 슈팅 수 파싱 ---
      const headers = doc.querySelectorAll("h3.uk-text-center");
      let shotTable: Element | null = null;
      for (const h of headers) { 
        if (h.textContent.includes("シュート数")) { 
            shotTable = h.parentElement?.nextElementSibling as Element; 
            break; 
        } 
      }
      
      const shotsData: any = { "1p": { home: 0, away: 0 }, "2p": { home: 0, away: 0 }, "3p": { home: 0, away: 0 }, "ovt": { home: 0, away: 0 }, "pss": { home: 0, away: 0 }, "total": { home: 0, away: 0 }};
      
      if (shotTable) {
         const shotRows = shotTable.querySelectorAll("tbody tr");
         for (const row of shotRows) {
            const th = (row as Element).querySelector("th"); 
            if (!th) continue;
            const label = th.textContent.trim().toLowerCase(); // 1p, 2p, ...
            const cols = (row as Element).querySelectorAll("td");
            if (cols.length >= 2) {
                const homeShot = safeParseInt(cols[0].textContent) ?? 0;
                const awayShot = safeParseInt(cols[1].textContent) ?? 0;
                if (shotsData[label] !== undefined) {
                    shotsData[label] = { home: homeShot, away: awayShot };
                }
            }
         }
      }

      // --- E. DB 업데이트 ---
      const { error: updateError } = await supabase
        .from("alih_schedule")
        .update({
          home_alih_team_score: homeScoreTotal,
          away_alih_team_score: awayScoreTotal,
          game_status: gameStatus, 
          live_data: {
            updated_at_source: gameStatus,
            end_regulation_detected_at: endRegulationDetectedAt, 
            scores_by_period: periodScores,
            events: events,
            shots: shotsData,
            polled_at: new Date().toISOString()
          }
        })
        .eq("id", game.id);

      if (updateError) {
        console.error(`Error updating game ${game.id}:`, updateError);
      } else {
         results.push({ id: game.id, status: "Updated", score: `${homeScoreTotal}-${awayScoreTotal} (${gameStatus})` });
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});