
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppChat from "@/components/WhatsAppChat";
import CandidateRegistrationForm from "@/components/CandidateRegistrationForm";
import CashfreePayment from "@/components/CashfreePayment";
import MatchingLoader from "@/components/MatchingLoader";
import InterviewScheduledSuccess from "@/components/InterviewScheduledSuccess";
import NoMatchFound from "@/components/NoMatchFound";
import ProcessOverview from "@/components/ProcessOverview";
import { useToast } from "@/hooks/use-toast";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { useAuth } from "@/contexts/AuthContext";
import { findMatchingInterviewer, scheduleInterview } from "@/services/interviewScheduling";

const Book = () => {
  const [currentStep, setCurrentStep] = useState<'form' | 'payment' | 'matching' | 'success' | 'no-match'>('form');
  const [formData, setFormData] = useState<any>(null);
  const [matchedInterviewer, setMatchedInterviewer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { syncCandidateToGoogleSheets } = useGoogleSheets();
  const { user } = useAuth();

  // Check for payment success on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success' && formData) {
      console.log('Payment successful, starting matching process...');
      handlePaymentSuccess({ payment_id: 'cashfree_redirect_success' });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [formData]);

  const handleFormSubmit = async (data: any) => {
    setFormData(data);
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    console.log('Payment successful:', paymentData);
    setCurrentStep('matching');
    setIsLoading(true);

    try {
      console.log('Starting matching process after payment...');
      
      // Find matching interviewer
      const interviewer = await findMatchingInterviewer(formData);
      
      if (interviewer) {
        console.log('Interviewer found, scheduling interview...');
        setMatchedInterviewer(interviewer);
        
        // Schedule the interview and send emails
        await scheduleInterview(
          interviewer, 
          formData, 
          user?.email || '',
          user?.user_metadata?.full_name || user?.email || ''
        );
        
        // Sync to Google Sheets with payment info
        const candidateData = {
          name: user?.user_metadata?.full_name || user?.email || "Unknown",
          email: user?.email || "Unknown",
          experience: formData.experience,
          noticePeriod: formData.noticePeriod,
          targetRole: formData.targetRole,
          timeSlot: formData.timeSlot || "To be confirmed",
          resumeUploaded: formData.resume ? "Yes" : "No",
          resumeFileName: formData.resume?.name || "Not provided",
          matchedInterviewer: interviewer.company || "Unknown Company",
          paymentId: paymentData.payment_id || "N/A",
          paymentAmount: "999",
          submissionDate: new Date().toISOString()
        };

        await syncCandidateToGoogleSheets(candidateData);
        
        setCurrentStep('success');
        toast({
          title: "Interview Scheduled!",
          description: "Payment confirmed and interview scheduled successfully!",
        });
      } else {
        console.log('No interviewer found, showing no-match state');
        setCurrentStep('no-match');
        toast({
          title: "No Interviewer Available",
          description: "Payment confirmed. We're finding the best interviewer for you!",
        });
      }
    } catch (error) {
      console.error("Error processing booking after payment:", error);
      toast({
        title: "Processing Error",
        description: "Payment was successful but there was an issue scheduling. We'll contact you soon!",
        variant: "destructive",
      });
      setCurrentStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error("Payment failed:", error);
    toast({
      title: "Payment Failed",
      description: "Please try again or contact support if the issue persists.",
      variant: "destructive",
    });
    setCurrentStep('form');
  };

  const handleTryAgain = () => {
    setCurrentStep('form');
    setFormData(null);
    setMatchedInterviewer(null);
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
              Fill out the form below and we'll match you with an experienced interviewer instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <CandidateRegistrationForm
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
              />
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
