
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, userRole } = useAuth();
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    if (user && userRole) {
      checkProfileCompletion();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Welcome back, {user?.email}!
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
                    <p className="text-3xl font-bold text-white">3</p>
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
                    <p className="text-3xl font-bold text-white">24</p>
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
                    <p className="text-3xl font-bold text-white">2</p>
                    <p className="text-slate-300">This week</p>
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
                    <p className="text-3xl font-bold text-white">12</p>
                    <p className="text-slate-300">Total</p>
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
                        <h3 className="text-xl font-semibold text-white mb-2">Book Interview</h3>
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
      
      <Footer />
    </div>
  );
};

export default Dashboard;
