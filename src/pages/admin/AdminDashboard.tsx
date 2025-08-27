import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, CheckCircle, Clock, TrendingUp, Activity } from 'lucide-react';
import AdminNavigation from '@/components/admin/AdminNavigation';
import UserManagement from '@/components/admin/UserManagement';
import InterviewManagement from '@/components/admin/InterviewManagement';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalUsers: number;
  totalInterviews: number;
  todayInterviews: number;
  activeUsersWeek: number;
  completedInterviews: number;
  pendingInterviews: number;
}

const AdminDashboard = () => {
  const { permissions, isSuper } = useAdmin();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalInterviews: 0,
    todayInterviews: 0,
    activeUsersWeek: 0,
    completedInterviews: 0,
    pendingInterviews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      console.log('Fetching dashboard stats...');
      
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
      
      if (error) {
        console.error('Stats fetch error:', error);
        toast({
          title: "Error loading stats",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data && data[0]) {
        const statsData = data[0];
        setStats({
          totalUsers: Number(statsData.total_users) || 0,
          totalInterviews: Number(statsData.total_interviews) || 0,
          todayInterviews: Number(statsData.today_interviews) || 0,
          activeUsersWeek: Number(statsData.active_users_week) || 0,
          completedInterviews: Number(statsData.completed_interviews) || 0,
          pendingInterviews: Number(statsData.pending_interviews) || 0,
        });
        console.log('Stats loaded successfully:', statsData);
      }
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string) => {
    return isSuper || permissions.includes(permission);
  };

  const calculateCompletionRate = () => {
    if (stats.totalInterviews === 0) return 0;
    return Math.round((stats.completedInterviews / stats.totalInterviews) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Platform overview and management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total Users</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : stats.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Interviewers & Candidates
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : stats.totalInterviews.toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                All time sessions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Today's Interviews</CardTitle>
              <Activity className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : stats.todayInterviews}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Scheduled for today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Active Users</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : stats.activeUsersWeek}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                This week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : stats.completedInterviews}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Successful sessions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : stats.pendingInterviews}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Upcoming sessions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400 mb-2">
                {loading ? '...' : `${calculateCompletionRate()}%`}
              </div>
              <p className="text-slate-400 text-sm">
                Interview completion rate
              </p>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateCompletionRate()}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Platform Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Interviews Today</span>
                  <span className="text-white font-medium">{stats.todayInterviews}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">New Users (Week)</span>
                  <span className="text-white font-medium">{stats.activeUsersWeek}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Success Rate</span>
                  <span className="text-green-400 font-medium">{calculateCompletionRate()}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hasPermission('view_users') && (
                  <button className="w-full text-left text-sm text-slate-300 hover:text-white transition-colors p-2 rounded hover:bg-slate-700">
                    → View User Management
                  </button>
                )}
                {hasPermission('view_interviews') && (
                  <button className="w-full text-left text-sm text-slate-300 hover:text-white transition-colors p-2 rounded hover:bg-slate-700">
                    → Interview Management
                  </button>
                )}
                <button className="w-full text-left text-sm text-slate-300 hover:text-white transition-colors p-2 rounded hover:bg-slate-700">
                  → Export Reports
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="text-slate-200">Overview</TabsTrigger>
            {hasPermission('view_users') && (
              <TabsTrigger value="users" className="text-slate-200">User Management</TabsTrigger>
            )}
            {hasPermission('view_interviews') && (
              <TabsTrigger value="interviews" className="text-slate-200">Interview Management</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Platform Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">
                  Welcome to the admin dashboard. Use the tabs above to manage users, interviews, and platform settings.
                  All administrative actions are logged for security and audit purposes.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {hasPermission('view_users') && (
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          )}

          {hasPermission('view_interviews') && (
            <TabsContent value="interviews">
              <InterviewManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
