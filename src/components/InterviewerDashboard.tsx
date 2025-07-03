
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Edit, CalendarX, Settings, User, Video, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ScheduleEditor from './ScheduleEditor';
import DateBlocker from './DateBlocker';
import ProfileSettings from './ProfileSettings';
import TimeSlotManager from './TimeSlotManager';

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
}

const InterviewerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'schedule' | 'block-dates' | 'profile' | 'time-slots'>('dashboard');

  useEffect(() => {
    fetchInterviews();
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
        setInterviews(interviewsData || []);
      }
    } catch (error) {
      console.error('Error in fetchInterviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
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

  const upcomingInterviews = interviews.filter(interview => {
    const scheduledTime = new Date(interview.scheduled_time);
    return scheduledTime > new Date() && interview.status === 'scheduled';
  });

  const pastInterviews = interviews.filter(interview => {
    const scheduledTime = new Date(interview.scheduled_time);
    return scheduledTime <= new Date() || interview.status === 'completed';
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
    return <DateBlocker onClose={() => setActiveView('dashboard')} />;
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <h3 className="text-white font-semibold">{interview.candidate_name}</h3>
                    <p className="text-slate-300">
                      {formatDateTime(interview.scheduled_time)} • {interview.target_role}
                    </p>
                    <p className="text-slate-400 text-sm">
                      Experience: {interview.experience} • {interview.candidate_email}
                    </p>
                    {interview.google_meet_link && (
                      <p className="text-green-400 text-sm flex items-center mt-1">
                        <Video className="w-3 h-3 mr-1" />
                        Google Meet ready
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
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
                    <h3 className="text-white font-semibold">{interview.candidate_name}</h3>
                    <p className="text-slate-300">
                      {formatDateTime(interview.scheduled_time)} • {interview.target_role}
                    </p>
                    <p className="text-slate-400 text-sm">
                      Experience: {interview.experience} • {interview.candidate_email}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewerDashboard;
