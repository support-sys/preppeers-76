import React from 'react';
import { useRescheduleFlow } from '@/hooks/useRescheduleFlow';
import InterviewerPreview from '@/components/InterviewerPreview';
import TimeSlotConfirmation from '@/components/TimeSlotConfirmation';
import InterviewScheduledSuccess from '@/components/InterviewScheduledSuccess';
import NoMatchFound from '@/components/NoMatchFound';
import { RescheduleForm } from '@/components/RescheduleForm';

interface Interview {
  id: string;
  candidate_name: string;
  candidate_email: string;
  target_role: string;
  specific_skills?: string[];
  experience: string;
  scheduled_time: string;
  status: string;
  interviewer_id: string;
  resume_url?: string;
}

interface RescheduleFlowProps {
  interview: Interview;
  onClose: () => void;
  onSuccess: () => void;
}

const RescheduleFlow = ({ interview, onClose, onSuccess }: RescheduleFlowProps) => {
  const {
    currentStep,
    rescheduleData,
    matchedInterviewer,
    alternativeTimeSlot,
    isLoading,
    handleRescheduleSubmit,
    handleConfirmReschedule,
    handleAcceptAlternativeTime,
    handleWaitForBetterMatch,
    handleTryAgain
  } = useRescheduleFlow(interview);

  // Handle success and close
  const handleFlowSuccess = () => {
    onSuccess();
    onClose();
  };

  // Render different steps
  switch (currentStep) {
    case 'form':
      return (
        <RescheduleForm
          interview={interview}
          onSubmit={handleRescheduleSubmit}
          onClose={onClose}
          isLoading={isLoading}
        />
      );

    case 'preview-match':
      if (!matchedInterviewer) return null;
      return (
        <InterviewerPreview
          matchedInterviewer={matchedInterviewer}
          formData={rescheduleData}
          onProceedToPayment={() => handleConfirmReschedule()}
          onGoBack={handleTryAgain}
        />
      );

    case 'time-confirmation':
      if (!alternativeTimeSlot || !matchedInterviewer) return null;
      return (
        <TimeSlotConfirmation
          matchedInterviewer={matchedInterviewer}
          alternativeTimeSlot={alternativeTimeSlot}
          onAccept={handleAcceptAlternativeTime}
          onWaitForBetter={handleWaitForBetterMatch}
        />
      );

    case 'success':
      return (
        <InterviewScheduledSuccess
          matchedInterviewer={matchedInterviewer}
          formData={rescheduleData}
        />
      );

    case 'no-match':
      return (
        <NoMatchFound
          formData={rescheduleData}
          onTryAgain={handleTryAgain}
        />
      );

    default:
      return null;
  }
};

export default RescheduleFlow;