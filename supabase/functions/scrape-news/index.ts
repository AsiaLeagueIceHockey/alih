import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsItem {
  title: string;
  source: string;
  time: string;
  category: string;
  excerpt: string;
  link: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching news data from asiaicehockey.com...');
    
    const response = await fetch('https://asiaicehockey.com/news');
    const html = await response.text();
    
    const news: NewsItem[] = [];
    
    // Parse HTML to extract news data
    const newsMatches = html.matchAll(/<article.*?>(.*?)<\/article>/gs);
    
    for (const match of newsMatches) {
      const article = match[1];
      
      // Extract title
      const titleMatch = article.match(/<h[23].*?>(.*?)<\/h[23]>/);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : '';
      
      // Extract link
      const linkMatch = article.match(/href="(.*?)"/);
      const link = linkMatch ? linkMatch[1] : '';
      
      // Extract date
      const dateMatch = article.match(/(\d{4}-\d{2}-\d{2})/);
      const time = dateMatch ? dateMatch[1] : '최근';
      
      if (title && link) {
        // Translate category
        let category = '리그';
        if (title.includes('HL') || title.includes('アニャン')) {
          category = '팀 뉴스';
        } else if (title.includes('選手') || title.includes('選手')) {
          category = '선수';
        }
        
        news.push({
          title: title.substring(0, 100), // Truncate long titles
          source: 'ALIH',
          time,
          category,
          excerpt: '',
          link: link.startsWith('http') ? link : `https://asiaicehockey.com${link}`,
        });
      }
      
      if (news.length >= 20) break; // Limit to 20 items
    }
    
    console.log(`Successfully parsed ${news.length} news items`);
    
    return new Response(
      JSON.stringify({ success: true, news }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error scraping news:', error);
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
