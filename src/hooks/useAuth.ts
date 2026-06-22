import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { seedDefaultCategories } from '@/db';
import { syncEngine } from '@/sync/engine';
import type { User as AppUser } from '@/types';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  const mapUser = (user: User): AppUser => ({
    id: user.id,
    email: user.email || '',
    full_name: user.user_metadata?.['full_name'] as string | undefined,
    avatar_url: user.user_metadata?.['avatar_url'] as string | undefined,
    created_at: user.created_at,
  });

  useEffect(() => {
    const initializeLocalData = async (userId: string) => {
      await seedDefaultCategories(userId);
      if (navigator.onLine) {
        await syncEngine.resumeForUser(userId);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState({
          user: mapUser(session.user),
          session,
          loading: false,
        });
        void initializeLocalData(session.user.id);
      } else {
        setState({ user: null, session: null, loading: false });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState({
          user: mapUser(session.user),
          session,
          loading: false,
        });
        // Run outside the auth callback so Supabase can finish persisting the
        // new session before queued requests start using it.
        window.setTimeout(() => {
          void initializeLocalData(session.user.id);
        }, 0);
      } else {
        setState({ user: null, session: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    signInWithGoogle,
  };
}
