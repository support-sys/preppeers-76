
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
import InterviewerPreview from "@/components/InterviewerPreview";
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
    handleProceedToPayment,
    handlePaymentSuccess,
    handlePaymentError,
    handleStartMatching,
    handleAcceptAlternativeTime,
    handleWaitForBetterMatch,
    handleTryAgain
  } = useBookingFlow();

  // Check if we should show the form or payment based on existing data
  useEffect(() => {
    // Only auto-trigger matching if user explicitly clicks the instant matching button
    // Don't auto-redirect users who want to make new bookings
    if (isInterviewAlreadyMatched && currentStep === 'matching') {
      // This will trigger the success state only when user explicitly starts matching
      handleStartMatching();
    }
  }, [isInterviewAlreadyMatched, currentStep]);

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

  if (currentStep === 'preview-match') {
    return (
      <InterviewerPreview
        matchedInterviewer={matchedInterviewer}
        alternativeTimeSlot={alternativeTimeSlot}
        onProceedToPayment={handleProceedToPayment}
        onGoBack={handleTryAgain}
        formData={formData}
      />
    );
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

          {/* Show Instant Matching Button if payment is successful but no interview scheduled yet */}
          {hasSuccessfulPayment && !paymentLoading && !isInterviewAlreadyMatched && (
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
              {/* Always show the registration form to allow multiple bookings */}
              <CandidateRegistrationForm
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
              />
              
              {hasSuccessfulPayment && paymentSession && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Previous Payment Session</h3>
                  <PaymentDetails paymentSession={paymentSession} />
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
