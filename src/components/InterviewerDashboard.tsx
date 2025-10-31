
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, CalendarX, Settings, Video, ExternalLink, FileText, Trash2, Eye, CheckCircle, MessageSquare, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ScheduleEditor from './ScheduleEditor';
import DateBlocker from './DateBlocker';
import TimeSlotManager from './TimeSlotManager';
import InterviewDetailsDialog from './InterviewDetailsDialog';
import { formatDateTimeIST } from '@/utils/dateUtils';
import { assessmentConfig } from '@/config/assessmentConfig';

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
  specific_skills?: string[];
  feedback_submitted?: boolean;
  interviewer_email?: string;
  interviewer_name?: string;
}

const InterviewerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'schedule' | 'block-dates' | 'time-slots'>('dashboard');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [blockedDatesCount, setBlockedDatesCount] = useState(0);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [assessmentStatus, setAssessmentStatus] = useState({
    mcqCompleted: false,
    sessionCompleted: false,
    assessmentCompleted: false
  });

  useEffect(() => {
    fetchInterviews();
    fetchBlockedDatesCount();
    fetchInterviewerStatus();
    fetchAssessmentStatus();
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

  const fetchInterviewerStatus = async () => {
    if (!user) return;

    try {
      const { data: interviewerData, error: interviewerError } = await supabase
        .from('interviewers')
        .select('id, is_eligible, payout_details_submitted_at')
        .eq('user_id', user.id)
        .single();

      if (interviewerError) {
        console.error('Error fetching interviewer status:', interviewerError);
        return;
      }

      setIsEligible(interviewerData.is_eligible);
      setIsProfileComplete(!!interviewerData.payout_details_submitted_at);

    } catch (error) {
      console.error('Error fetching interviewer status:', error);
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

  const fetchAssessmentStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('interviewers')
        .select('assessment_mcq_completed, assessment_session_completed, assessment_completed_at')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setAssessmentStatus({
          mcqCompleted: data.assessment_mcq_completed || false,
          sessionCompleted: data.assessment_session_completed || false,
          assessmentCompleted: !!data.assessment_completed_at
        });
      }
    } catch (error) {
      console.error('Error fetching assessment status:', error);
    }
  };

  const handleMarkMcqComplete = async () => {
    try {
      console.log('=== MCQ COMPLETE FUNCTION START ===');
      console.log('User ID:', user?.id);
      console.log('User object:', user);
      
      if (!user?.id) {
        console.error('No user ID found!');
        return;
      }
      
      console.log('Attempting to mark MCQ complete for user:', user.id);
      
      const { data, error } = await supabase
        .from('interviewers')
        .update({ assessment_mcq_completed: true })
        .eq('user_id', user.id)
        .select();

      console.log('Update result:', { data, error });
      console.log('Data length:', data?.length);
      console.log('Error details:', error);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log('Successfully updated MCQ status');
        setAssessmentStatus(prev => ({ ...prev, mcqCompleted: true }));
        toast({
          title: "MCQ Marked Complete",
          description: "MCQ assessment marked as completed!"
        });
      } else {
        console.error('No data returned from update');
      }
    } catch (error) {
      console.error('Error in handleMarkMcqComplete:', error);
      toast({
        title: "Error",
        description: `Failed to update MCQ status: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleMarkSessionComplete = async () => {
    try {
      console.log('Attempting to mark session complete for user:', user?.id);
      
      const { data, error } = await supabase
        .from('interviewers')
        .update({ assessment_session_completed: true })
        .eq('user_id', user.id)
        .select();

      console.log('Update result:', { data, error });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      setAssessmentStatus(prev => ({ ...prev, sessionCompleted: true }));
      toast({
        title: "Session Marked Complete",
        description: "Live session marked as completed!"
      });
    } catch (error) {
      console.error('Error in handleMarkSessionComplete:', error);
      toast({
        title: "Error",
        description: `Failed to update session status: ${error.message}`,
        variant: "destructive"
      });
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

  const handleAddFeedback = (interview: Interview) => {
    // Build prefilled form URL with interview data
    const baseUrl = assessmentConfig.feedbackFormUrl;
    const params = new URLSearchParams();
    
    // Map interview data to form fields
    params.append('entry.273813679', interview.candidate_email || '');
    params.append('entry.2000148292', interview.candidate_name || '');
    params.append('entry.357973421', interview.target_role || '');
    params.append('entry.715683291', interview.specific_skills?.join(', ') || '');
    params.append('entry.927252494', interview.interviewer_email || '');
    params.append('entry.908773004', interview.interviewer_name || '');
    params.append('entry.1204842539', interview.scheduled_time || ''); 
    params.append('entry.1957722280', interview.selected_plan || ''); 
    params.append('entry.382117976', interview.interview_duration?.toString() || '');
    
    const prefilledUrl = `${baseUrl}&${params.toString()}`;
    window.open(prefilledUrl, '_blank');
  };

  const handleMarkFeedbackSubmitted = async (interviewId: string) => {
    try {
      const { error } = await supabase
        .from('interviews')
        .update({ feedback_submitted: true })
        .eq('id', interviewId);

      if (error) {
        throw error;
      }

      toast({
        title: "Feedback Marked Submitted",
        description: "Feedback has been marked as submitted successfully.",
      });

      fetchInterviews(); // Refresh the list
    } catch (error) {
      console.error('Error marking feedback as submitted:', error);
      toast({
        title: "Error",
        description: "Failed to mark feedback as submitted. Please try again.",
        variant: "destructive",
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


  if (activeView === 'time-slots') {
    return <TimeSlotManager onClose={() => setActiveView('dashboard')} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Interviewer Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setActiveView('time-slots')}
            className="bg-green-600 hover:bg-green-700 text-sm"
          >
            <Clock className="w-4 h-4 mr-2" />
            Manage Schedule
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setActiveView('block-dates')}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm"
          >
            <CalendarX className="w-4 h-4 mr-2" />
            Block Dates
          </Button>
        </div>
      </div>

      {/* Assessment Phase Message */}
      {isProfileComplete && isEligible === false && (
        <Card className="bg-amber-500/20 backdrop-blur-lg border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-300 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Complete Your Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-amber-100">
                🎯 <strong>Your profile is not completed!</strong> To complete, please take the assessment by clicking the button below. 
                If you already completed the assessment via email links, mark them as completed.
              </p>
              
              {/* Assessment Progress */}
              <div className="bg-amber-600/20 border border-amber-500/30 p-4 rounded-lg">
                <h4 className="text-amber-200 font-semibold mb-3">Assessment Progress:</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-100 text-sm">1. MCQ Technical Assessment</span>
                    {assessmentStatus.mcqCompleted ? (
                      <div className="flex items-center text-green-400">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span className="text-xs">Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => window.open(assessmentConfig.mcqFormUrl, '_blank')}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Take MCQ
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            console.log('Mark Done button clicked for MCQ');
                            handleMarkMcqComplete();
                          }}
                          className="border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs"
                        >
                          Mark Done
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-amber-100 text-sm">2. Live Interview Session</span>
                    {assessmentStatus.sessionCompleted ? (
                      <div className="flex items-center text-green-400">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span className="text-xs">Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => window.open(assessmentConfig.sessionBookingUrl, '_blank')}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Book Session
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            console.log('Mark Done button clicked for Session');
                            handleMarkSessionComplete();
                          }}
                          className="border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs"
                        >
                          Mark Done
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Assessment Instructions */}
              <div className="text-center">
                <p className="text-amber-200 text-sm">
                  Complete both steps above to finish your assessment
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Profile Approved - Ready for Interviews */}
      {isProfileComplete && isEligible === true && (
        <Card className="bg-green-500/20 backdrop-blur-lg border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-300 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Profile Approved - Ready for Interviews!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-green-100">
                🎉 <strong>Congratulations! Your profile has been approved!</strong>
              </p>
              <p className="text-green-200 text-sm">
                You're now eligible to take interviews and start earning. Candidates can book interview slots 
                with you based on your availability schedule.
              </p>
              <div className="bg-green-600/20 border border-green-500/30 p-3 rounded-lg">
                <p className="text-green-100 text-sm">
                  🚀 <strong>What you can do now:</strong>
                </p>
                <ul className="text-green-200 text-sm mt-2 ml-4 space-y-1">
                  <li>• Receive interview bookings from candidates</li>
                  <li>• Conduct interviews and provide feedback</li>
                  <li>• Earn money for each completed interview</li>
                  <li>• Update your schedule anytime</li>
                </ul>
              </div>
              <p className="text-green-200 text-sm">
                <strong>Next:</strong> Make sure your availability schedule is up to date so candidates can book interviews with you!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                <div key={interview.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white/5 rounded-lg gap-3 sm:gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{interview.target_role}</h3>
                    <p className="text-slate-300 text-sm sm:text-base">
                      {formatTimeRange(interview.scheduled_time, interview.interview_duration || 60)}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {formatExperience(interview.experience)} • {formatPlanName(interview.selected_plan || 'standard')} Plan • {formatDuration(interview.interview_duration || 60)}
                    </p>
                    {interview.specific_skills && interview.specific_skills.length > 0 && (
                      <p className="text-blue-400 text-sm truncate">
                        Skills: {interview.specific_skills.join(', ')}
                      </p>
                    )}
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
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-purple-600/20 border-purple-400/30 text-purple-300 hover:bg-purple-600/30 flex-shrink-0"
                      onClick={() => handleViewDetails(interview)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                    {interview.resume_url && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="bg-blue-600/20 border-blue-400/30 text-blue-300 hover:bg-blue-600/30 flex-shrink-0"
                        onClick={() => handleViewResume(interview.resume_url!)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    {interview.google_meet_link ? (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 flex-shrink-0"
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
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-shrink-0"
                        disabled
                      >
                        <Video className="w-4 h-4 mr-2" />
                        No Link
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-red-600/20 border-red-400/30 text-red-300 hover:bg-red-600/30 flex-shrink-0"
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
                <div key={interview.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white/5 rounded-lg gap-3 sm:gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{interview.target_role}</h3>
                    <p className="text-slate-300 text-sm sm:text-base">
                      {formatTimeRange(interview.scheduled_time, interview.interview_duration || 60)}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {formatExperience(interview.experience)} • {formatPlanName(interview.selected_plan || 'standard')} Plan • {formatDuration(interview.interview_duration || 60)}
                    </p>
                    {interview.specific_skills && interview.specific_skills.length > 0 && (
                      <p className="text-blue-400 text-sm truncate">
                        Skills: {interview.specific_skills.join(', ')}
                      </p>
                    )}
                    <p className="text-slate-400 text-sm capitalize">
                      Status: {interview.status}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-purple-600/20 border-purple-400/30 text-purple-300 hover:bg-purple-600/30 flex-shrink-0"
                      onClick={() => handleViewDetails(interview)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                    {interview.resume_url && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="bg-blue-600/20 border-blue-400/30 text-blue-300 hover:bg-blue-600/30 flex-shrink-0"
                        onClick={() => handleViewResume(interview.resume_url!)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    {interview.feedback_submitted ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="bg-green-600/20 border-green-400/30 text-green-300 hover:bg-green-600/30 flex-shrink-0"
                        onClick={() => handleAddFeedback(interview)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Modify Feedback
                      </Button>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="bg-amber-600/20 border-amber-400/30 text-amber-300 hover:bg-amber-600/30 flex-shrink-0"
                          onClick={() => handleAddFeedback(interview)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Add Feedback
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="bg-green-600/20 border-green-400/30 text-green-300 hover:bg-green-600/30 flex-shrink-0"
                          onClick={() => handleMarkFeedbackSubmitted(interview.id)}
                        >
                          <ClipboardCheck className="w-4 h-4 mr-2" />
                          Mark Submitted
                        </Button>
                      </>
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
