
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppChat from "@/components/WhatsAppChat";
import CandidateRegistrationForm from "@/components/CandidateRegistrationForm";
import CashfreePayment from "@/components/CashfreePayment";
import PaymentSuccessMessage from "@/components/PaymentSuccessMessage";
import MatchingLoader from "@/components/MatchingLoader";
import InterviewScheduledSuccess from "@/components/InterviewScheduledSuccess";
import NoMatchFound from "@/components/NoMatchFound";
import ProcessOverview from "@/components/ProcessOverview";
import { useToast } from "@/hooks/use-toast";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { useAuth } from "@/contexts/AuthContext";
import { findMatchingInterviewer, scheduleInterview } from "@/services/interviewScheduling";

const Book = () => {
  const [currentStep, setCurrentStep] = useState<'form' | 'payment' | 'payment-success' | 'matching' | 'success' | 'no-match'>('form');
  const [formData, setFormData] = useState<any>(null);
  const [matchedInterviewer, setMatchedInterviewer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(999);
  const { toast } = useToast();
  const { syncCandidateToGoogleSheets } = useGoogleSheets();
  const { user } = useAuth();

  // Check for payment success on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    console.log('Page loaded, checking for payment status:', paymentStatus);
    console.log('Current URL:', window.location.href);
    
    if (paymentStatus === 'success') {
      console.log('Payment success detected from URL parameter');
      
      // Retrieve stored data from sessionStorage
      const storedFormData = sessionStorage.getItem('candidateFormData');
      const storedAmount = sessionStorage.getItem('paymentAmount');
      const storedUserEmail = sessionStorage.getItem('userEmail');
      const storedUserName = sessionStorage.getItem('userName');
      
      console.log('Stored form data found:', !!storedFormData);
      
      if (storedFormData && storedAmount) {
        try {
          const parsedFormData = JSON.parse(storedFormData);
          console.log('Successfully parsed stored form data:', parsedFormData);
          
          setFormData(parsedFormData);
          setPaymentAmount(parseInt(storedAmount));
          
          // Set payment success flag for homepage button
          localStorage.setItem('pendingInterviewMatching', 'true');
          localStorage.setItem('candidateFormData', JSON.stringify(parsedFormData));
          localStorage.setItem('paymentAmount', storedAmount);
          
          // Show payment success message
          setCurrentStep('payment-success');
          
          // Clean up URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          
          toast({
            title: "Payment Successful!",
            description: "Your payment has been processed. Click the button to start matching.",
          });
        } catch (error) {
          console.error('Error parsing stored form data:', error);
          toast({
            title: "Error",
            description: "There was an issue processing your payment. Please try again.",
            variant: "destructive",
          });
          setCurrentStep('form');
        }
      } else {
        console.log('No stored form data found after payment success');
        toast({
          title: "Error",
          description: "Payment was successful but form data was lost. Please try booking again.",
          variant: "destructive",
        });
        setCurrentStep('form');
      }
      
      // Clean up session storage
      sessionStorage.removeItem('candidateFormData');
      sessionStorage.removeItem('paymentAmount');
      sessionStorage.removeItem('userEmail');
      sessionStorage.removeItem('userName');
    }
  }, []);

  const handleFormSubmit = async (data: any) => {
    console.log('Form submitted with data:', data);
    setFormData(data);
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('Payment success callback called:', paymentData);
    // This will be handled by the URL redirect now
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

  const handleStartMatching = async () => {
    console.log('Starting matching process...');
    setCurrentStep('matching');
    setIsLoading(true);

    try {
      console.log('Finding matching interviewer...');
      
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
        const candidateDataForSheets = {
          name: user?.user_metadata?.full_name || user?.email || "Unknown",
          email: user?.email || "Unknown",
          experience: formData.experience,
          noticePeriod: formData.noticePeriod,
          targetRole: formData.targetRole,
          timeSlot: formData.timeSlot || "To be confirmed",
          resumeUploaded: formData.resume ? "Yes" : "No",
          resumeFileName: formData.resume?.name || "Not provided",
          matchedInterviewer: interviewer.company || "Unknown Company",
          paymentId: "payment_successful",
          paymentAmount: paymentAmount.toString(),
          submissionDate: new Date().toISOString()
        };

        await syncCandidateToGoogleSheets(candidateDataForSheets);
        
        // Clear the pending matching flag
        localStorage.removeItem('pendingInterviewMatching');
        localStorage.removeItem('candidateFormData');
        localStorage.removeItem('paymentAmount');
        
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
      setCurrentStep('payment-success');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setCurrentStep('form');
    setFormData(null);
    setMatchedInterviewer(null);
    // Clear any stored data
    localStorage.removeItem('pendingInterviewMatching');
    localStorage.removeItem('candidateFormData');
    localStorage.removeItem('paymentAmount');
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

  if (currentStep === 'payment-success') {
    return (
      <PaymentSuccessMessage
        amount={paymentAmount}
        onStartMatching={handleStartMatching}
      />
    );
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
