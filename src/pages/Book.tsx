
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppChat from "@/components/WhatsAppChat";
import CandidateRegistrationForm from "@/components/CandidateRegistrationForm";
import CashfreePayment from "@/components/CashfreePayment";
import InstantMatchingButton from "@/components/InstantMatchingButton";
import MatchingLoader from "@/components/MatchingLoader";
import InterviewScheduledSuccess from "@/components/InterviewScheduledSuccess";
import NoMatchFound from "@/components/NoMatchFound";
import ProcessOverview from "@/components/ProcessOverview";
import { useToast } from "@/hooks/use-toast";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { useAuth } from "@/contexts/AuthContext";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { findMatchingInterviewer, scheduleInterview } from "@/services/interviewScheduling";

const Book = () => {
  const [currentStep, setCurrentStep] = useState<'form' | 'payment' | 'matching' | 'success' | 'no-match'>('form');
  const [formData, setFormData] = useState<any>(null);
  const [matchedInterviewer, setMatchedInterviewer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentAmount] = useState<number>(999);
  const { toast } = useToast();
  const { syncCandidateToGoogleSheets } = useGoogleSheets();
  const { user } = useAuth();
  const { paymentSession, hasSuccessfulPayment, markInterviewMatched, isLoading: paymentLoading } = usePaymentStatus();

  // Check if we should show the form or payment based on existing data
  useEffect(() => {
    if (hasSuccessfulPayment && paymentSession) {
      setFormData(paymentSession.candidate_data);
      // Don't automatically set to payment step - let user see the instant matching button
    }
  }, [hasSuccessfulPayment, paymentSession]);

  const handleFormSubmit = async (data: any) => {
    console.log('Form submitted with data:', data);
    setFormData(data);
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('Payment success callback called:', paymentData);
    toast({
      title: "Payment Successful!",
      description: "You can now start matching with interviewers.",
    });
    // The payment status will be updated automatically and the button will appear
  };

  const handlePaymentError = (error: any) => {
    console.error("Payment failed:", error);
    toast({
      title: "Payment Failed",
      description: "Please try again or contact support if the issue persists.",
      variant: "destructive",
    });
  };

  const handleStartMatching = async () => {
    if (!paymentSession) return;

    console.log('Starting matching process...');
    setCurrentStep('matching');
    setIsLoading(true);

    try {
      console.log('Finding matching interviewer...');
      
      // Find matching interviewer
      const interviewer = await findMatchingInterviewer(paymentSession.candidate_data);
      
      if (interviewer) {
        console.log('Interviewer found, scheduling interview...');
        setMatchedInterviewer(interviewer);
        
        // Schedule the interview and send emails
        await scheduleInterview(
          interviewer, 
          paymentSession.candidate_data, 
          user?.email || '',
          user?.user_metadata?.full_name || user?.email || ''
        );
        
        // Sync to Google Sheets with payment info
        const candidateDataForSheets = {
          name: user?.user_metadata?.full_name || user?.email || "Unknown",
          email: user?.email || "Unknown",
          experience: paymentSession.candidate_data.experience,
          noticePeriod: paymentSession.candidate_data.noticePeriod,
          targetRole: paymentSession.candidate_data.targetRole,
          timeSlot: paymentSession.candidate_data.timeSlot || "To be confirmed",
          resumeUploaded: paymentSession.candidate_data.resume ? "Yes" : "No",
          resumeFileName: paymentSession.candidate_data.resume?.name || "Not provided",
          matchedInterviewer: interviewer.company || "Unknown Company",
          paymentId: paymentSession.id,
          paymentAmount: paymentSession.amount.toString(),
          submissionDate: new Date().toISOString()
        };

        await syncCandidateToGoogleSheets(candidateDataForSheets);
        
        // Mark interview as matched in database
        await markInterviewMatched(paymentSession.id);
        
        setCurrentStep('success');
        document.title = 'Interview Scheduled Successfully!';
        toast({
          title: "Interview Scheduled!",
          description: "Your interview has been scheduled successfully!",
        });
      } else {
        console.log('No interviewer found, showing no-match state');
        setCurrentStep('no-match');
        document.title = 'Finding Your Interviewer...';
        toast({
          title: "No Interviewer Available",
          description: "We're finding the best interviewer for you!",
        });
      }
    } catch (error) {
      console.error("Error processing matching:", error);
      toast({
        title: "Processing Error",
        description: "There was an issue with matching. We'll contact you soon!",
        variant: "destructive",
      });
      setCurrentStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setCurrentStep('form');
    setFormData(null);
    setMatchedInterviewer(null);
    document.title = 'Book Your Mock Interview';
  };

  // Render different states
  if (currentStep === 'success') {
    return (
      <InterviewScheduledSuccess
        matchedInterviewer={matchedInterviewer}
        formData={formData}
        userEmail={user?.email}
      />
    );
  }

  if (currentStep === 'no-match') {
    return (
      <NoMatchFound
        formData={formData}
        onTryAgain={handleTryAgain}
      />
    );
  }

  if (currentStep === 'matching') {
    return <MatchingLoader />;
  }

  if (currentStep === 'payment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navigation />
        
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                Complete Your Payment
              </h1>
              <p className="text-xl text-slate-300">
                Secure your mock interview session for just ₹999
              </p>
            </div>

            <CashfreePayment
              amount={999}
              candidateData={formData}
              userEmail={user?.email || ''}
              userName={user?.user_metadata?.full_name || user?.email || ''}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        </div>
        
        <WhatsAppChat />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Book Your Mock Interview
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              {hasSuccessfulPayment 
                ? "Your payment is confirmed! Click below to find your perfect interviewer."
                : "Fill out the form below and we'll match you with an experienced interviewer instantly."
              }
            </p>
          </div>

          {/* Show Instant Matching Button if payment is successful */}
          {hasSuccessfulPayment && !paymentLoading && (
            <div className="mb-8">
              <InstantMatchingButton
                onStartMatching={handleStartMatching}
                isLoading={isLoading}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {!hasSuccessfulPayment && (
                <CandidateRegistrationForm
                  onSubmit={handleFormSubmit}
                  isLoading={isLoading}
                />
              )}
              
              {hasSuccessfulPayment && (
                <div className="bg-white/10 backdrop-blur-lg border-white/20 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Your Interview Details</h2>
                  <div className="space-y-3 text-slate-300">
                    <div className="flex justify-between">
                      <span>Target Role:</span>
                      <span className="text-white">{paymentSession?.candidate_data?.targetRole}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Experience:</span>
                      <span className="text-white">{paymentSession?.candidate_data?.experience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Notice Period:</span>
                      <span className="text-white">{paymentSession?.candidate_data?.noticePeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount Paid:</span>
                      <span className="text-green-400">₹{paymentSession?.amount}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <ProcessOverview />
          </div>
        </div>
      </div>
      
      <WhatsAppChat />
      <Footer />
    </div>
  );
};

export default Book;
