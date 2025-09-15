import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, MessageSquare, Trophy, DollarSign, Clock, Network, Star, CheckCircle, UserPlus, FileText, ClipboardCheck, Target, Calendar, Award } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const BecomeInterviewer = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const handleBecomeInterviewer = () => {
    if (user) {
      // If user is already logged in, redirect to interviewer profile
      navigate('/interviewers');
    } else {
      // If not logged in, go to signup with interviewer role
      navigate('/auth?role=interviewer');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {user && userRole === 'interviewer' ? (
            // Existing interviewer - show welcome message
            <>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Welcome Back, <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Interviewer!</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Ready to continue helping candidates succeed? Access your dashboard to manage interviews and profile.
              </p>

              <Button 
                onClick={handleBecomeInterviewer}
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-xl font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-green-500/25"
              >
                Go to Dashboard
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </>
          ) : (
            // New user - show become interviewer message
            <>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Become an <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Interviewer</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Share your expertise, help candidates succeed, and earn while making a difference.
              </p>

              <Button 
                onClick={handleBecomeInterviewer}
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 text-xl font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-blue-500/25"
              >
                Register Interviewer
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="relative z-10 bg-white/5 border-t border-white/10">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Why Become an <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Interviewer?</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-300 group-hover:scale-110">
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Earn Money</h3>
                <p className="text-slate-300">Earn ₹300-₹700 per session based on type of interviews conducted</p>
              </div>

              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-300 group-hover:scale-110">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Help Others</h3>
                <p className="text-slate-300">Guide candidates to success and share your industry knowledge</p>
              </div>

              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="bg-yellow-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-300 group-hover:scale-110">
                  <Network className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Build Network</h3>
                <p className="text-slate-300">Connect with talented professionals and expand your industry network</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements Section */}
      <div className="relative z-10 bg-white/5 border-t border-white/10">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Requirements to <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Join</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
                  What You Need
                </h3>
                <ul className="space-y-4 text-slate-300">
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Minimum 3 years of professional experience</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Already taking interviews in your company</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Hands-on interviewer experience</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Strong technical skills in your domain</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Good communication and mentoring skills</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Passion for helping others grow</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
                  What We Provide
                </h3>
                <ul className="space-y-4 text-slate-300">
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Flexible scheduling - work when you want</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Comprehensive onboarding and support</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Professional interview tools and platform</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Regular payments and performance bonuses</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="relative z-10 bg-white/5 border-t border-white/10">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Your Journey to Becoming an <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Interviewer</span>
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Follow these 7 steps to start your career as a professional interviewer
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {/* Step 1 */}
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group text-center">
                <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-300 group-hover:scale-110">
                  <UserPlus className="w-8 h-8 text-blue-400" />
                </div>
                <div className="bg-blue-500 text-white text-sm font-bold rounded-full px-3 py-1 mb-3 inline-block">Step 1</div>
                <h3 className="text-lg font-semibold text-white mb-2">Register as Interviewer</h3>
                <p className="text-slate-300 text-sm">Create your account and select the interviewer role to get started</p>
              </div>

              {/* Step 2 */}
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group text-center">
                <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-300 group-hover:scale-110">
                  <FileText className="w-8 h-8 text-green-400" />
                </div>
                <div className="bg-green-500 text-white text-sm font-bold rounded-full px-3 py-1 mb-3 inline-block">Step 2</div>
                <h3 className="text-lg font-semibold text-white mb-2">Complete Your Profile</h3>
                <p className="text-slate-300 text-sm">Fill in your skills, experience, and availability schedule</p>
              </div>

              {/* Step 3 */}
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group text-center">
                <div className="bg-yellow-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-300 group-hover:scale-110">
                  <ClipboardCheck className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="bg-yellow-500 text-white text-sm font-bold rounded-full px-3 py-1 mb-3 inline-block">Step 3</div>
                <h3 className="text-lg font-semibold text-white mb-2">Assessment Phase</h3>
                <p className="text-slate-300 text-sm">Complete our evaluation process to verify your expertise</p>
              </div>

              {/* Step 4 */}
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group text-center">
                <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-300 group-hover:scale-110">
                  <Target className="w-8 h-8 text-purple-400" />
                </div>
                <div className="bg-purple-500 text-white text-sm font-bold rounded-full px-3 py-1 mb-3 inline-block">Step 4</div>
                <h3 className="text-lg font-semibold text-white mb-2">Get Interview Ready</h3>
                <p className="text-slate-300 text-sm">Once approved, you'll be eligible to conduct interviews</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 5 */}
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group text-center">
                <div className="bg-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-300 group-hover:scale-110">
                  <Calendar className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="bg-indigo-500 text-white text-sm font-bold rounded-full px-3 py-1 mb-3 inline-block">Step 5</div>
                <h3 className="text-lg font-semibold text-white mb-2">Smart Interview Matching</h3>
                <p className="text-slate-300 text-sm">We'll match you with candidates based on your skills, experience, and availability</p>
              </div>

              {/* Step 6 */}
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group text-center">
                <div className="bg-pink-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-300 group-hover:scale-110">
                  <MessageSquare className="w-8 h-8 text-pink-400" />
                </div>
                <div className="bg-pink-500 text-white text-sm font-bold rounded-full px-3 py-1 mb-3 inline-block">Step 6</div>
                <h3 className="text-lg font-semibold text-white mb-2">Conduct Interviews</h3>
                <p className="text-slate-300 text-sm">Use our platform to conduct professional mock interviews</p>
              </div>

              {/* Step 7 */}
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group text-center">
                <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-300 group-hover:scale-110">
                  <Award className="w-8 h-8 text-orange-400" />
                </div>
                <div className="bg-orange-500 text-white text-sm font-bold rounded-full px-3 py-1 mb-3 inline-block">Step 7</div>
                <h3 className="text-lg font-semibold text-white mb-2">Provide Feedback</h3>
                <p className="text-slate-300 text-sm">Share detailed feedback and help candidates improve their skills</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 bg-white/5 border-t border-white/10">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            {user && userRole === 'interviewer' ? (
              // Existing interviewer
              <>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready to <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Continue?</span>
                </h2>
                <p className="text-xl text-slate-300 mb-8">
                  Access your dashboard to manage interviews, update your profile, and help more candidates succeed.
                </p>
                <Button 
                  onClick={handleBecomeInterviewer}
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-xl font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-green-500/25"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </>
            ) : (
              // New user
              <>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready to <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Start?</span>
                </h2>
                <p className="text-xl text-slate-300 mb-8">
                  Join our community of expert interviewers and start making a difference today.
                </p>
                <Button 
                  onClick={handleBecomeInterviewer}
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 text-xl font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-blue-500/25"
                >
                  Register Interviewer Now
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BecomeInterviewer;
