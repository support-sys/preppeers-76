
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

  // Helper function to parse human-readable time slot to date
  const parseTimeSlotToDate = (timeSlot: string): string | null => {
    try {
      // Handle format: "Monday, 08/09/2025 17:00-17:30"
      const match = timeSlot.match(/(\w+), (\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
      if (match) {
        const [, day, date, month, year, hour, minute] = match;
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(date), parseInt(hour), parseInt(minute));
        return dateObj.toISOString().split('T')[0];
      }
      return null;
    } catch (error) {
      console.error('Error parsing time slot:', error);
      return null;
    }
  };

  // Helper function to extract duration from time slot string
  const extractDurationFromTimeSlot = (timeSlot: string): number => {
    try {
      // Handle format: "Wednesday, 24/09/2025 15:00-15:30"
      const timeMatch = timeSlot.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
      if (timeMatch) {
        const [, startHour, startMin, endHour, endMin] = timeMatch;
        const startMinutes = parseInt(startHour) * 60 + parseInt(startMin);
        const endMinutes = parseInt(endHour) * 60 + parseInt(endMin);
        return endMinutes - startMinutes;
      }
      return 30; // Default to 30 minutes if parsing fails
    } catch (error) {
      console.error('Error extracting duration from time slot:', error);
      return 30; // Default to 30 minutes if parsing fails
    }
  };

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

  const handleProceedToPayment = async (timeSlot?: string, selectedPlanId?: string) => {
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
      // Extract duration from the selected time slot (e.g., "15:00-15:30" = 30 minutes)
      const timeSlotDuration = extractDurationFromTimeSlot(timeSlot || selectedTimeSlot);
      const reservationId = await createTemporaryReservation(
        matchedInterviewer.id,
        timeSlot || selectedTimeSlot,
        user.id,
        timeSlotDuration
      );
      
      setTemporaryReservationId(reservationId);
      console.log('🔒 Created temporary reservation:', reservationId);
      
      // Determine the correct plan ID based on user selection or fallback to duration-based logic
      let planId = selectedPlanId;
      if (!planId) {
        // Fallback to duration-based logic if no plan selected
        planId = timeSlotDuration === 30 ? 'essential' : timeSlotDuration === 60 ? 'professional' : 'executive';
      }
      
      // Update formData with matched interviewer data
      setFormData(prev => ({ 
        ...prev, 
        matchedInterviewer: matchedInterviewer,
        selectedTimeSlot: timeSlot || prev.selectedTimeSlot,
        interviewer_id: matchedInterviewer?.id,
        interviewer_user_id: matchedInterviewer?.user_id,
        selected_time_slot: timeSlot || prev.selectedTimeSlot || prev.timeSlot,
        selected_date: timeSlot ? parseTimeSlotToDate(timeSlot) : null,
        plan_duration: timeSlotDuration, // Use actual slot duration instead of plan duration
        match_score: matchedInterviewer?.matchScore || 0,
        selected_plan: planId, // Use the correct plan ID
        interview_duration: timeSlotDuration // Use actual slot duration instead of plan duration
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
    handleAcceptAlternativeTime,
    handleWaitForBetterMatch,
    handleTryAgain
  };
};
