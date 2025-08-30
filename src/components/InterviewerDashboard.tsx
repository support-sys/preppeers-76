
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, CalendarX, Settings, User, Video, ExternalLink, FileText, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ScheduleEditor from './ScheduleEditor';
import DateBlocker from './DateBlocker';
import ProfileSettings from './ProfileSettings';
import TimeSlotManager from './TimeSlotManager';
import InterviewDetailsDialog from './InterviewDetailsDialog';
import { formatDateTimeIST } from '@/utils/dateUtils';

// Helper function to format plan name
const formatPlanName = (plan: string): string => {
  if (!plan) return 'Standard';
  return plan.charAt(0).toUpperCase() + plan.slice(1);
};

// Helper function to format duration
const formatDuration = (duration: number): string => {
  if (!duration) return '60 Minutes';
  return `${duration} Minutes`;
};

// Helper function to format experience
const formatExperience = (experience: string): string => {
  if (experience === '0' || experience === '0 years' || experience === '0 year') {
    return 'Fresher';
  }
  return `${experience} experience`;
};

// Helper function to format time range
const formatTimeRange = (scheduledTime: string, duration: number = 60): string => {
  try {
    const startTime = new Date(scheduledTime);
    const endTime = new Date(startTime.getTime() + duration * 60000); // Add duration in milliseconds
    
    const startTimeStr = formatDateTimeIST(scheduledTime);
    const endTimeFormatted = formatDateTimeIST(endTime.toISOString());
    const endTimeStr = endTimeFormatted.split(', ').pop() || '6:30 pm'; // Extract just the time part
    
    return `${startTimeStr} • ${endTimeStr}`;
  } catch (error) {
    console.error('Error formatting time range:', error);
    return formatDateTimeIST(scheduledTime);
  }
};

interface Interview {
  id: string;
  candidate_name: string;
  candidate_email: string;
  target_role: string;
  experience: string;
  scheduled_time: string;
  status: string;
  resume_url?: string;
  google_meet_link?: string;
  google_calendar_event_id?: string;
  selected_plan?: string;
  interview_duration?: number;
  plan_details?: any;
}

const InterviewerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'schedule' | 'block-dates' | 'profile' | 'time-slots'>('dashboard');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [blockedDatesCount, setBlockedDatesCount] = useState(0);

  useEffect(() => {
    fetchInterviews();
    fetchBlockedDatesCount();
  }, []);

  const fetchInterviews = async () => {
    if (!user) return;

    try {
      // First get the interviewer record to get the interviewer_id
      const { data: interviewerData, error: interviewerError } = await supabase
        .from('interviewers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (interviewerError) {
        console.error('Error fetching interviewer data:', interviewerError);
        setLoading(false);
        return;
      }

      // Then fetch interviews for this interviewer
      const { data: interviewsData, error: interviewsError } = await supabase
        .from('interviews')
        .select('*')
        .eq('interviewer_id', interviewerData.id)
        .order('scheduled_time', { ascending: true });

      if (interviewsError) {
        console.error('Error fetching interviews:', interviewsError);
      } else {
        // Remove duplicates and filter out rescheduled interviews
        const uniqueInterviews = interviewsData?.filter((interview, index, self) => 
          index === self.findIndex(i => i.id === interview.id) && 
          interview.status !== 'rescheduled'
        ) || [];
        setInterviews(uniqueInterviews);
      }
    } catch (error) {
      console.error('Error in fetchInterviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedDatesCount = async () => {
    if (!user) return;

    try {
      // First get the interviewer record to get the interviewer_id
      const { data: interviewerData, error: interviewerError } = await supabase
        .from('interviewers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (interviewerError) {
        console.error('Error fetching interviewer data:', interviewerError);
        return;
      }

      // Fetch blocked time blocks for this interviewer
      const { data: timeBlocksData, error: timeBlocksError } = await supabase
        .from('interviewer_time_blocks')
        .select('blocked_date')
        .eq('interviewer_id', interviewerData.id);

      if (timeBlocksError) {
        console.error('Error fetching time blocks:', timeBlocksError);
        return;
      }

      // Count unique blocked dates
      const uniqueDates = new Set(timeBlocksData?.map(block => block.blocked_date) || []);
      setBlockedDatesCount(uniqueDates.size);

    } catch (error) {
      console.error('Error in fetchBlockedDatesCount:', error);
    }
  };

  const handleJoinMeeting = (meetLink: string) => {
    if (meetLink) {
      window.open(meetLink, '_blank');
    } else {
      toast({
        title: "No Meeting Link",
        description: "Google Meet link is not available for this interview.",
        variant: "destructive",
      });
    }
  };

  const handleViewResume = (resumeUrl: string) => {
    if (resumeUrl && resumeUrl !== 'uploaded') {
      window.open(resumeUrl, '_blank');
    } else {
      toast({
        title: "Resume Available",
        description: "Candidate has uploaded a resume but URL is not accessible.",
      });
    }
  };

  const handleDeleteInterview = async (interview: Interview) => {
    if (!confirm('Are you sure you want to cancel this interview?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('interviews')
        .update({ status: 'cancelled' })
        .eq('id', interview.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Interview Cancelled",
        description: "The interview has been cancelled successfully.",
      });

      fetchInterviews(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling interview:', error);
      toast({
        title: "Error",
        description: "Failed to cancel the interview. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowDetailsDialog(true);
  };

  const upcomingInterviews = interviews.filter(interview => {
    const scheduledTime = new Date(interview.scheduled_time);
    return scheduledTime > new Date() && interview.status === 'scheduled';
  });

  const pastInterviews = interviews.filter(interview => {
    const scheduledTime = new Date(interview.scheduled_time);
    return scheduledTime <= new Date() || interview.status === 'completed' || interview.status === 'cancelled';
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Render different views based on activeView
  if (activeView === 'schedule') {
    return <ScheduleEditor onClose={() => setActiveView('dashboard')} />;
  }

  if (activeView === 'block-dates') {
    return <DateBlocker 
      onClose={() => {
        setActiveView('dashboard');
        fetchBlockedDatesCount(); // Refresh blocked dates count when returning
      }}
      onBlockedDatesChange={fetchBlockedDatesCount} // Refresh count when dates change
    />;
  }

  if (activeView === 'profile') {
    return <ProfileSettings onClose={() => setActiveView('dashboard')} />;
  }

  if (activeView === 'time-slots') {
    return <TimeSlotManager onClose={() => setActiveView('dashboard')} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Interviewer Dashboard</h1>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setActiveView('profile')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <User className="w-4 h-4 mr-2" />
            Profile Settings
          </Button>
          <Button 
            onClick={() => setActiveView('time-slots')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Clock className="w-4 h-4 mr-2" />
            Manage Schedule
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setActiveView('block-dates')}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <CalendarX className="w-4 h-4 mr-2" />
            Block Dates
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Upcoming Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{upcomingInterviews.length}</p>
            <p className="text-slate-300">Scheduled</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Total Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{interviews.length}</p>
            <p className="text-slate-300">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Hours This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{interviews.length}</p>
            <p className="text-slate-300">Interview sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <CalendarX className="w-5 h-5 mr-2" />
              Blocked Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{blockedDatesCount}</p>
            <p className="text-slate-300">Total blocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Interviews */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Upcoming Interviews</CardTitle>
          <CardDescription className="text-slate-300">
            Your scheduled interview sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingInterviews.length === 0 ? (
            <p className="text-slate-300">No upcoming interviews scheduled.</p>
          ) : (
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{interview.target_role}</h3>
                    <p className="text-slate-300">
                      {formatTimeRange(interview.scheduled_time, interview.interview_duration || 60)}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {formatExperience(interview.experience)} • {formatPlanName(interview.selected_plan || 'standard')} Plan • {formatDuration(interview.interview_duration || 60)}
                    </p>
                    {interview.google_meet_link && (
                      <p className="text-green-400 text-sm flex items-center mt-1">
                        <Video className="w-3 h-3 mr-1" />
                        Google Meet ready
                      </p>
                    )}
                    {interview.resume_url && (
                      <p className="text-blue-400 text-sm flex items-center mt-1">
                        <FileText className="w-3 h-3 mr-1" />
                        Resume available
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-purple-600/20 border-purple-400/30 text-purple-300 hover:bg-purple-600/30"
                      onClick={() => handleViewDetails(interview)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                    {interview.resume_url && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="bg-blue-600/20 border-blue-400/30 text-blue-300 hover:bg-blue-600/30"
                        onClick={() => handleViewResume(interview.resume_url!)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    {interview.google_meet_link ? (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleJoinMeeting(interview.google_meet_link!)}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Join Meet
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        disabled
                      >
                        <Video className="w-4 h-4 mr-2" />
                        No Link
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-red-600/20 border-red-400/30 text-red-300 hover:bg-red-600/30"
                      onClick={() => handleDeleteInterview(interview)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Interviews */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Past Interviews</CardTitle>
          <CardDescription className="text-slate-300">
            Your completed interview sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pastInterviews.length === 0 ? (
            <p className="text-slate-300">No past interviews found.</p>
          ) : (
            <div className="space-y-4">
              {pastInterviews.map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <h3 className="text-white font-semibold">{interview.target_role}</h3>
                    <p className="text-slate-300">
                      {formatTimeRange(interview.scheduled_time, interview.interview_duration || 60)}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {formatExperience(interview.experience)} • {formatPlanName(interview.selected_plan || 'standard')} Plan • {formatDuration(interview.interview_duration || 60)}
                    </p>
                    <p className="text-slate-400 text-sm capitalize">
                      Status: {interview.status}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-purple-600/20 border-purple-400/30 text-purple-300 hover:bg-purple-600/30"
                      onClick={() => handleViewDetails(interview)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                    {interview.resume_url && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="bg-blue-600/20 border-blue-400/30 text-blue-300 hover:bg-blue-600/30"
                        onClick={() => handleViewResume(interview.resume_url!)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interview Details Dialog */}
      {showDetailsDialog && selectedInterview && (
        <InterviewDetailsDialog
          interview={selectedInterview}
          userRole="interviewer"
          open={showDetailsDialog}
          onClose={() => {
            setShowDetailsDialog(false);
            setSelectedInterview(null);
          }}
        />
      )}
    </div>
  );
};

export default InterviewerDashboard;
