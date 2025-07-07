
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

  // Check for payment success on page load and restore form data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const isNewWindow = urlParams.get('newWindow');
    
    console.log('Page loaded, checking for payment status:', paymentStatus);
    console.log('Is new window:', isNewWindow);
    console.log('Current URL:', window.location.href);
    
    if (paymentStatus === 'success') {
      console.log('Payment success detected from URL parameter');
      
      // Check if payment was in progress
      const paymentInProgress = sessionStorage.getItem('paymentInProgress');
      console.log('Payment in progress flag:', paymentInProgress);
      
      // Retrieve stored form data from sessionStorage
      const storedFormData = sessionStorage.getItem('candidateFormData');
      console.log('Stored form data found:', !!storedFormData);
      
      if (storedFormData) {
        try {
          const parsedFormData = JSON.parse(storedFormData);
          console.log('Successfully parsed stored form data:', parsedFormData);
          setFormData(parsedFormData);
          
          // Clean up payment in progress flag
          sessionStorage.removeItem('paymentInProgress');
          
          // If this is a new window (from payment redirect), show matching immediately
          if (isNewWindow === 'true') {
            console.log('Payment successful in new window - starting matching process...');
            // Change the page title to indicate matching is in progress
            document.title = 'Finding Your Perfect Interviewer...';
            
            // Start matching process immediately
            handlePaymentSuccess({ payment_id: 'cashfree_redirect_success' }, parsedFormData);
            
            // Clean up stored data after successful processing
            sessionStorage.removeItem('candidateFormData');
            
            // Clean up URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            // Regular flow - start matching
            handlePaymentSuccess({ payment_id: 'cashfree_redirect_success' }, parsedFormData);
            sessionStorage.removeItem('candidateFormData');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error) {
          console.error('Error parsing stored form data:', error);
          toast({
            title: "Error",
            description: "There was an issue processing your payment. Please try again.",
            variant: "destructive",
          });
          // Clean up on error
          sessionStorage.removeItem('candidateFormData');
          sessionStorage.removeItem('paymentInProgress');
          setCurrentStep('form');
        }
      } else {
        console.log('No stored form data found after payment success');
        toast({
          title: "Error",
          description: "Payment was successful but form data was lost. Please try booking again.",
          variant: "destructive",
        });
        // Clean up on error
        sessionStorage.removeItem('paymentInProgress');
        setCurrentStep('form');
      }
    } else {
      // Check if there's any leftover session data and clean it up
      const hasStoredData = sessionStorage.getItem('candidateFormData');
      const paymentInProgress = sessionStorage.getItem('paymentInProgress');
      
      if (hasStoredData && !paymentInProgress) {
        console.log('Cleaning up orphaned session data');
        sessionStorage.removeItem('candidateFormData');
      }
    }
  }, []);

  const handleFormSubmit = async (data: any) => {
    console.log('Form submitted with data:', data);
    setFormData(data);
    
    // Store form data in sessionStorage before payment (backup)
    sessionStorage.setItem('candidateFormData', JSON.stringify(data));
    console.log('Form data stored in session storage');
    
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = async (paymentData: any, candidateData?: any) => {
    const dataToUse = candidateData || formData;
    console.log('handlePaymentSuccess called with:');
    console.log('- Payment data:', paymentData);
    console.log('- Candidate data to use:', dataToUse);
    
    if (!dataToUse) {
      console.error('No candidate data available for matching');
      toast({
        title: "Error",
        description: "Missing candidate information. Please try booking again.",
        variant: "destructive",
      });
      setCurrentStep('form');
      return;
    }

    console.log('Setting step to matching and starting process...');
    setCurrentStep('matching');
    setIsLoading(true);

    try {
      console.log('Starting matching process after payment...');
      
      // Find matching interviewer
      const interviewer = await findMatchingInterviewer(dataToUse);
      
      if (interviewer) {
        console.log('Interviewer found, scheduling interview...');
        setMatchedInterviewer(interviewer);
        
        // Schedule the interview and send emails
        await scheduleInterview(
          interviewer, 
          dataToUse, 
          user?.email || '',
          user?.user_metadata?.full_name || user?.email || ''
        );
        
        // Sync to Google Sheets with payment info
        const candidateDataForSheets = {
          name: user?.user_metadata?.full_name || user?.email || "Unknown",
          email: user?.email || "Unknown",
          experience: dataToUse.experience,
          noticePeriod: dataToUse.noticePeriod,
          targetRole: dataToUse.targetRole,
          timeSlot: dataToUse.timeSlot || "To be confirmed",
          resumeUploaded: dataToUse.resume ? "Yes" : "No",
          resumeFileName: dataToUse.resume?.name || "Not provided",
          matchedInterviewer: interviewer.company || "Unknown Company",
          paymentId: paymentData.payment_id || "N/A",
          paymentAmount: "999",
          submissionDate: new Date().toISOString()
        };

        await syncCandidateToGoogleSheets(candidateDataForSheets);
        
        setCurrentStep('success');
        // Update page title for success
        document.title = 'Interview Scheduled Successfully!';
        toast({
          title: "Interview Scheduled!",
          description: "Payment confirmed and interview scheduled successfully!",
        });
      } else {
        console.log('No interviewer found, showing no-match state');
        setCurrentStep('no-match');
        document.title = 'Finding Your Interviewer...';
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
    // Clean up stored data on payment failure
    sessionStorage.removeItem('candidateFormData');
    sessionStorage.removeItem('paymentInProgress');
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
    // Clean up any stored data
    sessionStorage.removeItem('candidateFormData');
    sessionStorage.removeItem('paymentInProgress');
    // Reset page title
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
