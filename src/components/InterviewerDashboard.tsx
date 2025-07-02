
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Edit, CalendarX, Settings, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ScheduleEditor from './ScheduleEditor';
import DateBlocker from './DateBlocker';
import ProfileSettings from './ProfileSettings';
import TimeSlotManager from './TimeSlotManager';

interface Interview {
  id: string;
  date: string;
  time: string;
  candidate: string;
  status: 'upcoming' | 'current' | 'completed';
  duration: number;
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
    try {
      // Mock data for now
      const mockInterviews: Interview[] = [
        {
          id: '1',
          date: '2025-01-08',
          time: '10:00 AM',
          candidate: 'John Doe',
          status: 'upcoming',
          duration: 60
        },
        {
          id: '2',
          date: '2025-01-10',
          time: '2:00 PM',
          candidate: 'Jane Smith',
          status: 'upcoming',
          duration: 45
        },
        {
          id: '3',
          date: '2025-01-05',
          time: '3:00 PM',
          candidate: 'Mike Johnson',
          status: 'completed',
          duration: 60
        }
      ];
      
      setInterviews(mockInterviews);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      setLoading(false);
    }
  };

  const upcomingInterviews = interviews.filter(interview => interview.status === 'upcoming');
  const pastInterviews = interviews.filter(interview => interview.status === 'completed');

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
            <p className="text-slate-300">This week</p>
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
            <p className="text-3xl font-bold text-white">12</p>
            <p className="text-slate-300">Interview hours</p>
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
                  <div>
                    <h3 className="text-white font-semibold">{interview.candidate}</h3>
                    <p className="text-slate-300">
                      {interview.date} at {interview.time} • {interview.duration} minutes
                    </p>
                  </div>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Join
                  </Button>
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
                    <h3 className="text-white font-semibold">{interview.candidate}</h3>
                    <p className="text-slate-300">
                      {interview.date} at {interview.time} • {interview.duration} minutes
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
