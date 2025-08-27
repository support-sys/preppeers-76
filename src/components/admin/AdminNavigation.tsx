import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, LogOut, Settings, Users, Calendar } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { useNavigate, useLocation } from "react-router-dom";

const AdminNavigation = () => {
  const { user, signOut, isSuper, permissions } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/auth');
  };

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Shield,
      path: '/admin/dashboard',
      permission: null // No specific permission needed
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      path: '/admin/users',
      permission: 'view_users'
    },
    {
      id: 'interviews',
      label: 'Interviews',
      icon: Calendar,
      path: '/admin/interviews',
      permission: 'view_interviews'
    }
  ];

  const hasPermission = (permission: string | null) => {
    if (!permission) return true;
    return isSuper || permissions.includes(permission);
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || 
           (path !== '/admin/dashboard' && location.pathname.startsWith(path));
  };

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                <p className="text-xs text-slate-400">Platform Management</p>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                if (!hasPermission(item.permission)) return null;
                
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => navigate(item.path)}
                    className={`
                      flex items-center space-x-2 transition-colors
                      ${isActive 
                        ? 'bg-slate-700 text-white' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Right side - User info and controls */}
          <div className="flex items-center space-x-4">
            {/* Admin Badge */}
            <div className="flex items-center space-x-2">
              {isSuper && (
                <Badge variant="destructive" className="text-xs">
                  Super Admin
                </Badge>
              )}
              <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                Admin
              </Badge>
            </div>

            {/* User Email */}
            <div className="hidden sm:block text-right">
              <p className="text-sm text-white font-medium">
                {user?.user_metadata?.full_name || 'Admin User'}
              </p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/settings')}
                className="text-slate-300 hover:text-white hover:bg-slate-700"
                disabled={!hasPermission('system_settings')}
              >
                <Settings className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3">
          <div className="flex space-x-1 overflow-x-auto">
            {navigationItems.map((item) => {
              if (!hasPermission(item.permission)) return null;
              
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`
                    flex items-center space-x-2 whitespace-nowrap
                    ${isActive 
                      ? 'bg-slate-700 text-white' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavigation;
