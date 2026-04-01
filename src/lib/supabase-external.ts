import { createClient } from '@supabase/supabase-js';

// 외부 Supabase 프로젝트 싱글톤 클라이언트
// 모든 페이지에서 동일한 인스턴스를 사용하여 연결 오버헤드 감소
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env');
}

export const externalSupabase = createClient(supabaseUrl, supabaseAnonKey);
