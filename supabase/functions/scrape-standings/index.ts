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
    console.log('Fetching standings data from alhockey.com...');
    
    const response = await fetch('https://www.alhockey.com/popup/47/standings.html');
    const html = await response.text();
    
    const standings: Standing[] = [];
    
    // Team name translation map
    const teamMap: Record<string, string> = {
      'RED EAGLES HOKKAIDO': '레드 이글스',
      'HL ANYANG ICE HOCKEY CLUB': 'HL 안양',
      'TOHOKU FREEBLADES': '프리블레이즈',
      'NIKKO ICEBUCKS': '아이스벅스',
      'YOKOHAMA GRITS': '요코하마 그리츠',
      'STARS KOBE': '스타즈 고베',
    };
    
    // Extract the standings table
    const tableMatch = html.match(/<table[^>]*>[\s\S]*?<tr bgcolor="#CCCCCC">[\s\S]*?<\/table>/);
    if (!tableMatch) {
      throw new Error('Could not find standings table');
    }
    
    const tableHtml = tableMatch[0];
    const rows = tableHtml.match(/<tr>[\s\S]*?<\/tr>/g) || [];
    
    for (const row of rows) {
      const cells = row.match(/<td[^>]*>(.*?)<\/td>/g) || [];
      if (cells.length >= 11) {
        const cellValues = cells.map(cell => cell.replace(/<[^>]*>/g, '').trim());
        
        const teamName = cellValues[1];
        const translatedTeam = teamMap[teamName] || teamName;
        
        const gfGaMatch = cellValues[9].match(/(\d+)\s*-\s*(\d+)/);
        
        standings.push({
          rank: parseInt(cellValues[0]),
          team: translatedTeam,
          gp: parseInt(cellValues[2]),
          pts: parseInt(cellValues[10]),
          w: parseInt(cellValues[3]),
          l: parseInt(cellValues[8]),
          otw: parseInt(cellValues[4]) + parseInt(cellValues[5]), // Win OT + Win PSS
          otl: parseInt(cellValues[6]) + parseInt(cellValues[7]), // Lose PSS + Lose OT
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
