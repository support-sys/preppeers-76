import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, MessageSquare, Trophy, Upload, Calendar, Video, FileText, User, Check, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { findMatchingInterviewer, scheduleInterview } from "@/services/interviewScheduling";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import MatchingLoader from "@/components/MatchingLoader";
import { supabase } from "@/integrations/supabase/client";
import { IntervieweeButton } from "@/components/SmartCTAButtons";
import WelcomeMessage from "@/components/WelcomeMessage";
import ComparisonSection from "@/components/ComparisonSection";
import InterviewerShowcase from "@/components/InterviewerShowcase";
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

  // Redirect to payment processing page only for successful payments that haven't been matched
  useEffect(() => {
    if (paymentSession && 
        (paymentSession.payment_status === 'successful' || paymentSession.payment_status === 'completed') && 
        !paymentSession.interview_matched) {
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
            Get Interview Ready with{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Real Tech Interviewers
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          Practice with Tech Engineers who take Real Interviews in Top Companies. <br /> 
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
           Not AI Agents.
            </span>
          </p>

          {/* CTA Buttons */}
          <IntervieweeButton className="mb-16 px-8 py-4 text-lg font-semibold rounded-xl" />

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-300 group-hover:scale-110">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Real Engineers</h3>
              <p className="text-zinc-200">Practice with experienced Interviewers from top tech companies</p>
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
            <div className="text-center mb-8 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">
                For <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Interviewees</span>
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto px-4">
                Get ready for your next tech interview with personalized mock sessions and expert feedback
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-12">
              {/* Register and Upload Resume */}
              <div className="bg-white/10 rounded-2xl p-4 md:p-6 lg:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="bg-purple-500/20 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-4 md:mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  <Upload className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">Register & Upload Resume</h3>
                <p className="text-sm md:text-base text-slate-300">Create your profile and upload your resume to get personalized interview experiences</p>
              </div>

              {/* Select Target Role */}
              <div className="bg-white/10 rounded-2xl p-4 md:p-6 lg:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="bg-blue-500/20 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-4 md:mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  <User className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">Select Target Role & Tech Stack</h3>
                <p className="text-sm md:text-base text-slate-300">Choose from Java, Python, React, Node.js, and more to match your career goals</p>
              </div>

              {/* Book Interview Slot */}
              <div className="bg-white/10 rounded-2xl p-4 md:p-6 lg:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="bg-green-500/20 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-4 md:mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  <Calendar className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">Book an Interview Slot</h3>
                <p className="text-sm md:text-base text-slate-300">Schedule your mock interview at a convenient time that works for you</p>
              </div>

              {/* Join via GMeet */}
              <div className="bg-white/10 rounded-2xl p-4 md:p-6 lg:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="bg-red-500/20 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-4 md:mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  <Video className="w-6 h-6 md:w-8 md:h-8 text-red-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">Join via Google Meet</h3>
                <p className="text-sm md:text-base text-slate-300">Connect seamlessly with your interviewer through integrated video calls</p>
              </div>

              {/* Get Detailed Feedback - Full Width on Mobile, Spans 2 on Larger Screens */}
              <div className="bg-white/10 rounded-2xl p-4 md:p-6 lg:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group col-span-1 md:col-span-2 lg:col-span-2">
                <div className="bg-yellow-500/20 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-4 md:mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  <FileText className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">Get Detailed Feedback & Improvement Plan</h3>
                <p className="text-sm md:text-base text-slate-300">Receive comprehensive feedback on your performance with actionable steps to improve your interview skills and technical knowledge</p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center px-4">
              <IntervieweeButton 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-6 md:px-12 py-3 md:py-4 text-base md:text-xl font-semibold rounded-xl w-full md:w-auto" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      <ComparisonSection />

      {/* Interviewer Showcase Section */}
      <div className="relative z-10 bg-white/5 border-t border-white/10">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-7xl mx-auto">
            <InterviewerShowcase />
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

      {/* Pricing Section */}
      <div className="relative z-10 border-t border-white/10" style={{ backgroundColor: '#16285a' }}>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
                Choose the plan that fits your needs. All sessions include live feedback and improvement plans.
              </p>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 max-w-2xl mx-auto">
                <p className="text-white font-semibold text-lg">
                  🎯 All sessions are live, GMeet based, and conducted by real engineers from top tech companies
                </p>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 relative">
                <CardHeader className="text-center">
                  <CardTitle className="text-white text-2xl">Essential</CardTitle>
                  <div className="text-4xl font-bold text-blue-400 my-4">₹499</div>
                  <CardDescription className="text-slate-300">
                    Perfect for quick interview practice and basic feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      30-minute focused mock interview session
                    </li>
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      Basic verbal feedback during the interview
                    </li>
                  </ul>
                  <Link to="/book" className="block">
                    <Button 
                      size="lg" 
                      className="w-full py-3 text-lg font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20"
                      variant="outline"
                    >
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-2 border-blue-400 hover:bg-white/15 transition-all duration-300 relative transform transition-transform duration-300 hover:scale-105">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-400 text-slate-900 px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  Most Popular
                </div>
                <CardHeader className="text-center">
                  <CardTitle className="text-white text-2xl">Professional</CardTitle>
                  <div className="text-4xl font-bold text-blue-400 my-4">₹999</div>
                  <CardDescription className="text-slate-300">
                    Most popular choice for comprehensive interview preparation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      60-minute comprehensive mock interview
                    </li>
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      Comprehensive feedback report (PDF) - technical skills, communication, behavior & presentation analysis
                    </li>
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      Personalized action plan for improvement
                    </li>
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      Interview performance analysis
                    </li>
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      Follow-up support and guidance
                    </li>
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      Interview recording (optional)
                    </li>
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      Priority customer support
                    </li>
                  </ul>
                  <Link to="/book" className="block">
                    <Button 
                      size="lg" 
                      className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                    >
                      Most Popular
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 relative">
                <CardHeader className="text-center">
                  <CardTitle className="text-white text-2xl">Executive</CardTitle>
                  <div className="text-4xl font-bold text-blue-400 my-4">₹1,299</div>
                  <CardDescription className="text-slate-300">
                    Premium career development package with complete support
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      60-minute comprehensive mock interview
                    </li>
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      Professional Resume Feedback (not during mock interview)
                    </li>
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      Comprehensive feedback report (PDF) - technical skills, communication, behavior & presentation analysis
                    </li>
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      Personalized action plan for improvement
                    </li>
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      Interview performance analysis
                    </li>
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      Follow-up support and guidance
                    </li>
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      Interview recording (optional)
                    </li>
                    <li className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      Priority customer support
                    </li>
                  </ul>
                  <Link to="/book" className="block">
                    <Button 
                      size="lg" 
                      className="w-full py-3 text-lg font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20"
                      variant="outline"
                    >
                      Go Executive
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
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