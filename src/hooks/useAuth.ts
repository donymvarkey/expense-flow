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

const initializationInProgress = new Map<string, Promise<void>>();
const initializedUsers = new Set<string>();

function initializeLocalData(userId: string): Promise<void> {
  if (initializedUsers.has(userId)) return Promise.resolve();

  const existing = initializationInProgress.get(userId);
  if (existing) return existing;

  const initialization = (async () => {
    if (!navigator.onLine) return;

    // Supabase is authoritative. Pull first so a new device does not create a
    // second set of defaults for an account that already has categories.
    await syncEngine.hydrateFromSupabase(userId);
    await seedDefaultCategories(userId);
    await syncEngine.resumeForUser(userId);
    await syncEngine.hydrateFromSupabase(userId);
    initializedUsers.add(userId);
  })()
    .catch((error) => {
      // Existing IndexedDB data remains available when the network is flaky.
      console.error('Unable to refresh local data from Supabase:', error);
    })
    .finally(() => {
      initializationInProgress.delete(userId);
    });

  initializationInProgress.set(userId, initialization);
  return initialization;
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
    let active = true;
    let currentUserId: string | null = null;

    const applySession = async (session: Session) => {
      const userId = session.user.id;
      currentUserId = userId;
      await initializeLocalData(userId);
      if (!active || currentUserId !== userId) return;

      setState({
        user: mapUser(session.user),
        session,
        loading: false,
      });
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void applySession(session);
      } else {
        currentUserId = null;
        initializedUsers.clear();
        setState({ user: null, session: null, loading: false });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Run outside the auth callback so Supabase can finish persisting the
        // session before synchronization starts using it.
        window.setTimeout(() => {
          void applySession(session);
        }, 0);
      } else {
        currentUserId = null;
        initializedUsers.clear();
        setState({ user: null, session: null, loading: false });
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
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
