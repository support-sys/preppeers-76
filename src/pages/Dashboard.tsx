import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Clock, Star, Video, ExternalLink, FileText, Edit, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import InterviewerDashboard from '@/components/InterviewerDashboard';
import InterviewRescheduleDialog from '@/components/InterviewRescheduleDialog';
import InterviewDetailsDialog from '@/components/InterviewDetailsDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDateTimeIST } from '@/utils/dateUtils';

interface Interview {
  id: string;
  interviewer_id: string;
  candidate_name: string;
  candidate_email: string;
  interviewer_email: string;
  target_role: string;
  experience: string;
  scheduled_time: string;
  status: string;
  resume_url?: string;
  google_meet_link?: string;
  google_calendar_event_id?: string;
}

const Dashboard = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [profileComplete, setProfileComplete] = useState(false);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    if (user && userRole) {
      checkProfileCompletion();
      fetchInterviews();
    }
  }, [user, userRole]);

  const checkProfileCompletion = async () => {
    if (!user) return;

    const tableName = userRole === 'interviewer' ? 'interviewers' : 'interviewees';
    const { data } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', user.id)
      .single();

    setProfileComplete(!!data);
  };

  const fetchInterviews = async () => {
    if (!user) return;

    try {
      let query = supabase.from('interviews').select('*');
      
      if (userRole === 'interviewer') {
        // Get interviewer's interviews
        const { data: interviewerData } = await supabase
          .from('interviewers')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (interviewerData) {
          query = query.eq('interviewer_id', interviewerData.id);
        }
      } else {
        // Get candidate's interviews
        query = query.or(`candidate_email.eq.${user.email},candidate_id.eq.${user.id}`);
      }

      const { data, error } = await query.order('scheduled_time', { ascending: true });

      if (error) {
        console.error('Error fetching interviews:', error);
      } else {
        // Remove duplicates and filter out rescheduled interviews
        const uniqueInterviews = data?.filter((interview, index, self) => 
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

  const handleReschedule = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowRescheduleDialog(true);
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

  if (userRole === 'interviewer' && profileComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navigation />
        
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Welcome back, {user?.user_metadata?.full_name || user?.email}!
              </h1>
              <p className="text-xl text-slate-300">
                Manage your interview sessions and help candidates succeed
              </p>
            </div>
            
            <InterviewerDashboard />
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Welcome back, {user?.user_metadata?.full_name || user?.email}!
            </h1>
            <p className="text-xl text-slate-300">
              {userRole === 'interviewer' 
                ? 'Manage your interview sessions and help candidates succeed'
                : 'Practice interviews and improve your skills'
              }
            </p>
          </div>

          {!profileComplete && (
            <Card className="bg-yellow-500/10 border-yellow-500/20 mb-8">
              <CardHeader>
                <CardTitle className="text-yellow-400">Complete Your Profile</CardTitle>
                <CardDescription className="text-yellow-300">
                  Please complete your profile to start {userRole === 'interviewer' ? 'conducting' : 'booking'} interviews.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to={userRole === 'interviewer' ? '/interviewers' : '/book'}>
                  <Button className="bg-yellow-600 hover:bg-yellow-700">
                    Complete Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Scheduled Interviews Section */}
          {upcomingInterviews.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
              <CardHeader>
                <CardTitle className="text-white">Upcoming Interviews</CardTitle>
                <CardDescription className="text-slate-300">
                  Your scheduled interview sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingInterviews.map((interview) => (
                    <div key={interview.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{interview.target_role}</h3>
                        <p className="text-slate-300">
                          {formatDateTimeIST(interview.scheduled_time)} • {interview.experience} experience
                        </p>
                        <p className="text-slate-400 text-sm">
                          {userRole === 'interviewer' 
                            ? `Candidate: ${interview.candidate_email}`
                            : `Interviewer: ${interview.interviewer_email}`
                          }
                        </p>
                        {interview.google_meet_link && (
                          <p className="text-green-400 text-sm flex items-center mt-1">
                            <Video className="w-3 h-3 mr-1" />
                            Google Meet ready
                          </p>
                        )}
                        {interview.resume_url && userRole === 'interviewer' && (
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
                          className="bg-yellow-600/20 border-yellow-400/30 text-yellow-300 hover:bg-yellow-600/30"
                          onClick={() => handleReschedule(interview)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Reschedule
                        </Button>
                        {userRole === 'interviewer' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="bg-red-600/20 border-red-400/30 text-red-300 hover:bg-red-600/30"
                            onClick={() => handleDeleteInterview(interview)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRole === 'interviewer' ? (
              <>
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Upcoming Sessions
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
                      <Star className="w-5 h-5 mr-2" />
                      Average Rating
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">4.8</p>
                    <p className="text-slate-300">Out of 5.0</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Booked Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">{upcomingInterviews.length}</p>
                    <p className="text-slate-300">Upcoming</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Practice Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">{interviews.length}</p>
                    <p className="text-slate-300">Total Sessions</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Star className="w-5 h-5 mr-2" />
                      Progress Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">78%</p>
                    <p className="text-slate-300">Improvement</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Past Interviews Section */}
          {pastInterviews.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 mt-8">
              <CardHeader>
                <CardTitle className="text-white">Past Interviews</CardTitle>
                <CardDescription className="text-slate-300">
                  Your completed interview sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pastInterviews.slice(0, 3).map((interview) => (
                    <div key={interview.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h3 className="text-white font-semibold">{interview.target_role}</h3>
                        <p className="text-slate-300">
                          {formatDateTimeIST(interview.scheduled_time)} • {interview.experience} experience
                        </p>
                        <p className="text-slate-400 text-sm">
                          {userRole === 'interviewer' 
                            ? `Candidate: ${interview.candidate_email}`
                            : `Interviewer: ${interview.interviewer_email}`
                          }
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
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userRole === 'interviewer' ? (
                <>
                  <Link to="/interviewers">
                    <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold text-white mb-2">Update Profile</h3>
                        <p className="text-slate-300">Manage your skills, availability, and rates</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-white mb-2">View Schedule</h3>
                      <p className="text-slate-300">See your upcoming interview sessions</p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Link to="/book">
                    <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibent text-white mb-2">Book Interview</h3>
                        <p className="text-slate-300">Schedule a practice session with an expert</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-white mb-2">View History</h3>
                      <p className="text-slate-300">Review your past interview sessions</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Reschedule Dialog */}
      {showRescheduleDialog && selectedInterview && (
        <InterviewRescheduleDialog
          interview={selectedInterview}
          userRole={userRole || 'interviewee'}
          onClose={() => {
            setShowRescheduleDialog(false);
            setSelectedInterview(null);
          }}
          onSuccess={() => {
            fetchInterviews();
            setShowRescheduleDialog(false);
            setSelectedInterview(null);
          }}
        />
      )}

      {/* Interview Details Dialog */}
      {showDetailsDialog && selectedInterview && (
        <InterviewDetailsDialog
          interview={selectedInterview}
          userRole={userRole || 'interviewee'}
          open={showDetailsDialog}
          onClose={() => {
            setShowDetailsDialog(false);
            setSelectedInterview(null);
          }}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default Dashboard;
