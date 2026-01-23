// supabase/functions/get-team-videos/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("[INIT] Batch Video Updater Initialized")

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    // 1. Supabase Admin Client 생성
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 2. 유튜브 채널 ID가 등록된 모든 팀 가져오기
    const { data: teams, error: dbError } = await supabase
      .from('alih_teams')
      .select('id, name, youtube_channel_id')
      .not('youtube_channel_id', 'is', null)

    if (dbError) throw new Error(`DB Error: ${dbError.message}`)
    console.log(`[START] Processing ${teams.length} teams...`)

    // 3. 병렬 처리 (Promise.all) - 각 팀별로 유튜브 API 호출 및 업데이트
    const results = await Promise.all(teams.map(async (team) => {
      try {
        // A. YouTube API 호출
        // (주의: 할당량 문제 없으면 Search API 사용, 아끼려면 Playlist API로 변경 가능)
        const ytUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${team.youtube_channel_id}&part=snippet,id&order=date&maxResults=5&type=video`
        
        const ytRes = await fetch(ytUrl)
        const ytData = await ytRes.json()

        if (!ytData.items) {
           console.error(`[FAIL] Team ${team.name}: No items in YouTube response`)
           return { team: team.name, status: 'failed', reason: 'No items' }
        }

        // B. 데이터 가공
        const processedVideos = ytData.items.map((item: any) => {
          const videoId = item.id.videoId;
          return {
            id: videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium.url,
            publishedAt: item.snippet.publishedAt.split('T')[0],
            videoUrl: `https://www.youtube.com/watch?v=${videoId}`, 
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            description: item.snippet.description
          };
        })

        // C. DB 업데이트
        const { error: updateError } = await supabase
          .from('alih_teams')
          .update({ 
            recent_videos: processedVideos, 
            videos_updated_at: new Date().toISOString() 
          })
          .eq('id', team.id)

        if (updateError) throw updateError

        return { team: team.name, status: 'success', count: processedVideos.length }

      } catch (innerError) {
        console.error(`[ERROR] Team ${team.name}:`, innerError)
        return { team: team.name, status: 'error', error: innerError.message }
      }
    }))

    // 4. 결과 리포트 반환
    const successCount = results.filter(r => r.status === 'success').length
    console.log(`[DONE] Batch finished. Success: ${successCount}/${teams.length}`)

    return new Response(JSON.stringify({ 
      message: "Batch update completed", 
      results 
    }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})