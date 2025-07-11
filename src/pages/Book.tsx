
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppChat from "@/components/WhatsAppChat";
import CandidateRegistrationForm from "@/components/CandidateRegistrationForm";
import InstantMatchingButton from "@/components/InstantMatchingButton";
import MatchingLoader from "@/components/MatchingLoader";
import InterviewScheduledSuccess from "@/components/InterviewScheduledSuccess";
import NoMatchFound from "@/components/NoMatchFound";
import ProcessOverview from "@/components/ProcessOverview";
import BookingHeader from "@/components/BookingHeader";
import PaymentDetails from "@/components/PaymentDetails";
import PaymentPage from "@/components/PaymentPage";
import TimeSlotConfirmation from "@/components/TimeSlotConfirmation";
import { useAuth } from "@/contexts/AuthContext";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { useBookingFlow } from "@/hooks/useBookingFlow";

const Book = () => {
  const { user } = useAuth();
  const { paymentSession, hasSuccessfulPayment, isInterviewAlreadyMatched, isLoading: paymentLoading } = usePaymentStatus();
  const {
    currentStep,
    formData,
    matchedInterviewer,
    alternativeTimeSlot,
    isLoading,
    handleFormSubmit,
    handlePaymentSuccess,
    handlePaymentError,
    handleStartMatching,
    handleAcceptAlternativeTime,
    handleWaitForBetterMatch,
    handleTryAgain
  } = useBookingFlow();

  // Check if we should show the form or payment based on existing data
  useEffect(() => {
    if (isInterviewAlreadyMatched) {
      // If interview is already matched, show success state immediately
      handleStartMatching(); // This will trigger the success state
    }
  }, [isInterviewAlreadyMatched]);

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

  if (currentStep === 'time-confirmation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <TimeSlotConfirmation
            matchedInterviewer={matchedInterviewer}
            alternativeTimeSlot={alternativeTimeSlot}
            onAccept={handleAcceptAlternativeTime}
            onWaitForBetter={handleWaitForBetterMatch}
            isLoading={isLoading}
          />
        </div>
        <Footer />
      </div>
    );
  }

  if (currentStep === 'payment') {
    return (
      <PaymentPage
        formData={formData}
        userEmail={user?.email || ''}
        userName={user?.user_metadata?.full_name || user?.email || ''}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <BookingHeader hasSuccessfulPayment={hasSuccessfulPayment} />

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
              
              {hasSuccessfulPayment && paymentSession && (
                <PaymentDetails paymentSession={paymentSession} />
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
