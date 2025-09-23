import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, MessageSquare, Trophy, Upload, Calendar, Video, FileText, User, Check, Star, GraduationCap, Zap, Rocket, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { findMatchingInterviewer, scheduleInterview } from "@/services/interviewScheduling";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import MatchingLoader from "@/components/MatchingLoader";
import { supabase } from "@/integrations/supabase/client";
import { IntervieweeButton, SmartCTAButtons } from "@/components/SmartCTAButtons";
import WelcomeMessage from "@/components/WelcomeMessage";
import ComparisonSection from "@/components/ComparisonSection";
import FeedbackReportPreview from "@/components/FeedbackReportPreview";
import InterviewerShowcase from "@/components/InterviewerShowcase";
const Index = () => {
  const [isMatching, setIsMatching] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
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

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

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
          Tired of Rejections? <br />{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Walk in the Next Interview with Confidence
              </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          Practice with Tech Interviewers from top companies and get detailed feedback before your Big Day.
          <br />
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-6 mb-8">
            <SmartCTAButtons className="mb-0" />
            
             {/* Satisfaction Guarantee Badge - Compact */}
             <img 
               src="/guarantee-badge.png" 
               alt="100% Satisfaction or Your Money Back Guarantee"
               className="w-32 h-auto shadow-lg hover:scale-105 transition-transform duration-300"
             />
          </div>

          {/* Feature Highlights */}
       
        </div>
      </div>

      {/* Limited Slots Notice */}
    

      {/* Who It's For Section */}
      <div className="relative z-10 bg-white/5 border-t border-white/10">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Who It's <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">For</span>
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                Whether you're starting fresh or making your next career move
              </p>
            </div>

            {/* Target Audience Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Freshers */}
              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group text-center">
                <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  <GraduationCap className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Freshers</h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  "Test your confidence before your first big break."
                </p>
              </div>

              {/* Mid-level devs */}
              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group text-center">
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  <Zap className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Mid-level Devs</h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  "Ace tough technical rounds and explain projects clearly."
                </p>
              </div>

              {/* Job switchers */}
              <div className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group text-center">
                <div className="bg-gradient-to-br from-green-500/20 to-yellow-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  <Rocket className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Job Switchers</h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  "Don't let rejections delay your next big salary jump."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* For Interviewees Section - Simplified */}
      <div className="relative z-10 bg-white/5 border-t border-white/10">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              How it  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Works</span>
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              So Simple, You Can Start Today
              </p>
            </div>

            {/* Side-by-Side Grid - Desktop */}
            <div className="hidden md:block mb-12">
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-2 gap-6">
                  {/* Step 1: Register & Upload */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">1</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">Register & Upload</h3>
                        <p className="text-slate-300 text-sm">Tell us about your background</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Select Role & Book */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">2</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">Select Role & Book</h3>
                        <p className="text-slate-300 text-sm">Choose role and schedule interview</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Join Interview */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">3</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">Join Interview</h3>
                        <p className="text-slate-300 text-sm">Face a Real Interviewer over GMeet.</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Get Insights */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">4</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">Get Insights</h3>
                        <p className="text-slate-300 text-sm">Walk away with detailed feedback & action plan</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: Simplified Vertical Steps */}
            <div className="md:hidden space-y-4 mb-12">
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white">Register & Upload</h3>
                    <p className="text-xs text-slate-300">Create profile and upload resume</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white">Select Role & Book</h3>
                    <p className="text-xs text-slate-300">Choose role and schedule interview</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white">Join Interview</h3>
                    <p className="text-xs text-slate-300">Connect via Google Meet</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">4</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white">Get Insights</h3>
                    <p className="text-xs text-slate-300">Receive detailed feedback</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Comparison Section */}
      <ComparisonSection />

      {/* Feedback Report Preview Section */}
      <div className="relative z-10 bg-white/5 border-t border-white/10">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <FeedbackReportPreview />
          </div>
        </div>
      </div>

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
              From Rejections → to Dream Offers

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
                  "I was confused first to book interview but The mock interviews helped me identify my weak areas and gave me confidence. Finally Landed my dream job at JPM!"
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
                  "The detailed feedback was incredibly valuable. I improved my coding interview skills significantly. Totally worth the Price!"
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
                  "I tried other platforms but they were just AI agents taking MCQs. Practicing with real interviewers made all the difference. Best part is I got a detailed feedback report."
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
              One Rejection costs you Weeks. <br /><br /> A mock interview costs pretty less.
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Choose the plan that saves you time, confidence, and lost opportunities
              </p>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 max-w-2xl mx-auto">
                <p className="text-white font-semibold text-lg">
                  🎯 All sessions are live, GMeet based, and conducted by Real Interviewers from top tech companies
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

      {/* FAQ Section */}
      <div className="relative z-10 bg-white/5 border-t border-white/10">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Frequently Asked <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Questions</span>
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Everything you need to know before booking your mock interview
              </p>
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {/* FAQ 1 */}
              <div className="bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(0)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-white">What if I'm not ready yet?</h3>
                  {openFAQ === 0 ? (
                    <ChevronUp className="w-6 h-6 text-white flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-white flex-shrink-0" />
                  )}
                </button>
                {openFAQ === 0 && (
                  <div className="px-6 pb-6">
                    <p className="text-slate-300 text-lg leading-relaxed">
                      That's exactly why you should do a mock. Even if you fail here, it's safe. You'll get detailed feedback so you know exactly what to improve before the real interview.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ 2 */}
              <div className="bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(1)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-white">Who will take my mock interview?</h3>
                  {openFAQ === 1 ? (
                    <ChevronUp className="w-6 h-6 text-white flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-white flex-shrink-0" />
                  )}
                </button>
                {openFAQ === 1 && (
                  <div className="px-6 pb-6">
                    <p className="text-slate-300 text-lg leading-relaxed">
                      All interviews are conducted by real engineers from top tech companies — professionals who take actual interviews daily. No AI bots, no random freelancers.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ 3 */}
              <div className="bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(2)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-white">Will the interviewer know my tech stack?</h3>
                  {openFAQ === 2 ? (
                    <ChevronUp className="w-6 h-6 text-white flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-white flex-shrink-0" />
                  )}
                </button>
                {openFAQ === 2 && (
                  <div className="px-6 pb-6">
                    <p className="text-slate-300 text-lg leading-relaxed">
                      Yes. You can select interviewers based on your role and technology (Java, Python, Frontend, Data Engineering, etc.), so your mock is 100% relevant.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ 4 */}
              <div className="bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(3)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-white">How soon can I book a mock?</h3>
                  {openFAQ === 3 ? (
                    <ChevronUp className="w-6 h-6 text-white flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-white flex-shrink-0" />
                  )}
                </button>
                {openFAQ === 3 && (
                  <div className="px-6 pb-6">
                    <p className="text-slate-300 text-lg leading-relaxed">
                      You can book as early as same day (subject to interviewer availability). Many candidates use our service just a day or two before their real interviews.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ 5 */}
              <div className="bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(4)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-white">Do I get recordings or notes?</h3>
                  {openFAQ === 4 ? (
                    <ChevronUp className="w-6 h-6 text-white flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-white flex-shrink-0" />
                  )}
                </button>
                {openFAQ === 4 && (
                  <div className="px-6 pb-6">
                    <p className="text-slate-300 text-lg leading-relaxed">
                      You'll get a detailed feedback report after your session, covering:
                    </p>
                    <ul className="text-slate-300 mt-3 ml-4 space-y-1">
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                        What went well
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                        What needs improvement
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                        Action plan to prepare better
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* FAQ 6 */}
              <div className="bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(5)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-white">What if I already gave multiple interviews?</h3>
                  {openFAQ === 5 ? (
                    <ChevronUp className="w-6 h-6 text-white flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-white flex-shrink-0" />
                  )}
                </button>
                {openFAQ === 5 && (
                  <div className="px-6 pb-6">
                    <p className="text-slate-300 text-lg leading-relaxed">
                      That's perfect. Many of our candidates come to us after 2–3 rejections. A mock helps you identify why you're failing and fix it before the next chance.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ 7 */}
              <div className="bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(6)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-white">What if I don't find value in the session?</h3>
                  {openFAQ === 6 ? (
                    <ChevronUp className="w-6 h-6 text-white flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-white flex-shrink-0" />
                  )}
                </button>
                {openFAQ === 6 && (
                  <div className="px-6 pb-6">
                    <p className="text-slate-300 text-lg leading-relaxed">
                      We're confident you'll walk away with insights, but if you truly feel you didn't get value, reach out — we'll make it right.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ 8 */}
              <div className="bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(7)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-white">Can freshers use this platform, or is it only for experienced professionals?</h3>
                  {openFAQ === 7 ? (
                    <ChevronUp className="w-6 h-6 text-white flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-white flex-shrink-0" />
                  )}
                </button>
                {openFAQ === 7 && (
                  <div className="px-6 pb-6">
                    <p className="text-slate-300 text-lg leading-relaxed">
                      Both. Freshers build confidence and learn how to handle project/HR questions. Experienced devs sharpen technical depth and practice explaining their projects clearly.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ 9 */}
              <div className="bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(8)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-white">Is my data/resume safe?</h3>
                  {openFAQ === 8 ? (
                    <ChevronUp className="w-6 h-6 text-white flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-white flex-shrink-0" />
                  )}
                </button>
                {openFAQ === 8 && (
                  <div className="px-6 pb-6">
                    <p className="text-slate-300 text-lg leading-relaxed">
                      Yes, 100%. Your details are only shared with your selected interviewer. We don't use your data for any other purpose.
                    </p>
                  </div>
                )}
              </div>
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