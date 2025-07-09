import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import InstantMatchingFlow from '@/components/InstantMatchingFlow';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { findMatchingInterviewer, scheduleInterview } from '@/services/interviewScheduling';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import MatchingLoader from '@/components/MatchingLoader';

const PaymentProcessing = () => {
  const { paymentSession, isLoading, hasSuccessfulPayment } = usePaymentStatus();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { syncCandidateToGoogleSheets } = useGoogleSheets();
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    // If no user, redirect to auth
    if (!user) {
      navigate('/auth');
      return;
    }

    // If no payment session or payment is already matched, redirect to home
    if (!isLoading && (!paymentSession || paymentSession.interview_matched)) {
      navigate('/');
      return;
    }
  }, [user, paymentSession, isLoading, navigate]);

  const handleStartMatching = async () => {
    if (!paymentSession || !user) {
      toast({
        title: "Error",
        description: "Missing payment information. Please try booking again.",
        variant: "destructive",
      });
      return;
    }

    setIsMatching(true);

    try {
      console.log('Starting matching process from payment processing page...');
      
      // Get candidate data from payment session
      const candidateData = paymentSession.candidate_data;
      
      // Find matching interviewer
      const interviewer = await findMatchingInterviewer(candidateData);
      
      if (interviewer) {
        console.log('Interviewer found, scheduling interview...');
        
        // Schedule the interview and send emails
        await scheduleInterview(
          interviewer, 
          candidateData, 
          user?.email || '',
          user?.user_metadata?.full_name || user?.email || ''
        );
        
        // Sync to Google Sheets with payment info
        const candidateDataForSheets = {
          name: user?.user_metadata?.full_name || user?.email || "Unknown",
          email: user?.email || "Unknown",
          experience: candidateData.experience,
          noticePeriod: candidateData.noticePeriod,
          targetRole: candidateData.targetRole,
          timeSlot: candidateData.timeSlot || "To be confirmed",
          resumeUploaded: candidateData.resume ? "Yes" : "No",
          resumeFileName: candidateData.resume?.name || "Not provided",
          matchedInterviewer: interviewer.company || "Unknown Company",
          paymentId: paymentSession.cashfree_payment_id || "payment_successful",
          paymentAmount: paymentSession.amount.toString(),
          submissionDate: new Date().toISOString()
        };

        await syncCandidateToGoogleSheets(candidateDataForSheets);
        
        toast({
          title: "Interview Scheduled!",
          description: "Your interview has been scheduled successfully!",
        });

        // Navigate to dashboard or success page
        navigate('/dashboard');
      } else {
        console.log('No interviewer found');
        toast({
          title: "No Interviewer Available",
          description: "We're finding the best interviewer for you! We'll contact you soon.",
        });
        
        // Keep the button visible for retry
        setIsMatching(false);
      }
    } catch (error) {
      console.error("Error processing matching:", error);
      toast({
        title: "Processing Error",
        description: "There was an issue with matching. We'll contact you soon!",
        variant: "destructive",
      });
      setIsMatching(false);
    }
  };

  if (isMatching) {
    return <MatchingLoader />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Tech Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent">
            <div 
              className="w-full h-full"
              style={{
                background: 'radial-gradient(circle at 25% 25%, rgba(156, 146, 172, 0.1) 2px, transparent 2px)',
                backgroundSize: '60px 60px'
              }}
            />
          </div>
        </div>
        
        <Navigation />
        <div className="relative z-10 flex items-center justify-center min-h-[80vh]">
          <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-slate-300 text-lg">Loading payment status...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!paymentSession || paymentSession.interview_matched) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Tech Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent">
            <div 
              className="w-full h-full"
              style={{
                background: 'radial-gradient(circle at 25% 25%, rgba(156, 146, 172, 0.1) 2px, transparent 2px)',
                backgroundSize: '60px 60px'
              }}
            />
          </div>
        </div>
        
        <Navigation />
        <div className="relative z-10 flex items-center justify-center min-h-[80vh]">
          <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <p className="text-slate-300 text-lg">No active payment session found.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Tech Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent">
          <div 
            className="w-full h-full"
            style={{
              background: 'radial-gradient(circle at 25% 25%, rgba(156, 146, 172, 0.1) 2px, transparent 2px)',
              backgroundSize: '60px 60px'
            }}
          />
        </div>
      </div>
      
      <Navigation />
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Payment <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Processing</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Please wait while we process your payment and prepare your interview matching.
            </p>
          </div>
          
          <InstantMatchingFlow onStartMatching={handleStartMatching} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentProcessing;