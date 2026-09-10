import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { corsHeaders, requireAdmin } from '../_shared/auth.ts';

serve(async (req: Request) => {
  const headers = corsHeaders(req);
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }
    await requireAdmin(req);
    const { commentId } = await req.json();

    if (!commentId) {
      throw new Error('Missing commentId');
    }

    // Supabase 클라이언트 생성 (service role - RLS 우회)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Soft delete 수행
    const { data, error } = await supabaseAdmin
      .from('alih_comments')
      .update({ is_deleted: true })
      .eq('id', commentId)
      .select()
      .single();

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Comment deleted',
        deletedId: commentId 
      }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: error instanceof Error && error.message === 'Unauthorized' ? 401 : error instanceof Error && error.message === 'Forbidden' ? 403 : 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      }
    );
  }
});
