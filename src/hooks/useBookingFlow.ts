
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { useAuth } from "@/contexts/AuthContext";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { findMatchingInterviewer, scheduleInterview } from "@/services/interviewScheduling";

export const useBookingFlow = () => {
  const [currentStep, setCurrentStep] = useState<'form' | 'payment' | 'matching' | 'success' | 'no-match' | 'time-confirmation'>('form');
  const [formData, setFormData] = useState<any>(null);
  const [matchedInterviewer, setMatchedInterviewer] = useState<any>(null);
  const [alternativeTimeSlot, setAlternativeTimeSlot] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { syncCandidateToGoogleSheets } = useGoogleSheets();
  const { user } = useAuth();
  const { paymentSession, markInterviewMatched, isInterviewAlreadyMatched } = usePaymentStatus();

  const handleFormSubmit = async (data: any) => {
    console.log('Enhanced form submitted with data:', {
      targetRole: data.targetRole,
      currentPosition: data.currentPosition,
      experienceYears: data.experienceYears,
      skillCategories: data.skillCategories,
      specificSkills: data.specificSkills,
      skillsToPractice: data.skillsToPractice,
      timeSlot: data.timeSlot
    });
    setFormData(data);
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('Payment success callback called:', paymentData);
    toast({
      title: "Payment Successful!",
      description: "You can now start matching with interviewers.",
    });
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
      console.log('Finding matching interviewer...');
      
      const interviewer = await findMatchingInterviewer(paymentSession.candidate_data);
      
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
          user?.user_metadata?.full_name || user?.email || ''
        );
        
      const candidateDataForSheets = {
        name: user?.user_metadata?.full_name || user?.email || "Unknown",
        email: user?.email || "Unknown",
        experience: paymentSession.candidate_data.experienceYears?.toString() || paymentSession.candidate_data.experience || "Not provided",
        noticePeriod: paymentSession.candidate_data.noticePeriod || "Not provided",
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
      
      const candidateDataForSheets = {
        name: user?.user_metadata?.full_name || user?.email || "Unknown",
        email: user?.email || "Unknown",
        experience: paymentSession.candidate_data.experienceYears?.toString() || paymentSession.candidate_data.experience || "Not provided",
        noticePeriod: paymentSession.candidate_data.noticePeriod || "Not provided",
        targetRole: paymentSession.candidate_data.targetRole,
        timeSlot: alternativeTimeSlot?.interviewerAvailable || "To be confirmed",
        resumeUploaded: paymentSession.candidate_data.resume ? "Yes" : "No",
        resumeFileName: paymentSession.candidate_data.resume?.name || "Not provided",
        matchedInterviewer: matchedInterviewer.company || "Unknown Company",
        paymentId: paymentSession.id,
        paymentAmount: paymentSession.amount.toString(),
        submissionDate: new Date().toISOString()
      };

      await syncCandidateToGoogleSheets(candidateDataForSheets);
      await markInterviewMatched(paymentSession.id);
      
      setCurrentStep('success');
      toast({
        title: "Interview Scheduled!",
        description: "Your interview has been scheduled successfully!",
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
    document.title = 'Book Your Mock Interview';
  };

  return {
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
  };
};
