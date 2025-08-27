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
  Calendar, 
  Search, 
  MoreHorizontal, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Download,
  Video,
  Mail
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Interview {
  interview_id: string;
  candidate_name: string;
  candidate_email: string;
  interviewer_name: string | null;
  interviewer_email: string;
  scheduled_time: string;
  status: string;
  created_at: string;
  target_role: string | null;
  experience: string | null;
}

const InterviewManagement = () => {
  const { permissions, isSuper } = useAdmin();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      console.log('Fetching interviews...');
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_all_interviews_admin');
      
      if (error) {
        console.error('Error fetching interviews:', error);
        toast({
          title: "Error loading interviews",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setInterviews(data || []);
      console.log('Interviews loaded:', data?.length);
    } catch (error: any) {
      console.error('Failed to fetch interviews:', error);
      toast({
        title: "Error",
        description: "Failed to load interviews",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string) => {
    return isSuper || permissions.includes(permission);
  };

  const handleUpdateInterviewStatus = async (interviewId: string, newStatus: string) => {
    if (!hasPermission('manage_interviews')) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to manage interviews",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('admin_update_interview_status', {
        interview_id: interviewId,
        new_status: newStatus,
        admin_notes: `Status changed to ${newStatus} by admin`
      });

      if (error) throw error;

      toast({
        title: "Interview updated",
        description: `Interview status changed to ${newStatus}`,
      });

      // Refresh interviews list
      fetchInterviews();
    } catch (error: any) {
      console.error('Error updating interview:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update interview",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-600';
      case 'completed':
        return 'bg-green-600';
      case 'cancelled':
        return 'bg-red-600';
      default:
        return 'bg-yellow-600';
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = !searchTerm || 
      interview.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.candidate_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.interviewer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.target_role?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;
    
    let matchesTime = true;
    if (timeFilter !== 'all') {
      const interviewDate = new Date(interview.scheduled_time);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (timeFilter) {
        case 'today':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          matchesTime = interviewDate >= today && interviewDate < tomorrow;
          break;
        case 'week':
          const weekFromNow = new Date(today);
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          matchesTime = interviewDate >= today && interviewDate < weekFromNow;
          break;
        case 'month':
          const monthFromNow = new Date(today);
          monthFromNow.setMonth(monthFromNow.getMonth() + 1);
          matchesTime = interviewDate >= today && interviewDate < monthFromNow;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesTime;
  });

  const exportInterviews = () => {
    const csvContent = [
      ['Candidate', 'Email', 'Interviewer', 'Scheduled Time', 'Status', 'Target Role', 'Experience'],
      ...filteredInterviews.map(interview => [
        interview.candidate_name,
        interview.candidate_email,
        interview.interviewer_name || interview.interviewer_email,
        format(new Date(interview.scheduled_time), 'yyyy-MM-dd HH:mm'),
        interview.status,
        interview.target_role || '',
        interview.experience || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interviews-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-white">Interview Management</CardTitle>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={exportInterviews}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInterviews}
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
              placeholder="Search by candidate, interviewer, or role..."
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
                  Status: {statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem onClick={() => setStatusFilter('all')} className="text-slate-300">
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('scheduled')} className="text-slate-300">
                  Scheduled
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('completed')} className="text-slate-300">
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('cancelled')} className="text-slate-300">
                  Cancelled
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                  <Filter className="w-4 h-4 mr-2" />
                  Time: {timeFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem onClick={() => setTimeFilter('all')} className="text-slate-300">
                  All Time
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter('today')} className="text-slate-300">
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter('week')} className="text-slate-300">
                  This Week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter('month')} className="text-slate-300">
                  This Month
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-white">{filteredInterviews.length}</div>
            <div className="text-xs text-slate-400">Total Interviews</div>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">
              {filteredInterviews.filter(i => i.status === 'scheduled').length}
            </div>
            <div className="text-xs text-slate-400">Scheduled</div>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-400">
              {filteredInterviews.filter(i => i.status === 'completed').length}
            </div>
            <div className="text-xs text-slate-400">Completed</div>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-400">
              {filteredInterviews.filter(i => i.status === 'cancelled').length}
            </div>
            <div className="text-xs text-slate-400">Cancelled</div>
          </div>
        </div>

        {/* Interviews Table */}
        <div className="border border-slate-700 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-700/50">
                <TableHead className="text-slate-300">Interview Details</TableHead>
                <TableHead className="text-slate-300">Participants</TableHead>
                <TableHead className="text-slate-300">Scheduled Time</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                    Loading interviews...
                  </TableCell>
                </TableRow>
              ) : filteredInterviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                    No interviews found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredInterviews.map((interview) => (
                  <TableRow key={interview.interview_id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell>
                      <div>
                        <div className="font-medium text-white">
                          {interview.target_role || 'Interview Session'}
                        </div>
                        <div className="text-sm text-slate-400">
                          {interview.experience && `${interview.experience} experience`}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          ID: {interview.interview_id.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>
                          <div className="text-sm font-medium text-white">Candidate:</div>
                          <div className="text-sm text-slate-300">{interview.candidate_name}</div>
                          <div className="text-xs text-slate-400">{interview.candidate_email}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Interviewer:</div>
                          <div className="text-sm text-slate-300">
                            {interview.interviewer_name || 'No name'}
                          </div>
                          <div className="text-xs text-slate-400">{interview.interviewer_email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-white font-medium">
                          {format(new Date(interview.scheduled_time), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-slate-400">
                          {format(new Date(interview.scheduled_time), 'HH:mm')}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Created: {format(new Date(interview.created_at), 'MMM dd')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(interview.status)}
                        <Badge className={getStatusColor(interview.status)}>
                          {interview.status}
                        </Badge>
                      </div>
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
                            onClick={() => window.open(`mailto:${interview.candidate_email}`)}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Email Candidate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-slate-300 hover:bg-slate-700"
                            onClick={() => window.open(`mailto:${interview.interviewer_email}`)}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Email Interviewer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          {hasPermission('manage_interviews') && interview.status === 'scheduled' && (
                            <>
                              <DropdownMenuItem 
                                className="text-slate-300 hover:bg-slate-700"
                                onClick={() => handleUpdateInterviewStatus(interview.interview_id, 'completed')}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-slate-300 hover:bg-slate-700"
                                onClick={() => handleUpdateInterviewStatus(interview.interview_id, 'cancelled')}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel Interview
                              </DropdownMenuItem>
                            </>
                          )}
                          {hasPermission('manage_interviews') && interview.status === 'cancelled' && (
                            <DropdownMenuItem 
                              className="text-slate-300 hover:bg-slate-700"
                              onClick={() => handleUpdateInterviewStatus(interview.interview_id, 'scheduled')}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Reschedule
                            </DropdownMenuItem>
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
          Showing {filteredInterviews.length} of {interviews.length} interviews
        </div>
      </CardContent>
    </Card>
  );
};

export default InterviewManagement;
