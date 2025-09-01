
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'interviewer' | 'interviewee' | null;
  profileComplete: boolean;
  hasScheduledInterview: boolean;
  justLoggedIn: boolean;
  shouldRedirectToBook: boolean;
  clearRedirectFlag: () => void;
  signUp: (email: string, password: string, role: 'interviewer' | 'interviewee', fullName?: string, mobileNumber?: string) => Promise<{ error: any, data?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'interviewer' | 'interviewee' | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [hasScheduledInterview, setHasScheduledInterview] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [shouldRedirectToBook, setShouldRedirectToBook] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email_confirmed_at);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && session.user.email_confirmed_at) {
          // Set just logged in flag for new sessions immediately
          if (event === 'SIGNED_IN') {
            setJustLoggedIn(true);
            // Clear the flag after 3 seconds
            setTimeout(() => setJustLoggedIn(false), 3000);
          }
          
          // Only fetch user role for confirmed users
          (async () => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .maybeSingle();
            
            setUserRole(profile?.role || null);
            
            // Set redirect flag immediately if user is interviewee (don't wait for profile completion check)
            if (event === 'SIGNED_IN' && profile?.role === 'interviewee') {
              setShouldRedirectToBook(true);
            }
            
            // Check profile completion and interview status (this can happen after redirect is set)
            if (profile?.role) {
              checkUserStatus(session.user.id, profile.role); // Remove await to not block redirect
            }
          })();
        } else {
          setUserRole(null);
          setProfileComplete(false);
          setHasScheduledInterview(false);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email_confirmed_at);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, role: 'interviewer' | 'interviewee', fullName?: string, mobileNumber?: string) => {
    // Use the correct domain for email redirects
    const redirectUrl = `${window.location.origin}/auth?confirmed=true`;
    
    console.log('Signing up user with redirect URL:', redirectUrl);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          role: role,
          full_name: fullName,
          mobile_number: mobileNumber
        }
      }
    });

    // Log the signup response for debugging
    console.log('Signup response:', { data, error });
    console.log('User confirmation status:', data?.user?.email_confirmed_at);

    return { error, data };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    // Clear local state immediately to prevent UI issues
    setUser(null);
    setSession(null);
    setUserRole(null);
    setProfileComplete(false);
    setHasScheduledInterview(false);
    setJustLoggedIn(false);
    
    // Attempt to sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    // If there's a session not found error, it's not really an error for the user
    // because they're already signed out effectively
    if (error && error.message.includes('Session not found')) {
      console.log('Session already expired, user signed out locally');
      return { error: null }; // Return success since user is effectively signed out
    }
    
    return { error };
  };

  const checkUserStatus = async (userId: string, role: 'interviewer' | 'interviewee') => {
    try {
      // Check profile completion
      const tableName = role === 'interviewer' ? 'interviewers' : 'interviewees';
      const { data: profileData } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      setProfileComplete(!!profileData);

      // Check for scheduled interviews (for interviewees)
      if (role === 'interviewee') {
        const { data: interviews } = await supabase
          .from('interviews')
          .select('id')
          .eq('candidate_id', userId)
          .eq('status', 'scheduled')
          .limit(1);

        setHasScheduledInterview(!!interviews && interviews.length > 0);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      return { error };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      return { error };
    }
  };

  const clearRedirectFlag = () => {
    setShouldRedirectToBook(false);
  };

  const value = {
    user,
    session,
    userRole,
    profileComplete,
    hasScheduledInterview,
    justLoggedIn,
    shouldRedirectToBook,
    clearRedirectFlag,
    signUp,
    signIn,
    signOut,
    resetPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
