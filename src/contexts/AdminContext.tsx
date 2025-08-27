import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AdminContextType {
  user: User | null;
  permissions: string[];
  isSuper: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSuper, setIsSuper] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Admin auth state change:', event);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            // Verify admin role and get permissions
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();

            if (profile?.role === 'admin') {
              const { data: adminData } = await supabase
                .from('admins')
                .select('permissions, is_super_admin')
                .eq('user_id', session.user.id)
                .single();

              setPermissions(adminData?.permissions || []);
              setIsSuper(adminData?.is_super_admin || false);
              console.log('Admin permissions loaded:', adminData?.permissions);
            } else {
              console.log('User is not an admin, signing out');
              // Not an admin, sign out
              await supabase.auth.signOut();
              setUser(null);
              setPermissions([]);
              setIsSuper(false);
            }
          } catch (error) {
            console.error('Error checking admin status:', error);
            await supabase.auth.signOut();
            setUser(null);
            setPermissions([]);
            setIsSuper(false);
          }
        } else {
          setPermissions([]);
          setIsSuper(false);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Trigger the auth state change handler
        console.log('Existing admin session found');
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setPermissions([]);
      setIsSuper(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const hasPermission = (permission: string) => {
    return permissions.includes(permission) || isSuper;
  };

  return (
    <AdminContext.Provider value={{
      user,
      permissions,
      isSuper,
      loading,
      signOut
    }}>
      {children}
    </AdminContext.Provider>
  );
};
