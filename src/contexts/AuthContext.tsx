import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://lessonlift.co.uk';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isEmailVerified: boolean;
  signUp: (
    email: string,
    password: string,
    name: string,
    plan: 'starter' | 'standard' | 'pro'
  ) => Promise<{ user: User | null; error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resendVerificationEmail: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isEmailVerified = !!user?.email_confirmed_at;

  const signUp = async (
    email: string,
    password: string,
    name: string,
    plan: 'starter' | 'standard' | 'pro'
  ) => {
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${SITE_URL}/dashboard`,
      },
    });

    if (authError) return { user: null, error: authError };

    const user = data.user;
    if (!user) return { user: null, error: new Error('User not created') };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: user.id, name, plan, subscription_status: 'inactive', lessons_remaining: 3 }]);

    if (profileError) return { user: null, error: profileError };

    return { user, error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resendVerificationEmail = async () => {
    if (!user?.email) return { error: new Error('No user email found') };
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: { emailRedirectTo: `${SITE_URL}/dashboard` },
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isEmailVerified,
      signUp,
      signIn,
      signOut,
      resendVerificationEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
