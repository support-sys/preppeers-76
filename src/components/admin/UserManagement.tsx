import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  Search, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Mail,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface User {
  user_id: string;
  email: string;
  full_name: string | null;
  role: 'interviewer' | 'interviewee';
  created_at: string;
  last_sign_in: string | null;
  profile_complete: boolean;
}

const UserManagement = () => {
  const { permissions, isSuper } = useAdmin();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'interviewer' | 'interviewee'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'incomplete'>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_all_users_admin');
      
      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error loading users",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setUsers(data || []);
      console.log('Users loaded:', data?.length);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string) => {
    return isSuper || permissions.includes(permission);
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'interviewer' | 'interviewee') => {
    if (!hasPermission('manage_users')) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to manage users",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('admin_update_user_status', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) throw error;

      toast({
        title: "User updated",
        description: `User role changed to ${newRole}`,
      });

      // Refresh users list
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'complete' && user.profile_complete) ||
      (statusFilter === 'incomplete' && !user.profile_complete);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const exportUsers = () => {
    const csvContent = [
      ['Email', 'Name', 'Role', 'Created', 'Last Sign In', 'Profile Complete'],
      ...filteredUsers.map(user => [
        user.email,
        user.full_name || '',
        user.role,
        format(new Date(user.created_at), 'yyyy-MM-dd'),
        user.last_sign_in ? format(new Date(user.last_sign_in), 'yyyy-MM-dd') : 'Never',
        user.profile_complete ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-white">User Management</CardTitle>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={exportUsers}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search users by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                  <Filter className="w-4 h-4 mr-2" />
                  Role: {roleFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem onClick={() => setRoleFilter('all')} className="text-slate-300">
                  All Roles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('interviewer')} className="text-slate-300">
                  Interviewers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('interviewee')} className="text-slate-300">
                  Interviewees
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                  <Filter className="w-4 h-4 mr-2" />
                  Status: {statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem onClick={() => setStatusFilter('all')} className="text-slate-300">
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('complete')} className="text-slate-300">
                  Complete Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('incomplete')} className="text-slate-300">
                  Incomplete Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-white">{filteredUsers.length}</div>
            <div className="text-xs text-slate-400">Total Users</div>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">
              {filteredUsers.filter(u => u.role === 'interviewer').length}
            </div>
            <div className="text-xs text-slate-400">Interviewers</div>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-400">
              {filteredUsers.filter(u => u.role === 'interviewee').length}
            </div>
            <div className="text-xs text-slate-400">Interviewees</div>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">
              {filteredUsers.filter(u => u.profile_complete).length}
            </div>
            <div className="text-xs text-slate-400">Complete Profiles</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="border border-slate-700 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-700/50">
                <TableHead className="text-slate-300">User</TableHead>
                <TableHead className="text-slate-300">Role</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Created</TableHead>
                <TableHead className="text-slate-300">Last Sign In</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                    No users found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.user_id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell>
                      <div>
                        <div className="font-medium text-white">
                          {user.full_name || 'No name'}
                        </div>
                        <div className="text-sm text-slate-400">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.role === 'interviewer' ? 'default' : 'secondary'}
                        className={user.role === 'interviewer' ? 'bg-blue-600' : 'bg-green-600'}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {user.profile_complete ? (
                          <UserCheck className="w-4 h-4 text-green-400" />
                        ) : (
                          <UserX className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className={user.profile_complete ? 'text-green-400' : 'text-yellow-400'}>
                          {user.profile_complete ? 'Complete' : 'Incomplete'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {format(new Date(user.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {user.last_sign_in 
                        ? format(new Date(user.last_sign_in), 'MMM dd, yyyy')
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem 
                            className="text-slate-300 hover:bg-slate-700"
                            onClick={() => window.open(`mailto:${user.email}`)}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          {hasPermission('manage_users') && (
                            <>
                              <DropdownMenuItem 
                                className="text-slate-300 hover:bg-slate-700"
                                onClick={() => handleUpdateUserRole(
                                  user.user_id, 
                                  user.role === 'interviewer' ? 'interviewee' : 'interviewer'
                                )}
                              >
                                Switch to {user.role === 'interviewer' ? 'Interviewee' : 'Interviewer'}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-slate-400">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
