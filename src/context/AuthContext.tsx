import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { externalSupabase } from '@/lib/supabase-external';
import { useTranslation } from 'react-i18next';

export interface Profile {
  id: string;
  email: string | null;
  nickname: string | null;
  avatar_url: string | null;
  preferred_language: string | null;
  favorite_team_ids: number[] | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithKakao: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  isOnboardingCompleted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { i18n } = useTranslation();

  useEffect(() => {
    // Session 초기화
    externalSupabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = externalSupabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (currentUser: User) => {
    try {
      const { data, error } = await externalSupabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: no rows returned
        console.error('Error fetching profile:', error);
      }

      if (data) {
        setProfile(data);
        // 사용자 선호 언어로 변경
        if (data.preferred_language && data.preferred_language !== i18n.language) {
          i18n.changeLanguage(data.preferred_language);
        }
      } else {
        // 프로필이 없으면 생성 (기본값)
        // Note: DB Trigger should handle this, but as a fallback/client-side fix:
        const userId = currentUser.id;
        const newProfile: Profile = {
          id: userId,
          email: currentUser.email ?? null,
          nickname: currentUser.user_metadata?.full_name ?? currentUser.user_metadata?.name ?? currentUser.email?.split('@')[0] ?? 'User',
          avatar_url: currentUser.user_metadata?.avatar_url ?? null,
          preferred_language: i18n.language,
          favorite_team_ids: [],
        };
        
        // Insert new profile
        const { error: insertError } = await externalSupabase
          .from('profiles')
          .insert(newProfile);
          
        if (!insertError) {
          setProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    await externalSupabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
  };

  const signInWithKakao = async () => {
    await externalSupabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'login',
        },
      },
    });
  };

  const logout = async () => {
    await externalSupabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { error } = await externalSupabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, ...updates } : null);
      
      if (updates.preferred_language) {
        i18n.changeLanguage(updates.preferred_language);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const isOnboardingCompleted = !!(profile?.favorite_team_ids && profile.favorite_team_ids.length > 0);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        signInWithGoogle,
        signInWithKakao,
        logout,
        updateProfile,
        isOnboardingCompleted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
