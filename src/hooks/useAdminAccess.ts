import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { externalSupabase } from '@/lib/supabase-external';

export const useAdminAccess = () => {
  const { user, isLoading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ['admin-access', user?.id],
    enabled: !!user && !authLoading,
    queryFn: async () => {
      const { data, error } = await externalSupabase.rpc('is_current_user_admin');
      if (error) throw error;
      return data === true;
    },
    staleTime: 1000 * 60,
    retry: false,
  });

  return {
    isAdmin: query.data === true,
    isLoading: authLoading || (!!user && query.isLoading),
    error: query.error,
  };
};
