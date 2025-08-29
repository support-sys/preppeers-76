
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { findMatchingInterviewer, scheduleInterview } from "@/services/interviewScheduling";
import { createTemporaryReservation, releaseTemporaryReservation } from "@/utils/temporaryBlocking";

export const useBookingFlow = () => {
  const [currentStep, setCurrentStep] = useState<'form' | 'preview-match' | 'payment' | 'matching' | 'success' | 'no-match' | 'time-confirmation'>('form');
  const [formData, setFormData] = useState<any>(null);
  const [matchedInterviewer, setMatchedInterviewer] = useState<any>(null);
  const [alternativeTimeSlot, setAlternativeTimeSlot] = useState<any>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [temporaryReservationId, setTemporaryReservationId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { paymentSession, markInterviewMatched, isInterviewAlreadyMatched } = usePaymentStatus();

  const handleFormSubmit = async (data: any) => {
    // Validate required fields
    if (!data.timeSlot) {
      toast({
        title: "Time Slot Required",
        description: "Please select your preferred interview date and time.",
        variant: "destructive",
      });
      return;
    }

    console.log('Enhanced form submitted with data:', {
      currentPosition: data.currentPosition,
      experienceYears: data.experienceYears,
      skillCategories: data.skillCategories,
      specificSkills: data.specificSkills,
      skillsToPractice: data.skillsToPractice,
      timeSlot: data.timeSlot,
      selectedPlan: data.selectedPlan,
      interviewDuration: data.interviewDuration,
      amount: data.amount
    });
    setFormData(data);
    setIsLoading(true);
    
    // Reset previous state for fresh booking
    setMatchedInterviewer(null);
    setAlternativeTimeSlot(null);
    
    try {
      console.log('Finding matching interviewer preview...');
      const interviewer = await findMatchingInterviewer(data, user?.id);
      
      if (interviewer) {
        console.log('Preview interviewer found:', interviewer);
        setMatchedInterviewer(interviewer);
        
        // Always proceed to payment for new bookings - no time confirmation needed for fresh bookings
        setCurrentStep('preview-match');
      } else {
        console.log('No interviewer found for preview');
        setCurrentStep('no-match');
        toast({
          title: "No Interviewer Available",
          description: "We're finding the best interviewer for you!",
        });
      }
    } catch (error) {
      console.error("Error finding interviewer preview:", error);
      toast({
        title: "Error",
        description: "Unable to find an interviewer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToPayment = async (timeSlot?: string) => {
    if (timeSlot) {
      setSelectedTimeSlot(timeSlot);
      // Update formData with selected time slot
      setFormData(prev => ({ ...prev, selectedTimeSlot: timeSlot }));
    }
    
    if (!matchedInterviewer?.id || !user?.id) {
      toast({
        title: "Error",
        description: "Missing interviewer or user information",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create temporary reservation to secure the time slot
      const reservationId = await createTemporaryReservation(
        matchedInterviewer.id,
        timeSlot || selectedTimeSlot,
        user.id,
        formData.interviewDuration || 60
      );
      
      setTemporaryReservationId(reservationId);
      console.log('🔒 Created temporary reservation:', reservationId);
      
      // Update formData with matched interviewer data
      setFormData(prev => ({ 
        ...prev, 
        matchedInterviewer: matchedInterviewer,
        selectedTimeSlot: timeSlot || prev.selectedTimeSlot,
        interviewer_id: matchedInterviewer?.id,
        interviewer_user_id: matchedInterviewer?.user_id,
        selected_time_slot: timeSlot || prev.selectedTimeSlot || prev.timeSlot,
        selected_date: timeSlot ? new Date(timeSlot).toISOString().split('T')[0] : null,
        plan_duration: prev.interviewDuration || 60,
        match_score: matchedInterviewer?.matchScore || 0,
        selected_plan: prev.selectedPlan || 'professional',
        interview_duration: prev.interviewDuration || 60
      }));
      
      setCurrentStep('payment');
      
    } catch (error) {
      console.error('❌ Failed to create temporary reservation:', error);
      toast({
        title: "Time Slot Unavailable",
        description: error instanceof Error ? error.message : "This time slot is no longer available. Please select a different time.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    console.log('Payment success callback called:', paymentData);
    setIsLoading(true);
    
    try {
      // Now finalize the booking with the already matched interviewer
      if (matchedInterviewer && formData) {
        // Use selected time slot if available, otherwise use original formData
        const scheduleData = selectedTimeSlot 
          ? { ...formData, timeSlot: selectedTimeSlot }
          : formData;
          
        await scheduleInterview(
          matchedInterviewer, 
          scheduleData, 
          user?.email || '',
          user?.user_metadata?.full_name || user?.email || '',
          scheduleData.interviewDuration || 60,
          user?.id
        );
        
        if (paymentData?.sessionId) {
          await markInterviewMatched(paymentData.sessionId);
        }
        
        setCurrentStep('success');
        toast({
          title: "Interview Scheduled! 🎉",
          description: "Your interview has been scheduled successfully! Check your dashboard for details.",
        });
      } else {
        toast({
          title: "Payment Successful!",
          description: "Processing your interview booking...",
        });
      }
    } catch (error) {
      console.error("Error finalizing booking:", error);
      toast({
        title: "Booking Error",
        description: "Payment successful but booking failed. We'll contact you soon!",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentError = async (error: any) => {
    console.error("Payment failed:", error);
    
    // Release temporary reservation if payment fails
    if (temporaryReservationId) {
      try {
        await releaseTemporaryReservation(temporaryReservationId);
        setTemporaryReservationId(null);
        console.log('🔓 Released temporary reservation due to payment failure');
      } catch (releaseError) {
        console.error('❌ Failed to release temporary reservation:', releaseError);
      }
    }
    
    toast({
      title: "Payment Failed",
      description: "Please try again or contact support if the issue persists.",
      variant: "destructive",
    });
  };

  const handleStartMatching = async () => {
    if (!paymentSession) {
      toast({
        title: "Error",
        description: "No valid payment session found. Please complete payment first.",
        variant: "destructive",
      });
      return;
    }

    // Check if interview is already matched
    if (isInterviewAlreadyMatched) {
      toast({
        title: "Interview Already Scheduled",
        description: "Your interview has already been scheduled. Check your email for details.",
      });
      setCurrentStep('success');
      return;
    }

    console.log('Starting matching process...');
    setCurrentStep('matching');
    setIsLoading(true);

    try {
      console.log('Finding matching interviewer...');
      
              const interviewer = await findMatchingInterviewer(paymentSession.candidate_data, user?.id);
      
      if (interviewer) {
        console.log('Interviewer found:', interviewer);
        setMatchedInterviewer(interviewer);
        
        // Check if time slots match exactly or if we need confirmation
        const candidatePreferredTime = paymentSession.candidate_data.timeSlot;
        const hasExactTimeMatch = interviewer.matchReasons?.includes('Available at preferred time');
        
        if (!hasExactTimeMatch && candidatePreferredTime) {
          // Show alternative time slot for confirmation
          setAlternativeTimeSlot({
            candidatePreferred: candidatePreferredTime,
            interviewerAvailable: interviewer.alternativeTimeSlots?.[0] || 'Next available slot'
          });
          setCurrentStep('time-confirmation');
          return;
        }
        
        // Direct scheduling for exact matches
        await scheduleInterview(
          interviewer, 
          paymentSession.candidate_data, 
          user?.email || '',
          user?.user_metadata?.full_name || user?.email || '',
          paymentSession.candidate_data.interviewDuration || 60,
          user?.id
        );
        
        await markInterviewMatched(paymentSession.id);
        
        setCurrentStep('success');
        document.title = 'Interview Scheduled Successfully!';
        toast({
          title: "Interview Scheduled! 🎉",
          description: "Your interview has been scheduled successfully! Check your dashboard for details.",
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

  const handleAcceptAlternativeTime = async () => {
    if (!matchedInterviewer || !paymentSession) return;
    
    setIsLoading(true);
    try {
      await scheduleInterview(
        matchedInterviewer, 
        paymentSession.candidate_data, 
        user?.email || '',
        user?.user_metadata?.full_name || user?.email || '',
        paymentSession.candidate_data.interviewDuration || 60,
        user?.id
      );
      
      await markInterviewMatched(paymentSession.id);
      
      setCurrentStep('success');
      toast({
        title: "Interview Scheduled! 🎉",
        description: "Your interview has been scheduled successfully! Check your dashboard for details.",
      });
    } catch (error) {
      console.error("Error scheduling interview:", error);
      toast({
        title: "Error",
        description: "Failed to schedule interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWaitForBetterMatch = () => {
    setCurrentStep('no-match');
    toast({
      title: "Looking for Better Match",
      description: "We'll notify you when an interviewer is available for your preferred time!",
    });
  };

  const handleTryAgain = () => {
    setCurrentStep('form');
    setFormData(null);
    setMatchedInterviewer(null);
    setAlternativeTimeSlot(null);
    setSelectedTimeSlot('');
    document.title = 'Book Your Mock Interview';
  };

  return {
    currentStep,
    formData,
    matchedInterviewer,
    alternativeTimeSlot,
    selectedTimeSlot,
    isLoading,
    handleFormSubmit,
    handleProceedToPayment,
    handlePaymentSuccess,
    handlePaymentError,
    handleStartMatching,
    handleAcceptAlternativeTime,
    handleWaitForBetterMatch,
    handleTryAgain
  };
};
