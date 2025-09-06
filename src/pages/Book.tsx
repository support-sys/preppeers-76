
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppChat from "@/components/WhatsAppChat";
import BookingHeader from "@/components/BookingHeader";
import BookingStepsGuide from "@/components/BookingStepsGuide";
import CandidateRegistrationForm from "@/components/CandidateRegistrationForm";
import InterviewerMatchingPage from "@/components/InterviewerMatchingPage";
import PlanSelection from "@/components/PlanSelection";
import InstantMatchingButton from "@/components/InstantMatchingButton";
import PaymentDetails from "@/components/PaymentDetails";
import MatchingLoader from "@/components/MatchingLoader";
import InterviewerPreview from "@/components/InterviewerPreview";
import TimeSlotConfirmation from "@/components/TimeSlotConfirmation";
import PaymentPage from "@/components/PaymentPage";
import { findMatchingInterviewer } from "@/services/interviewScheduling";
import { supabase } from "@/integrations/supabase/client";
import InterviewScheduledSuccess from "@/components/InterviewScheduledSuccess";
import NoMatchFound from "@/components/NoMatchFound";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { useBookingFlow } from "@/hooks/useBookingFlow";

const Book = () => {
  const { user } = useAuth();
  const { paymentSession, hasSuccessfulPayment, isInterviewAlreadyMatched, isLoading: paymentLoading } = usePaymentStatus();
  const [currentFormStep, setCurrentFormStep] = useState<'form' | 'interviewer-matching' | 'plan-selection'>('form');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('essential');
  const [candidateFormData, setCandidateFormData] = useState<any>(null);
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

  // New flow handlers
  const handleFormSubmitNew = (data: any) => {
    // Store candidate data for the new flow
    setCandidateFormData(data);
    // Call the original form submit to save data
    handleFormSubmit(data);
    setCurrentFormStep('interviewer-matching');
  };

  const handleInterviewerFound = (interviewer: any) => {
    setCurrentFormStep('plan-selection');
  };

  const handleNoMatch = () => {
    setCurrentFormStep('form');
  };

  const handlePlanContinue = (slot?: string, planId?: string) => {
    if (slot) {
      setSelectedSlot(slot);
    }
    if (planId) {
      setSelectedPlan(planId);
    }
    // Proceed to payment with the selected plan and slot
    handleProceedToPayment(slot, planId);
  };

  const handleGoBack = () => {
    if (currentFormStep === 'interviewer-matching') {
      setCurrentFormStep('form');
    } else if (currentFormStep === 'plan-selection') {
      setCurrentFormStep('interviewer-matching');
    }
  };

  // Check if we should show the form or payment based on existing data
  useEffect(() => {
    // Only auto-trigger matching if user explicitly clicks the instant matching button
    // Don't auto-redirect users who want to make new bookings
    if (isInterviewAlreadyMatched && currentStep === 'matching') {
      // This will trigger the success state only when user explicitly starts matching
      handleStartMatching();
    }
  }, [isInterviewAlreadyMatched, currentStep]);

  // Render different states - Only use new flow
  if (currentStep === 'success') {
    return (
      <InterviewScheduledSuccess
        matchedInterviewer={matchedInterviewer}
        formData={formData}
        userEmail={user?.email}
      />
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

  if (currentStep === 'matching') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navigation />
        
        <div className="container mx-auto px-3 sm:px-4 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto">
            <BookingHeader hasSuccessfulPayment={hasSuccessfulPayment} />
            <MatchingLoader embedded={true} />
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
      
      <div className="container mx-auto px-3 sm:px-4 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <BookingHeader hasSuccessfulPayment={hasSuccessfulPayment} />

          {/* Step-by-Step Guide - Only show on initial form step */}
          {currentStep === 'form' && currentFormStep === 'form' && <BookingStepsGuide />}

          {/* Show Instant Matching Button if payment is successful but no interview scheduled yet */}
          {hasSuccessfulPayment && !paymentLoading && !isInterviewAlreadyMatched && (
            <div className="mb-6 sm:mb-8">
              <InstantMatchingButton
                onStartMatching={handleStartMatching}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Main Content - Full Width */}
          <div className="w-full">
            {/* New Flow: Form → Interviewer → Plan+Slot → Payment */}
            {currentFormStep === 'form' && (
              <CandidateRegistrationForm
                onSubmit={handleFormSubmitNew}
                isLoading={isLoading}
                onStepChange={setCurrentFormStep}
              />
            )}

            {currentFormStep === 'interviewer-matching' && candidateFormData && (
              <InterviewerMatchingPage
                formData={candidateFormData}
                onInterviewerFound={handleInterviewerFound}
                onNoMatch={handleNoMatch}
                onGoBack={handleGoBack}
              />
            )}

            {currentFormStep === 'plan-selection' && (
              <PlanSelection
                selectedPlan={selectedPlan}
                onPlanSelect={setSelectedPlan}
                onContinue={handlePlanContinue}
                matchedInterviewer={matchedInterviewer}
                selectedSlot={selectedSlot}
                onSlotSelect={setSelectedSlot}
              />
            )}
            
            {hasSuccessfulPayment && paymentSession && (
              <div className="mt-6 sm:mt-8">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Previous Payment Session</h3>
                <PaymentDetails paymentSession={paymentSession} />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <WhatsAppChat />
      <Footer />
    </div>
  );
};

export default Book;
