import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminProvider } from '@/contexts/AdminContext';
import { Loader2, Shield } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
}

const AdminProtectedRoute = ({ children, requiredPermissions = [] }: AdminProtectedRouteProps) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      console.log('Checking admin access...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      console.log('Session found, checking profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile check error:', profileError);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const isAdminUser = profile?.role === 'admin';
      setIsAdmin(isAdminUser);

      if (isAdminUser && requiredPermissions.length > 0) {
        console.log('Checking admin permissions...');
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('permissions, is_super_admin')
          .eq('user_id', session.user.id)
          .single();

        if (adminError || !adminData) {
          console.error('Admin data check error:', adminError);
          setHasPermissions(false);
        } else {
          const userPermissions = adminData.permissions || [];
          const isSuperAdmin = adminData.is_super_admin;
          
          // Super admin has all permissions
          if (isSuperAdmin) {
            setHasPermissions(true);
          } else {
            // Check if user has all required permissions
            const hasAllPermissions = requiredPermissions.every(
              permission => userPermissions.includes(permission)
            );
            setHasPermissions(hasAllPermissions);
          }
        }
      } else {
        setHasPermissions(true); // No specific permissions required
      }

    } catch (error) {
      console.error('Admin access check error:', error);
      setIsAdmin(false);
      setHasPermissions(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-red-500 mr-2" />
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <h2 className="text-xl text-white mb-2">Verifying Admin Access</h2>
          <p className="text-slate-400">Checking credentials and permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    console.log('User is not admin, redirecting to login');
    return <Navigate to="/admin/auth" replace />;
  }

  if (requiredPermissions.length > 0 && !hasPermissions) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-4">
            You don't have the required permissions to access this section.
          </p>
          <p className="text-sm text-slate-500">
            Required permissions: {requiredPermissions.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminProvider>
      {children}
    </AdminProvider>
  );
};

export default AdminProtectedRoute;
