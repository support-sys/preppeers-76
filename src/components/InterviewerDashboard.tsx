
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, CalendarX, Settings, User, Video, ExternalLink, FileText, Trash2, Eye, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ScheduleEditor from './ScheduleEditor';
import DateBlocker from './DateBlocker';
import ProfileSettings from './ProfileSettings';
import TimeSlotManager from './TimeSlotManager';
import InterviewDetailsDialog from './InterviewDetailsDialog';
import { formatDateTimeIST } from '@/utils/dateUtils';

interface Interview {
  id: string;
  candidate_name: string;
  candidate_email: string;
  target_role: string;
  experience: string;
  scheduled_time: string;
  status: string;
  feedback_submitted: boolean;
  resume_url?: string;
  google_meet_link?: string;
  google_calendar_event_id?: string;
  specific_skills?: string[];
}

const InterviewerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'schedule' | 'block-dates' | 'profile' | 'time-slots'>('dashboard');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [interviewerProfile, setInterviewerProfile] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    checkEligibilityAndFetchInterviews();
  }, []);

  const checkEligibilityAndFetchInterviews = async () => {
    if (!user) return;

    try {
      // First get the interviewer record to check eligibility
      const { data: interviewerData, error: interviewerError } = await supabase
        .from('interviewers')
        .select('id, is_eligible, position, company')
        .eq('user_id', user.id)
        .single();

      if (interviewerError) {
        console.error('Error fetching interviewer data:', interviewerError);
        setLoading(false);
        return;
      }

      setIsEligible(interviewerData.is_eligible);

      // Get profile data for the interviewer
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (!profileError && profileData) {
        setInterviewerProfile({
          name: profileData.full_name || 'Unknown',
          email: profileData.email || user.email || 'Unknown',
          role: interviewerData.position || 'Software Engineer'
        });
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
        let uniqueInterviews = interviewsData?.filter((interview, index, self) => 
          index === self.findIndex(i => i.id === interview.id) && 
          interview.status !== 'rescheduled'
        ) || [];

        // Auto-update status from 'scheduled' to 'completed' for past interviews
        const now = new Date();
        const interviewsToUpdate = uniqueInterviews.filter(interview => 
          interview.status === 'scheduled' && 
          new Date(interview.scheduled_time) <= now
        );

        if (interviewsToUpdate.length > 0) {
          for (const interview of interviewsToUpdate) {
            await supabase
              .from('interviews')
              .update({ status: 'completed' })
              .eq('id', interview.id);
            
            // Update the local status as well
            interview.status = 'completed';
          }
        }

        setInterviews(uniqueInterviews);
      }
    } catch (error) {
      console.error('Error in checkEligibilityAndFetchInterviews:', error);
    } finally {
      setLoading(false);
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

      checkEligibilityAndFetchInterviews(); // Refresh the list
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

  const handleSubmitFeedback = async (interview: Interview) => {
    if (!interviewerProfile) return;

    // Build the Google Form URL with prefilled data
    const baseUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfqJUiaPDJEO4MdSHR9bS1QUEVjHnKEl07W-tkK148rdhGAog/viewform';
    
    const params = new URLSearchParams({
      'usp': 'pp_url',
      'entry.273813679': interview.candidate_email, // interviewee email
      'entry.2000148292': interview.candidate_name, // interviewee name
      'entry.357973421': interview.target_role, // interviewee role
      'entry.715683291': (interview.specific_skills && interview.specific_skills.length > 0) 
        ? interview.specific_skills.join(', ') 
        : (interview.experience || 'Not specified'), // interviewee skillset from specific_skills, fallback to experience
      'entry.927252494': interviewerProfile.email, // interviewer email
      'entry.908773004': interviewerProfile.name, // interviewer name
      'entry.1957722280': interviewerProfile.role, // interviewer role
      'entry.1204842539': formatDateTimeIST(interview.scheduled_time) // interview timing
    });

    // Open the form in a new tab
    window.open(`${baseUrl}?${params.toString()}`, '_blank');

    // Update feedback_submitted in database
    try {
      const { error } = await supabase
        .from('interviews')
        .update({ feedback_submitted: true })
        .eq('id', interview.id);

      if (error) {
        throw error;
      }

      // Update local state
      setInterviews(prev => prev.map(int => 
        int.id === interview.id ? { ...int, feedback_submitted: true } : int
      ));

      toast({
        title: "Feedback Form Opened",
        description: "The feedback form has been opened in a new tab. Please complete it and submit.",
      });
    } catch (error) {
      console.error('Error updating feedback status:', error);
      toast({
        title: "Error",
        description: "Failed to update feedback status. Please try again.",
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
      {/* Onboarding Banner for Non-Eligible Interviewers */}
      {isEligible === false && (
        <Card className="bg-amber-500/20 backdrop-blur-lg border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-300 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Onboarding in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-amber-100">
              Thank you for registering as an interviewer! Your onboarding process is currently in progress.
            </p>
            <div className="space-y-3">
              <div className="bg-amber-600/20 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-200 mb-2">📋 What's Next:</h4>
                <ul className="space-y-2 text-amber-100 text-sm">
                  <li>• Complete your technical skills assessment</li>
                  <li>• Attend a brief discovery session with our team</li>
                  <li>• Await approval to start conducting interviews</li>
                </ul>
              </div>
              <div className="bg-blue-600/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-200 mb-2">✉️ Check Your Email</h4>
                <p className="text-blue-100 text-sm">
                  We've sent you detailed instructions about the assessment process. 
                  If you haven't received it, please check your spam folder or contact support.
                </p>
              </div>
              <div className="bg-green-600/20 p-4 rounded-lg">
                <h4 className="font-semibold text-green-200 mb-2">🎯 Once Eligible</h4>
                <p className="text-green-100 text-sm">
                  After completing the onboarding process, you'll be able to set your availability 
                  and start receiving interview requests from candidates.
                </p>
              </div>
            </div>
            <div className="border-t border-amber-500/30 pt-4">
              <p className="text-amber-200 text-sm">
                Need help? Contact us at{" "}
                <a href="mailto:support@interviewise.in" className="text-amber-300 underline">
                  support@interviewise.in
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Interviewer Dashboard</h1>
        {isEligible && (
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
        )}
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
                      {formatDateTimeIST(interview.scheduled_time)} • {interview.target_role}
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
                    <h3 className="text-white font-semibold">{interview.candidate_name}</h3>
                    <p className="text-slate-300">
                      {formatDateTimeIST(interview.scheduled_time)} • {interview.target_role}
                    </p>
                    <p className="text-slate-400 text-sm">
                      Experience: {interview.experience} • {interview.candidate_email}
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
                       {interview.status !== 'cancelled' && new Date(interview.scheduled_time) <= new Date() && (
                         <Button 
                           size="sm" 
                           variant="outline"
                           className={interview.feedback_submitted 
                             ? "bg-green-600/20 border-green-400/30 text-green-300" 
                             : "bg-orange-600/20 border-orange-400/30 text-orange-300 hover:bg-orange-600/30"
                           }
                           onClick={() => handleSubmitFeedback(interview)}
                           disabled={interview.feedback_submitted}
                         >
                           <MessageSquare className="w-4 h-4 mr-2" />
                           {interview.feedback_submitted ? 'Feedback Submitted' : 'Submit Feedback'}
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
