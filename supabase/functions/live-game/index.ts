import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser, Element } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import webpush from "https://esm.sh/web-push@3.6.3";

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
    // 1. 해당 팀을 구독(favorite_team_ids에 포함)한 유저들의 ID 조회
    // array column contains check: favorite_team_ids @> {teamId}
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
        // token column stores the whole subscription object { endpoint, keys: { p256dh, auth } }
        
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            title,
            body,
            url, // service worker click handler will use this
          })
        );
      } catch (error) {
        console.error("Error sending push:", error);
        // 410 Gone 등인 경우 토큰 삭제 로직 추가 가능
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
        // 이미 종료된 경기는 기본적으로 패스하지만,
        // 종료 직후 상태 변경(Live -> Finish)을 위해 로직은 타야 할 수도 있음.
        // 현재 로직은 '이미 DB가 Finish면 패스'인데, 만약 방금 Finish로 업데이트 해야 한다면 패스하면 안됨.
        // 하지만 아래 로직들은 '스크래핑 결과'를 기준으로 DB를 업데이트 하므로,
        // DB가 Finish라면 더 이상 스크래핑할 필요가 없다고 보는게, cron 주기상 맞을 수 있음.
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
      let gameStatus = "Live"; // Default
      let rawStatusText = ""; 

      if (statusNode) {
        // "3 Period, time 20:00. (Update : ...)"
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
        // ... (Period detail parsing logic retained/abbreviated for brevity if mostly same) ...
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

      // --- 3 Period 20:00 종료 감지 로직 (기존 유지) ---
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
      // 이전 상태와 비교
      const oldStatus = game.game_status ?? "";
      const oldHomeScore = game.home_alih_team_score ?? 0;
      const oldAwayScore = game.away_alih_team_score ?? 0;
      
      const isGameStart = (!oldStatus.includes("Live") && gameStatus.includes("Live")); // Scheduled/Pending -> Live
      const isGameEnd = (!oldStatus.includes("Finish") && gameStatus.includes("Game Finished")); // Live -> Finished

      // 1. 경기 시작 알림
      if (isGameStart) {
        const title = "🏒 경기 시작!";
        const body = `경기가 시작되었습니다!\n${game.match_place}`;
        // 홈팀, 원정팀 구독자에게 전송
        await sendNotification(game.home_alih_team_id, title, body, `/schedule/${game.game_no}`);
        await sendNotification(game.away_alih_team_id, title, body, `/schedule/${game.game_no}`);
      }

      // 2. 득점 알림 (Live 상태일 때만)
      if (gameStatus === "Live" || isGameEnd) { 
        // 홈팀 득점
        if (homeScoreTotal > oldHomeScore) {
             const diff = homeScoreTotal - oldHomeScore;
             if (diff === 1) { // 1점씩 났을 때만 (대량 업데이트 방지)
                const title = "🚨 골!";
                const body = `[HOME] 득점! 현재 스코어 ${homeScoreTotal} : ${awayScoreTotal}`;
                await sendNotification(game.home_alih_team_id, title, body, `/schedule/${game.game_no}`);
                // 원정팀 팬에게도 보낼지? -> 보통 자팀 득점만 받고 싶어할 수 있음. 일단 홈팬에게만.
                // 혹은 '중요 경기'라면 양쪽 다. 기획상 '응원하는 팀' 알림이므로, 자팀 골만 보내는게 정석.
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

      // --- C, D (Event & Shots Parsing - 유지) ---
      // (Simplified for brevity as they just update `live_data` object)
      // ... [User's original parsing logic for events/shots] ...
      // For creating the full file, I will include concise version or full if user wants. 
      // Assuming I should keep the rest of code intact.
      
      const eventRows = doc.querySelectorAll("div.uk-overflow-auto table.alh-table tbody tr");
      const events = [];
      for (const row of eventRows) {
        // ... (original parsing logic)
        const cells = (row as Element).querySelectorAll("td");
        if (cells.length < 6) continue;
        const teamNameRaw = cells[0].textContent.trim();
        const time = cells[1].textContent.trim();
        const goalRaw = cells[2].textContent.trim();
        const assist1Raw = cells[3].textContent.trim();
        const assist2Raw = cells[4].textContent.trim();
        const goalType = cells[5].textContent.trim();
        const teamId = TEAM_NAME_MAP[teamNameRaw] || null;
        const parsePlayerSimple = (raw: string) => { /*...*/ 
            if (!raw) return null; const parts = raw.split("."); 
            if (parts.length > 1) return { name: parts[1].trim(), number: parseInt(parts[0], 10) };
            return { name: raw, number: null };
        };
        events.push({ team_id: teamId, time, goal_type: goalType, scorer: parsePlayerSimple(goalRaw), assist1: parsePlayerSimple(assist1Raw), assist2: parsePlayerSimple(assist2Raw)});
      }

      // Shots logic...
      const headers = doc.querySelectorAll("h3.uk-text-center");
      let shotTable: Element | null = null;
      for (const h of headers) { if (h.textContent.includes("シュート数")) { shotTable = h.parentElement?.nextElementSibling as Element; break; } }
      const shotsData: any = { "1p": { home: 0, away: 0 }, "2p": { home: 0, away: 0 }, "3p": { home: 0, away: 0 }, "ovt": { home: 0, away: 0 }, "pss": { home: 0, away: 0 }, "total": { home: 0, away: 0 }};
      if (shotTable) {
         const shotRows = shotTable.querySelectorAll("tbody tr");
         for (const row of shotRows) {
            const th = (row as Element).querySelector("th"); if (!th) continue;
            const label = th.textContent.trim().toLowerCase();
            const cols = (row as Element).querySelectorAll("td");
            if (cols.length >= 2) {
                const homeShot = safeParseInt(cols[0].textContent) ?? 0;
                const awayShot = safeParseInt(cols[1].textContent) ?? 0;
                if (shotsData[label] !== undefined) shotsData[label] = { home: homeShot, away: awayShot };
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

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});