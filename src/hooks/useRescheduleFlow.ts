import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { findMatchingInterviewer, scheduleInterview } from "@/services/interviewScheduling";
import { supabase } from "@/integrations/supabase/client";

interface Interview {
  id: string;
  candidate_name: string;
  candidate_email: string;
  target_role: string;
  experience: string;
  scheduled_time: string;
  status: string;
  interviewer_id: string;
  resume_url?: string;
}

export const useRescheduleFlow = (interview: Interview) => {
  const [currentStep, setCurrentStep] = useState<'form' | 'preview-match' | 'time-confirmation' | 'success' | 'no-match'>('form');
  const [rescheduleData, setRescheduleData] = useState<any>(null);
  const [matchedInterviewer, setMatchedInterviewer] = useState<any>(null);
  const [alternativeTimeSlot, setAlternativeTimeSlot] = useState<any>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleRescheduleSubmit = async (data: { date: Date; time: string; reason: string }) => {
    console.log('Reschedule form submitted with data:', data);
    
    // Combine date and time to create the preferred datetime
    const [hours, minutes] = data.time.split(':').map(Number);
    const preferredDateTime = new Date(data.date);
    preferredDateTime.setHours(hours, minutes, 0, 0);

    // Parse skills from target_role field (which now contains skill categories)
    const skillCategories = interview.target_role?.split(', ').filter(Boolean) || [];
    
    const candidateData = {
      skillCategories: skillCategories,
      experience: interview.experience,
      timeSlot: preferredDateTime.toISOString(),
      resume: undefined
    };

    setRescheduleData({ ...candidateData, originalData: data });
    setReason(data.reason);
    setIsLoading(true);
    
    // Reset previous state for fresh matching
    setMatchedInterviewer(null);
    setAlternativeTimeSlot(null);
    
    try {
      console.log('Finding matching interviewer for reschedule...');
      const interviewer = await findMatchingInterviewer(candidateData);
      
      if (interviewer) {
        console.log('Reschedule interviewer found:', interviewer);
        setMatchedInterviewer(interviewer);
        
        // Check if time slots match exactly or if we need confirmation
        const candidatePreferredTime = candidateData.timeSlot;
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
        setCurrentStep('preview-match');
      } else {
        console.log('No interviewer found for reschedule');
        setCurrentStep('no-match');
        toast({
          title: "No Interviewer Available",
          description: "We couldn't find an available interviewer for your selected time. Try a different slot.",
        });
      }
    } catch (error) {
      console.error("Error finding interviewer for reschedule:", error);
      toast({
        title: "Error",
        description: "Unable to find an interviewer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReschedule = async (timeSlot?: string) => {
    if (!matchedInterviewer || !rescheduleData) return;
    
    setIsLoading(true);
    try {
      // Use selected time slot if available, otherwise use original rescheduleData
      const scheduleData = timeSlot 
        ? { ...rescheduleData, timeSlot: timeSlot }
        : rescheduleData;
        
      // Schedule new interview
      await scheduleInterview(
        matchedInterviewer, 
        scheduleData, 
        interview.candidate_email,
        interview.candidate_name
      );
      
      // Mark the old interview as rescheduled
      const { error: updateError } = await supabase
        .from('interviews')
        .update({ 
          status: 'rescheduled'
        })
        .eq('id', interview.id);
        
      if (updateError) {
        throw updateError;
      }
      
      setCurrentStep('success');
      toast({
        title: "Interview Rescheduled! 🎉",
        description: "Your interview has been rescheduled successfully! Check your dashboard for details.",
      });
    } catch (error) {
      console.error("Error finalizing reschedule:", error);
      toast({
        title: "Reschedule Error",
        description: "Failed to reschedule interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAlternativeTime = async () => {
    if (!matchedInterviewer || !rescheduleData) return;
    
    setIsLoading(true);
    try {
      await scheduleInterview(
        matchedInterviewer, 
        rescheduleData, 
        interview.candidate_email,
        interview.candidate_name
      );
      
      // Mark the old interview as rescheduled
      const { error: updateError } = await supabase
        .from('interviews')
        .update({ 
          status: 'rescheduled'
        })
        .eq('id', interview.id);
        
      if (updateError) {
        throw updateError;
      }
      
      setCurrentStep('success');
      toast({
        title: "Interview Rescheduled! 🎉",
        description: "Your interview has been rescheduled successfully! Check your dashboard for details.",
      });
    } catch (error) {
      console.error("Error scheduling interview:", error);
      toast({
        title: "Error",
        description: "Failed to reschedule interview. Please try again.",
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
    setRescheduleData(null);
    setMatchedInterviewer(null);
    setAlternativeTimeSlot(null);
    setSelectedTimeSlot('');
    setReason('');
  };

  return {
    currentStep,
    rescheduleData,
    matchedInterviewer,
    alternativeTimeSlot,
    selectedTimeSlot,
    reason,
    isLoading,
    handleRescheduleSubmit,
    handleConfirmReschedule,
    handleAcceptAlternativeTime,
    handleWaitForBetterMatch,
    handleTryAgain
  };
};