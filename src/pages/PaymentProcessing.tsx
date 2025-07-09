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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-slate-600">Loading payment status...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!paymentSession || paymentSession.interview_matched) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <p className="text-slate-600">No active payment session found.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Payment Processing
            </h1>
            <p className="text-slate-600">
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