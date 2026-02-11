import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import webpush from "npm:web-push@3.6.3";

// 1. Supabase 클라이언트 설정
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

// VAPID 설정 (유효성 검사 로직 복구)
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
let vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";

// VAPID Subject가 이메일 주소만 있는 경우 'mailto:'를 강제로 붙임
if (!vapidSubject.startsWith("mailto:") && !vapidSubject.startsWith("http")) {
  vapidSubject = `mailto:${vapidSubject}`;
}

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.error(`[INIT] VAPID Setup Error:`, err);
  }
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

// 팀명 조회 타입
interface TeamNames {
  ko: string;
  ja: string;
  en: string;
}

// 팀명을 언어별로 가져오는 헬퍼 함수
async function getTeamNames(teamId: number): Promise<TeamNames | null> {
  const { data, error } = await supabase
    .from('alih_teams')
    .select('name, japanese_name, english_name')
    .eq('id', teamId)
    .single();
  
  if (error || !data) {
    console.error(`[PUSH] Error fetching team names for ID ${teamId}:`, error);
    return null;
  }
  return {
    ko: data.name || data.english_name,
    ja: data.japanese_name || data.english_name,
    en: data.english_name
  };
}

// 언어별 알림 메시지 템플릿
type NotificationType = 'game_start' | 'goal' | 'game_end' | 'reminder';

interface MessageData {
  homeTeam: string;
  awayTeam: string;
  scoringTeam?: string;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
  time?: string;  
}

function getNotificationMessage(
  type: NotificationType,
  lang: string,
  data: MessageData
): { title: string; body: string } {
  const templates: Record<NotificationType, Record<string, { title: string; body: string }>> = {
    reminder: {
      ko: { title: '⏰ 30분 후 경기!', body: `${data.homeTeam} vs ${data.awayTeam}\n${data.time} 시작 | ${data.venue || '경기장'}` },
      ja: { title: '⏰ 30分後に試合!', body: `${data.homeTeam} vs ${data.awayTeam}\n${data.time} 開始 | ${data.venue || '会場'}` },
      en: { title: '⏰ Game in 30 min!', body: `${data.homeTeam} vs ${data.awayTeam}\n${data.time} start | ${data.venue || 'Venue'}` }
    },
    game_start: {
      ko: { title: '🏒 경기 시작!', body: `${data.homeTeam} vs ${data.awayTeam}\n${data.venue || '경기장'}` },
      ja: { title: '🏒 試合開始!', body: `${data.homeTeam} vs ${data.awayTeam}\n${data.venue || '会場'}` },
      en: { title: '🏒 Game Started!', body: `${data.homeTeam} vs ${data.awayTeam}\n${data.venue || 'Venue'}` }
    },
    goal: {
      ko: { title: '🚨 골!', body: `${data.scoringTeam} 득점!\n${data.homeTeam} ${data.homeScore} : ${data.awayScore} ${data.awayTeam}` },
      ja: { title: '🚨 ゴール!', body: `${data.scoringTeam} 得点!\n${data.homeTeam} ${data.homeScore} : ${data.awayScore} ${data.awayTeam}` },
      en: { title: '🚨 Goal!', body: `${data.scoringTeam} scores!\n${data.homeTeam} ${data.homeScore} : ${data.awayScore} ${data.awayTeam}` }
    },
    game_end: {
      ko: { title: '🏁 경기 종료', body: `${data.homeTeam} ${data.homeScore} : ${data.awayScore} ${data.awayTeam}` },
      ja: { title: '🏁 試合終了', body: `${data.homeTeam} ${data.homeScore} : ${data.awayScore} ${data.awayTeam}` },
      en: { title: '🏁 Game Over', body: `${data.homeTeam} ${data.homeScore} : ${data.awayScore} ${data.awayTeam}` }
    }
  };
  
  const langKey = ['ko', 'ja', 'en'].includes(lang) ? lang : 'ko';
  return templates[type][langKey];
}

// 경기 관련 알림 전송 (중복 방지 + 다국어 지원)
interface MatchNotificationData {
  homeTeam: TeamNames;
  awayTeam: TeamNames;
  scoringTeam?: TeamNames;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
  time?: string;
}

async function sendMatchNotification(
  homeTeamId: number,
  awayTeamId: number,
  type: NotificationType,
  messageData: MatchNotificationData,
  url: string
) {
  console.log(`[PUSH] Preparing ${type} notification for teams ${homeTeamId} vs ${awayTeamId}`);

  try {
    // 1. 홈팀 또는 어웨이팀을 구독한 유저 조회
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, preferred_language')
      .or(`favorite_team_ids.cs.{${homeTeamId}},favorite_team_ids.cs.{${awayTeamId}}`);

    if (profileError) {
      console.error(`[PUSH] Error fetching profiles:`, profileError);
      return;
    }
    if (!profiles || profiles.length === 0) {
      console.log(`[PUSH] No subscribers for teams ${homeTeamId} or ${awayTeamId}`);
      return;
    }

    // 중복 제거된 유저 목록
    const uniqueUsers = new Map<string, string>();
    profiles.forEach(p => {
      if (!uniqueUsers.has(p.id)) {
        uniqueUsers.set(p.id, p.preferred_language || 'ko');
      }
    });
    // console.log(`[PUSH] Found ${uniqueUsers.size} unique subscribers`);

    // 2. 각 유저의 토큰 조회
    const userIds = Array.from(uniqueUsers.keys());
    const { data: tokens, error: tokenError } = await supabase
      .from('notification_tokens')
      .select('user_id, token')
      .in('user_id', userIds);

    if (tokenError) {
      console.error(`[PUSH] Error fetching tokens:`, tokenError);
      return;
    }
    if (!tokens || tokens.length === 0) {
      console.log(`[PUSH] No active tokens found`);
      return;
    }

    console.log(`[PUSH] Sending to ${tokens.length} devices...`);

    // 3. 알림 전송
    const notifications = tokens.map(t => {
      const lang = uniqueUsers.get(t.user_id) || 'ko';
      const langKey = lang as 'ko' | 'ja' | 'en';
      
      const { title, body } = getNotificationMessage(type, lang, {
        homeTeam: messageData.homeTeam[langKey] || messageData.homeTeam.ko,
        awayTeam: messageData.awayTeam[langKey] || messageData.awayTeam.ko,
        scoringTeam: messageData.scoringTeam?.[langKey] || messageData.scoringTeam?.ko,
        homeScore: messageData.homeScore,
        awayScore: messageData.awayScore,
        venue: messageData.venue,
        time: messageData.time
      });
      
      let subscription = t.token;
      if (typeof subscription === 'string') {
        try {
          subscription = JSON.parse(subscription);
        } catch {
          return Promise.reject({ message: "Invalid JSON token" });
        }
      }
      return webpush.sendNotification(subscription, JSON.stringify({ title, body, url }), {
        urgency: 'high',
        TTL: 60 * 60, // 1시간 (경기 알림은 시의성 중요)
      });
    });

    const results = await Promise.allSettled(notifications);
    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failCount = results.filter((r) => r.status === 'rejected').length;

    console.log(`[PUSH] Result: ✅ Success: ${successCount}, ❌ Failed: ${failCount}`);

  } catch (err) {
    console.error(`[PUSH] Critical Error:`, err);
  }
}

serve(async (req) => {
  try {
    console.log("--- Starting Live Polling ---");

    const now = new Date();

    // ============================================================
    // 🕐 30분 전 경기 리마인더 알림
    // ============================================================
    const thirtyMinLater = new Date(now.getTime() + 30 * 60 * 1000);
    const twentyMinLater = new Date(now.getTime() + 20 * 60 * 1000);

    const { data: upcomingGames, error: upcomingError } = await supabase
      .from("alih_schedule")
      .select("*")
      .gte("match_at", twentyMinLater.toISOString())
      .lte("match_at", thirtyMinLater.toISOString());

    if (upcomingError) {
      console.error("[REMINDER] Error fetching upcoming games:", upcomingError);
    } else if (upcomingGames && upcomingGames.length > 0) {
      console.log(`[REMINDER] Found ${upcomingGames.length} games starting in ~30 min`);
      
      for (const upcomingGame of upcomingGames) {
        if (upcomingGame.reminder_sent) {
          console.log(`[REMINDER] Already sent for game ${upcomingGame.game_no}, skipping`);
          continue;
        }

        const homeTeamNames = await getTeamNames(upcomingGame.home_alih_team_id);
        const awayTeamNames = await getTeamNames(upcomingGame.away_alih_team_id);

        if (homeTeamNames && awayTeamNames) {
          const matchTime = new Date(upcomingGame.match_at);
          const timeStr = matchTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' });

          await sendMatchNotification(
            upcomingGame.home_alih_team_id,
            upcomingGame.away_alih_team_id,
            'reminder',
            {
              homeTeam: homeTeamNames,
              awayTeam: awayTeamNames,
              venue: upcomingGame.match_place,
              time: timeStr
            },
            `/schedule/${upcomingGame.game_no}`
          );

          // reminder_sent 플래그 업데이트
          // [Fix] live_data를 건드리지 않고 별도 컬럼만 업데이트하여 데이터 오염 방지
          const { error: updateError } = await supabase
            .from("alih_schedule")
            .update({ 
               reminder_sent: true,
               reminder_sent_at: new Date().toISOString()
            })
            .eq("id", upcomingGame.id);

          if (updateError) {
            console.error(`[REMINDER] ❌ Failed to update reminder_sent flag:`, updateError);
          } else {
            console.log(`[REMINDER] ✅ Sent and flagged (new column) for game ${upcomingGame.game_no}`);
          }
        }
      }
    }
    
    // ============================================================
    // 🔴 실시간 경기 업데이트 (Live Polling)
    // ============================================================
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
      const isFinished = status.includes("finish") || status.includes("final") || status.includes("試合終了");
      
      // 경기 시작 시간이 아직 안 된 경기는 제외 (리마인더 대상과의 충돌 방지)
      const matchStart = new Date(game.match_at);
      const isNotStartedYet = matchStart > now;
      
      return !isFinished && !isNotStartedYet;
    });

    if (ongoingGames.length === 0) {
      console.log("[INFO] No ongoing games found.");
      return new Response(JSON.stringify({ message: "No ongoing games." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[INFO] Found ${ongoingGames.length} active games.`);

    const results = [];

    // [중요 수정] 개별 게임 에러 격리를 위한 루프 구조 변경
    for (const game of ongoingGames) {
      try {
        const targetUrlId = (game.game_no ?? 0) + 20388;
        const targetUrl = `https://asiaicehockey.com/score/${targetUrlId}`;
        
        console.log(`[GAME ${game.game_no}] Fetching URL: ${targetUrl}`);

        const response = await fetch(targetUrl);
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        
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
        
        const isGameEndStatus = gameStatus.toLowerCase().includes("game finished") || gameStatus.includes("試合終了");
        if (isGameEndStatus) {
          gameStatus = "Game Finished"; 
        }

        // --- [NOTIFICATION LOGIC] ---
        const oldStatus = game.game_status ?? "";
        const oldHomeScore = game.home_alih_team_score ?? 0;
        const oldAwayScore = game.away_alih_team_score ?? 0;

        const isLiveActive = !isGameEndStatus && (
            gameStatus === "Live" || 
            gameStatus.includes("Period") || 
            gameStatus.includes("OVT") || 
            gameStatus.includes("PSS") ||
            gameStatus.includes("GWS")
        );

        const wasNotLive = !oldStatus.includes("Live") && !oldStatus.includes("Period") && !oldStatus.includes("OVT");
        const isGameStart = wasNotLive && isLiveActive;
        const isGameEnd = (!oldStatus.includes("Finish") && isGameEndStatus);

        // 1. 경기 시작 알림
        if (isGameStart) {
          console.log(`[EVENT] Game Start Detected: Game ${game.game_no}`);
          const homeTeamNames = await getTeamNames(game.home_alih_team_id);
          const awayTeamNames = await getTeamNames(game.away_alih_team_id);
          
          if (homeTeamNames && awayTeamNames) {
            await sendMatchNotification(
              game.home_alih_team_id,
              game.away_alih_team_id,
              'game_start',
              { homeTeam: homeTeamNames, awayTeam: awayTeamNames, venue: game.match_place },
              `/schedule/${game.game_no}`
            );
          }
        }

        // 2. 득점 알림
        if (isLiveActive || isGameEnd) { 
          if (homeScoreTotal > oldHomeScore || awayScoreTotal > oldAwayScore) {
            const homeTeamNames = await getTeamNames(game.home_alih_team_id);
            const awayTeamNames = await getTeamNames(game.away_alih_team_id);
            const scoringTeamNames = homeScoreTotal > oldHomeScore ? homeTeamNames : awayTeamNames;
            
            console.log(`[EVENT] Goal Detected: Game ${game.game_no}`);
            
            if (homeTeamNames && awayTeamNames && scoringTeamNames) {
              await sendMatchNotification(
                game.home_alih_team_id,
                game.away_alih_team_id,
                'goal',
                {
                  homeTeam: homeTeamNames,
                  awayTeam: awayTeamNames,
                  scoringTeam: scoringTeamNames,
                  homeScore: homeScoreTotal,
                  awayScore: awayScoreTotal
                },
                `/schedule/${game.game_no}`
              );
            }
          }
        }

        // 3. 경기 종료 알림
        if (isGameEnd) {
          console.log(`[EVENT] Game Finished Detected: Game ${game.game_no}`);
          const homeTeamNames = await getTeamNames(game.home_alih_team_id);
          const awayTeamNames = await getTeamNames(game.away_alih_team_id);
          
          if (homeTeamNames && awayTeamNames) {
            await sendMatchNotification(
              game.home_alih_team_id,
              game.away_alih_team_id,
              'game_end',
              {
                homeTeam: homeTeamNames,
                awayTeam: awayTeamNames,
                homeScore: homeScoreTotal,
                awayScore: awayScoreTotal
              },
              `/schedule/${game.game_no}`
            );
          }
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
        // [중요 수정] 기존 live_data (reminder_sent 등) 보존하며 업데이트
        const updatedLiveData = {
          ...(game.live_data || {}), // 기존 데이터 유지 (리마인더 플래그 보존)
          updated_at_source: gameStatus,
          end_regulation_detected_at: endRegulationDetectedAt, 
          scores_by_period: periodScores,
          events: events,
          shots: shotsData,
          polled_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from("alih_schedule")
          .update({
            home_alih_team_score: homeScoreTotal,
            away_alih_team_score: awayScoreTotal,
            game_status: gameStatus, 
            live_data: updatedLiveData
          })
          .eq("id", game.id);

        if (updateError) {
          console.error(`[DB] Error updating game ${game.id}:`, updateError);
        } else {
          console.log(`[DB] Updated Game ${game.id} Successfully.`);
          results.push({ id: game.id, status: "Updated", score: `${homeScoreTotal}-${awayScoreTotal} (${gameStatus})` });
        }
      } catch (gameErr) {
        // [중요] 한 게임에서 에러가 나도 다른 게임은 계속 진행
        console.error(`[ERROR] Failed to process game ${game.game_no}:`, gameErr);
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