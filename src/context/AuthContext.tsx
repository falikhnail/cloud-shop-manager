import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithUsername: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserWithRole(userId: string): Promise<User | null> {
  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) return null;

  // Get role from user_roles
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  const role: UserRole = (roleData?.role as UserRole) || 'kasir';

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer Supabase calls to avoid deadlock
          setTimeout(async () => {
            const u = await fetchUserWithRole(session.user.id);
            setUser(u);
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        const u = await fetchUserWithRole(session.user.id);
        setUser(u);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const loginWithUsername = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const identifier = username.trim();

    if (!identifier) {
      return { success: false, error: 'Username atau email diperlukan' };
    }

    // Allow email login
    if (identifier.includes('@')) {
      const { error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });

      if (error) {
        return { success: false, error: 'Email atau password salah' };
      }

      return { success: true };
    }

    // Lookup email via RPC (security definer, no RLS exposure)
    const { data: email, error: lookupError } = await supabase.rpc('get_email_for_username', {
      _username: identifier,
    });

    if (lookupError || !email) {
      return { success: false, error: 'Username tidak ditemukan' };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: 'Password salah' };
    }

    return { success: true };
  };

  const signup = async (
    email: string, 
    password: string, 
    name: string, 
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          name,
          role, // Note: default role is set in DB trigger, role metadata is ignored for security
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      login,
      loginWithUsername,
      signup,
      logout, 
      isAuthenticated: !!user,
      isLoading 
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
