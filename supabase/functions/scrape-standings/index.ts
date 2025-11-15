import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Standing {
  rank: number;
  team: string;
  gp: number;
  pts: number;
  w: number;
  l: number;
  otw: number;
  otl: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching standings data from asiaicehockey.com...');
    
    const response = await fetch('https://asiaicehockey.com/standings');
    const html = await response.text();
    
    const standings: Standing[] = [];
    
    // Team name translation map
    const teamMap: Record<string, string> = {
      'レッドイーグルス北海道': '레드 이글스 홋카이도',
      'HLアニャンアイスホッケークラブ': 'HL 안양',
      '東北フリーブレイズ': '도호쿠 프리블레이즈',
      'H.C.栃木日光アイスバックス': '닛코 아이스벅스',
      '横浜GRITS': '요코하마 그리츠',
      'スターズ神戸': '스타즈 고베',
    };
    
    // Parse HTML to extract standings data
    // This is a simplified parser - adjust based on actual HTML structure
    const tableRows = html.match(/<tr>.*?<\/tr>/gs) || [];
    
    let rank = 1;
    for (const row of tableRows) {
      const cells = row.match(/<td.*?>(.*?)<\/td>/g) || [];
      if (cells.length >= 7 && cells[0]) {
        const teamCellMatch = cells[0].match(/>(.*?)</);
        const teamCell = teamCellMatch ? teamCellMatch[1] : '';
        
        let translatedTeam = teamCell;
        for (const [jp, kr] of Object.entries(teamMap)) {
          if (teamCell.includes(jp)) {
            translatedTeam = kr;
            break;
          }
        }
        
        standings.push({
          rank: rank++,
          team: translatedTeam,
          gp: parseInt(cells[1].match(/\d+/)?.[0] || '0'),
          pts: parseInt(cells[2].match(/\d+/)?.[0] || '0'),
          w: parseInt(cells[3].match(/\d+/)?.[0] || '0'),
          l: parseInt(cells[4].match(/\d+/)?.[0] || '0'),
          otw: parseInt(cells[5].match(/\d+/)?.[0] || '0'),
          otl: parseInt(cells[6].match(/\d+/)?.[0] || '0'),
        });
      }
    }
    
    console.log(`Successfully parsed ${standings.length} teams`);
    
    return new Response(
      JSON.stringify({ success: true, standings }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error scraping standings:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
