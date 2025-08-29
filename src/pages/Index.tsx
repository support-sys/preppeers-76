import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, MessageSquare, Trophy, Upload, Calendar, Video, FileText, User, DollarSign, Clock, Network } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { findMatchingInterviewer, scheduleInterview } from "@/services/interviewScheduling";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import MatchingLoader from "@/components/MatchingLoader";
import { supabase } from "@/integrations/supabase/client";
import { SmartCTAButtons, IntervieweeButton, InterviewerButton } from "@/components/SmartCTAButtons";
import WelcomeMessage from "@/components/WelcomeMessage";
const Index = () => {
  const [isMatching, setIsMatching] = useState(false);
  const {
    toast
  } = useToast();
  const {
    user,
    userRole
  } = useAuth();
  const navigate = useNavigate();
  const {
    paymentSession,
    hasSuccessfulPayment
  } = usePaymentStatus();

  // Redirect to payment processing page if there's an active payment session
  useEffect(() => {
    if (paymentSession && !paymentSession.interview_matched) {
      navigate('/payment-processing');
    }
  }, [paymentSession, navigate]);
  const handleStartMatching = async () => {
    if (!paymentSession || !user) {
      toast({
        title: "Error",
        description: "Missing payment information. Please try booking again.",
        variant: "destructive"
      });
      return;
    }
    setIsMatching(true);
    try {
      console.log('Starting matching process from homepage...');

      // Get candidate data from payment session
      const candidateData = paymentSession.candidate_data;

      // Find matching interviewer
      const interviewer = await findMatchingInterviewer(candidateData, user?.id);
      if (interviewer) {
        console.log('Interviewer found, scheduling interview...');

        // Schedule the interview and send emails
        await scheduleInterview(interviewer, candidateData, user?.email || '', user?.user_metadata?.full_name || user?.email || '', candidateData.interviewDuration || 60, user?.id);
        toast({
          title: "Interview Scheduled!",
          description: "Your interview has been scheduled successfully!"
        });

        // Navigate to dashboard or success page
        navigate('/dashboard');
      } else {
        console.log('No interviewer found');
        toast({
          title: "No Interviewer Available",
          description: "We're finding the best interviewer for you! We'll contact you soon."
        });

        // Keep the button visible for retry
        setIsMatching(false);
      }
    } catch (error) {
      console.error("Error processing matching:", error);
      toast({
        title: "Processing Error",
        description: "There was an issue with matching. We'll contact you soon!",
        variant: "destructive"
      });
      setIsMatching(false);
    }
  };
  if (isMatching) {
    return <MatchingLoader />;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      <WelcomeMessage />
      
      {/* Tech Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent">
          <div className="w-full h-full" style={{
          background: 'radial-gradient(circle at 25% 25%, rgba(156, 146, 172, 0.1) 2px, transparent 2px)',
          backgroundSize: '60px 60px'
        }} />
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Crack Your IT Interviews with{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Real Engineers
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Practice with professionals, receive feedback, and become job-ready.
          </p>

          {/* CTA Buttons */}
          <SmartCTAButtons className="mb-16" />

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-300 group-hover:scale-110">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Real Engineers</h3>
              <p className="text-zinc-200">Practice with experienced professionals from top tech companies</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-300 group-hover:scale-110">
                <MessageSquare className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Real Feedback</h3>
              <p className="text-slate-300">Get detailed insights and actionable improvement suggestions</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="bg-yellow-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-300 group-hover:scale-110">
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Real Results</h3>
              <p className="text-slate-300">Join thousands who landed their dream jobs after practicing</p>
            </div>
          </div>
        </div>
      </div>

      {/* For Interviewees Section */}
      <div className="relative z-10 bg-white/5 border-t border-white/10">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                For <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Interviewees</span>
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Get ready for your next tech interview with personalized mock sessions and expert feedback
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {/* Register and Upload Resume */}
              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  <Upload className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Register & Upload Resume</h3>
                <p className="text-slate-300">Create your profile and upload your resume to get personalized interview experiences</p>
              </div>

              {/* Select Target Role */}
              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  <User className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Select Target Role & Tech Stack</h3>
                <p className="text-slate-300">Choose from Java, Python, React, Node.js, and more to match your career goals</p>
              </div>

              {/* Book Interview Slot */}
              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  <Calendar className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Book an Interview Slot</h3>
                <p className="text-slate-300">Schedule your mock interview at a convenient time that works for you</p>
              </div>

              {/* Join via GMeet */}
              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="bg-red-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  <Video className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Join via Google Meet</h3>
                <p className="text-slate-300">Connect seamlessly with your interviewer through integrated video calls</p>
              </div>

              {/* Get Detailed Feedback - Safari Compatible Grid Spanning */}
              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group md:col-span-2 lg:col-span-2" style={{ gridColumn: 'span 2' }}>
                <div className="bg-yellow-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  <FileText className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Get Detailed Feedback & Improvement Plan</h3>
                <p className="text-slate-300">Receive comprehensive feedback on your performance with actionable steps to improve your interview skills and technical knowledge</p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <IntervieweeButton 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-12 py-4 text-xl font-semibold rounded-xl" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* For Interviewers Section */}
      <div className="relative z-10 bg-slate-800/50 border-t border-white/10">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                For <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Interviewers</span>
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Share your expertise, earn flexible income, and help shape the next generation of IT professionals
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Flexible Income</h3>
                <p className="text-slate-300">Earn ₹500-₹1500 per session based on your experience and conduct interviews on your schedule</p>
              </div>

              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  <Clock className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Work Flexibly</h3>
                <p className="text-slate-300">Set your own availability and work from anywhere. Perfect for full-time professionals looking for side income</p>
              </div>

              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  <Network className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Build Your Network</h3>
                <p className="text-slate-300">Connect with aspiring professionals and expand your professional network while giving back to the community</p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <InterviewerButton 
                size="lg" 
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-12 py-4 text-xl font-semibold rounded-xl shadow-green-500/25" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="relative z-10 bg-white/5 border-t border-white/10">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                What Our Users Say
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Real feedback from professionals who've transformed their careers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    R
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-semibold">Rahul Sharma</h4>
                    <p className="text-slate-400 text-sm">Java Backend Developer</p>
                  </div>
                </div>
                <p className="text-slate-300">
                  "The mock interviews helped me identify my weak areas and gave me confidence. Landed my dream job at JP Morgan!"
                </p>
              </div>

              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    P
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-semibold">Priya Patel</h4>
                    <p className="text-slate-400 text-sm">Frontend Developer</p>
                  </div>
                </div>
                <p className="text-slate-300">
                  "The detailed feedback was incredibly valuable. I improved my coding interview skills significantly."
                </p>
              </div>

              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-semibold">Amit Kumar</h4>
                    <p className="text-slate-400 text-sm">Data Analyst</p>
                  </div>
                </div>
                <p className="text-slate-300">
                  "Practicing with real engineers made all the difference. The experience felt authentic and prepared me well."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Preview Section */}
      <div className="relative z-10 bg-slate-800/50 border-t border-white/10">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto">
              Choose the plan that fits your needs. All sessions include live feedback and improvement plans.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <h3 className="text-2xl font-bold text-white mb-2">Essential</h3>
                <div className="text-4xl font-bold text-blue-400 mb-4">₹499</div>
                <p className="text-slate-300 mb-6">Quick practice session</p>
                <ul className="text-slate-300 text-left space-y-2">
                  <li>• 30-minute focused session</li>
                  <li>• Real-time verbal feedback</li>
                  <li>• Basic performance assessment</li>
                  <li>• Quick improvement tips</li>
                </ul>
              </div>

              <div className="bg-white/10 rounded-2xl p-8 border-2 border-blue-400 hover:bg-white/15 transition-all duration-300 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-400 text-slate-900 px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
                <div className="text-4xl font-bold text-blue-400 mb-4">₹999</div>
                <p className="text-slate-300 mb-6">Complete interview prep</p>
                <ul className="text-slate-300 text-left space-y-2">
                  <li>• 60-minute comprehensive session</li>
                  <li>• Detailed written feedback (PDF)</li>
                  <li>• Personalized action plan</li>
                  <li>• Follow-up support</li>
                </ul>
              </div>

              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <h3 className="text-2xl font-bold text-white mb-2">Executive</h3>
                <div className="text-4xl font-bold text-blue-400 mb-4">₹1299</div>
                <p className="text-slate-300 mb-6">Premium career package</p>
                <ul className="text-slate-300 text-left space-y-2">
                  <li>• 60-minute comprehensive session</li>
                  <li>• Professional resume review</li>
                  <li>• Career development guidance</li>
                  <li>• 1-month follow-up support</li>
                </ul>
              </div>
            </div>

            <Link to="/pricing">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105">
                See Full Pricing
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-xl animate-pulse delay-700"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>

      <Footer />
    </div>;
};
export default Index;