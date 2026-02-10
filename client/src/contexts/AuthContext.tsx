import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, signIn, signUp, signOut } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

interface User {
  id: string;
  email?: string | null;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          const newUser = session?.user ? { id: session.user.id, email: session.user.email } : null;
          previousUserIdRef.current = newUser?.id || null;
          setUser(newUser);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        const newUserId = session?.user?.id || null;
        if (newUserId !== previousUserIdRef.current) {
          queryClient.clear();
        }
        previousUserIdRef.current = newUserId;
        setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    return { error: error as Error | null };
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string) => {
    const { error } = await signUp(email, password);
    return { error: error as Error | null };
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    queryClient.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn: handleSignIn,
      signUp: handleSignUp,
      signOut: handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
