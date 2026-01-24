import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
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
  if (!teamId) {
    console.log(`[PUSH] Skipped: Invalid teamId (null)`);
    return;
  }

  console.log(`[PUSH] Preparing to send to Team ID ${teamId} | Title: "${title}"`);

  try {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .contains('favorite_team_ids', [teamId]);

    if (profileError) {
      console.error(`[PUSH] Error fetching profiles for team ${teamId}:`, profileError);
      return;
    }
    if (!profiles || profiles.length === 0) {
      console.log(`[PUSH] No subscribers found for team ${teamId}.`);
      return;
    }

    const userIds = profiles.map(p => p.id);
    // console.log(`[PUSH] Found ${userIds.length} subscribers. Fetching tokens...`);

    const { data: tokens, error: tokenError } = await supabase
      .from('notification_tokens')
      .select('token')
      .in('user_id', userIds);

    if (tokenError) {
      console.error(`[PUSH] Error fetching tokens:`, tokenError);
      return;
    }
    if (!tokens || tokens.length === 0) {
      console.log(`[PUSH] No active tokens found for these users.`);
      return;
    }

    console.log(`[PUSH] Sending to ${tokens.length} devices...`);

    const notifications = tokens.map((t) => {
      // 토큰이 문자열이면 파싱 (text 컬럼 대응)
      const subscription = typeof t.token === 'string' ? JSON.parse(t.token) : t.token;
      return webpush.sendNotification(subscription, JSON.stringify({ title, body, url }));
    });

    const results = await Promise.allSettled(notifications);
    const successCount = results.filter((r: PromiseSettledResult<void>) => r.status === 'fulfilled').length;
    const failCount = results.filter((r: PromiseSettledResult<void>) => r.status === 'rejected').length;

    // 실패한 케이스 상세 로깅
    results.forEach((r: PromiseSettledResult<void>, idx: number) => {
      if (r.status === 'rejected') {
        const error = (r as PromiseRejectedResult).reason;
        const statusCode = error?.statusCode || error?.status || 'unknown';
        const errorBody = error?.body || error?.message || JSON.stringify(error);
        const endpoint = tokens[idx]?.token?.endpoint || 
          (typeof tokens[idx]?.token === 'string' ? JSON.parse(tokens[idx].token)?.endpoint : 'unknown');
        
        console.error(`[PUSH] ❌ Device ${idx} Failed:`);
        console.error(`  - Status Code: ${statusCode}`);
        console.error(`  - Error Body: ${errorBody}`);
        console.error(`  - Endpoint: ${endpoint}`);
        
        // 410 Gone = 만료된 구독, 삭제 권장
        if (statusCode === 410) {
          console.warn(`  - ⚠️ Subscription expired (410 Gone). Consider removing this token.`);
        }
      }
    });

    console.log(`[PUSH] Result for Team ${teamId}: ✅ Success: ${successCount}, ❌ Failed: ${failCount}`);

  } catch (err) {
    console.error(`[PUSH] Critical Logic Error:`, err);
  }
}

serve(async (req) => {
  try {
    console.log("--- Starting Live Polling ---");

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: potentialGames, error: fetchError } = await supabase
      .from("alih_schedule")
      .select("*")
      .gte("match_at", yesterday.toISOString())
      .lte("match_at", now.toISOString());

    if (fetchError) {
        console.error("[DB] Error fetching games:", fetchError);
        throw fetchError;
    }

    const ongoingGames = (potentialGames || []).filter((game) => {
      const status = game.game_status ? game.game_status.toLowerCase() : "";
      return !(status.includes("finish") || status.includes("final") || status.includes("試合終了"));
    });

    if (ongoingGames.length === 0) {
      console.log("[INFO] No ongoing games found.");
      return new Response(JSON.stringify({ message: "No ongoing games." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[INFO] Found ${ongoingGames.length} active games.`);

    const results = [];

    for (const game of ongoingGames) {
      const targetUrlId = (game.game_no ?? 0) + 20388;
      const targetUrl = `https://asiaicehockey.com/score/${targetUrlId}`;
      
      console.log(`[GAME ${game.game_no}] Fetching URL: ${targetUrl}`);

      const response = await fetch(targetUrl);
      const htmlText = await response.text();
      const doc = new DOMParser().parseFromString(htmlText, "text/html");

      if (!doc) {
          console.warn(`[GAME ${game.game_no}] Failed to parse HTML.`);
          continue;
      }

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

      // --- 3 Period 20:00 종료 감지 ---
      let endRegulationDetectedAt = game.live_data?.end_regulation_detected_at ?? null;
      const isThirdPeriodEnd = rawStatusText.includes("3 Period") && rawStatusText.includes("20:00");
      const isTied = homeScoreTotal === awayScoreTotal;

      const isStatusFinished = gameStatus.toLowerCase().includes("finish") || gameStatus.includes("試合終了") || gameStatus.toLowerCase().includes("final");

      if (!isStatusFinished) {
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
      
      // 최종적으로 상태가 Finish인지 다시 확인 (위의 3분 대기 로직 결과 반영)
      const isGameEndStatus = gameStatus.toLowerCase().includes("game finished") || gameStatus.includes("試合終了");
      if (isGameEndStatus) {
         gameStatus = "Game Finished"; 
      }

      // --- [NOTIFICATION LOGIC FIX] ---
      const oldStatus = game.game_status ?? "";
      const oldHomeScore = game.home_alih_team_score ?? 0;
      const oldAwayScore = game.away_alih_team_score ?? 0;

      // "Live" 판단 로직 수정: 정확히 "Live"가 아니어도 Period, OVT 등이 포함되면 진행 중으로 간주
      const isLiveActive = !isGameEndStatus && (
          gameStatus === "Live" || 
          gameStatus.includes("Period") || 
          gameStatus.includes("OVT") || 
          gameStatus.includes("PSS") ||
          gameStatus.includes("GWS")
      );

      console.log(`[GAME ${game.game_no}] Check: DB[${oldHomeScore}:${oldAwayScore} (${oldStatus})] vs Web[${homeScoreTotal}:${awayScoreTotal} (${gameStatus})] | LiveActive: ${isLiveActive}`);

      // 경기 시작: 이전에는 Live 관련 문구가 없었는데, 지금 생겼을 때
      const wasNotLive = !oldStatus.includes("Live") && !oldStatus.includes("Period") && !oldStatus.includes("OVT");
      const isGameStart = wasNotLive && isLiveActive;
      
      const isGameEnd = (!oldStatus.includes("Finish") && isGameEndStatus);

      // 1. 경기 시작 알림
      if (isGameStart) {
        console.log(`[EVENT] Game Start Detected: Game ${game.game_no}`);
        const title = "🏒 경기 시작!";
        const body = `경기가 시작되었습니다!\n${game.match_place}`;
        await sendNotification(game.home_alih_team_id, title, body, `/schedule/${game.game_no}`);
        await sendNotification(game.away_alih_team_id, title, body, `/schedule/${game.game_no}`);
      }

      // 2. 득점 알림 (진행 중이거나, 막 종료되었을 때)
      if (isLiveActive || isGameEnd) { 
        // 홈팀 득점
        if (homeScoreTotal > oldHomeScore) {
            console.log(`[EVENT] HOME Goal Detected: Game ${game.game_no} (${oldHomeScore} -> ${homeScoreTotal})`);
            const title = "🚨 골!";
            const body = `[HOME] 득점! 현재 스코어 ${homeScoreTotal} : ${awayScoreTotal}`;
            await sendNotification(game.home_alih_team_id, title, body, `/schedule/${game.game_no}`);
        }
        // 원정팀 득점
        if (awayScoreTotal > oldAwayScore) {
            console.log(`[EVENT] AWAY Goal Detected: Game ${game.game_no} (${oldAwayScore} -> ${awayScoreTotal})`);
            const title = "🚨 골!";
            const body = `[AWAY] 득점! 현재 스코어 ${homeScoreTotal} : ${awayScoreTotal}`;
            await sendNotification(game.away_alih_team_id, title, body, `/schedule/${game.game_no}`);
        }
      }

      // 3. 경기 종료 알림
      if (isGameEnd) {
         console.log(`[EVENT] Game Finished Detected: Game ${game.game_no}`);
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
            const label = th.textContent.trim().toLowerCase();
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
        console.error(`[DB] Error updating game ${game.id}:`, updateError);
      } else {
         console.log(`[DB] Updated Game ${game.id} Successfully.`);
         results.push({ id: game.id, status: "Updated", score: `${homeScoreTotal}-${awayScoreTotal} (${gameStatus})` });
      }
    }

    console.log("--- Polling Completed ---");

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[ERROR] Unhandled Exception:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});