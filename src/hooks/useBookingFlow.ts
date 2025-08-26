
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { findMatchingInterviewer, scheduleInterview } from "@/services/interviewScheduling";

export const useBookingFlow = () => {
  const [currentStep, setCurrentStep] = useState<'form' | 'preview-match' | 'payment' | 'matching' | 'success' | 'no-match' | 'time-confirmation'>('form');
  const [formData, setFormData] = useState<any>(null);
  const [matchedInterviewer, setMatchedInterviewer] = useState<any>(null);
  const [alternativeTimeSlot, setAlternativeTimeSlot] = useState<any>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { paymentSession, markInterviewMatched, isInterviewAlreadyMatched } = usePaymentStatus();

  const handleFormSubmit = async (data: any) => {
    console.log('Enhanced form submitted with data:', {
      currentPosition: data.currentPosition,
      experienceYears: data.experienceYears,
      skillCategories: data.skillCategories,
      specificSkills: data.specificSkills,
      skillsToPractice: data.skillsToPractice,
      timeSlot: data.timeSlot
    });
    setFormData(data);
    setIsLoading(true);
    
    // Reset previous state for fresh booking
    setMatchedInterviewer(null);
    setAlternativeTimeSlot(null);
    
    try {
      console.log('Finding matching interviewer preview...');
      const interviewer = await findMatchingInterviewer(data);
      
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

  const handleProceedToPayment = (timeSlot?: string) => {
    if (timeSlot) {
      setSelectedTimeSlot(timeSlot);
      // Update formData with selected time slot and matched interviewer
      setFormData(prev => ({ 
        ...prev, 
        selectedTimeSlot: timeSlot,
        previewedInterviewer: matchedInterviewer 
      }));
    } else {
      // Store the previewed interviewer for post-payment booking
      setFormData(prev => ({ 
        ...prev, 
        previewedInterviewer: matchedInterviewer 
      }));
    }
    setCurrentStep('payment');
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
          user?.user_metadata?.full_name || user?.email || ''
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

  const handlePaymentError = (error: any) => {
    console.error("Payment failed:", error);
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
      // First, try the previewed interviewer if available
      const previewedInterviewerId = paymentSession.candidate_data?.previewedInterviewer?.id;
      
      if (previewedInterviewerId) {
        console.log('🎯 Trying previewed interviewer first:', previewedInterviewerId);
        
        const { tryPreviewedInterviewer } = await import("@/services/interviewScheduling");
        const previewResult = await tryPreviewedInterviewer(previewedInterviewerId, paymentSession.candidate_data);
        
        if (previewResult.available) {
          console.log('✅ Previewed interviewer available!');
          setMatchedInterviewer(previewResult.interviewer);
          
          // Check if exact time match or alternative needed
          const hasExactTimeMatch = previewResult.interviewer.matchReasons?.includes('Exact time match');
          
          if (!hasExactTimeMatch && previewResult.alternativeSlots?.length > 0) {
            setAlternativeTimeSlot({
              candidatePreferred: paymentSession.candidate_data.timeSlot,
              interviewerAvailable: previewResult.alternativeSlots[0]
            });
            setCurrentStep('time-confirmation');
            return;
          }
          
          // Direct scheduling for exact matches or no alternatives needed
          await scheduleInterview(
            previewResult.interviewer, 
            paymentSession.candidate_data, 
            user?.email || '',
            user?.user_metadata?.full_name || user?.email || ''
          );
          
          await markInterviewMatched(paymentSession.id);
          
          setCurrentStep('success');
          document.title = 'Interview Scheduled Successfully!';
          toast({
            title: "Interview Scheduled! 🎉",
            description: "Your previewed interviewer was available! Check your dashboard for details.",
          });
          return;
        } else {
          console.log('❌ Previewed interviewer no longer available:', previewResult.reason);
          toast({
            title: "Interviewer Changed",
            description: "Your previewed interviewer is no longer available. Finding you a new match...",
          });
        }
      }

      // Fallback to fresh matching if no previewed interviewer or they're unavailable
      console.log('Finding new matching interviewer...');
      
      const interviewer = await findMatchingInterviewer(paymentSession.candidate_data);
      
      if (interviewer) {
        console.log('New interviewer found:', interviewer);
        setMatchedInterviewer(interviewer);
        
        // Check if time slots match exactly or if we need confirmation
        const candidatePreferredTime = paymentSession.candidate_data.timeSlot;
        const hasExactTimeMatch = interviewer.matchReasons?.includes('Available at preferred time') || 
                                  interviewer.matchReasons?.includes('Perfect time match');
        
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
          user?.user_metadata?.full_name || user?.email || ''
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
        user?.user_metadata?.full_name || user?.email || ''
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
