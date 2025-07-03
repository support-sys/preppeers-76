
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { findMatchingInterviewer, scheduleInterview } from '@/services/interviewScheduling';
import { useAuth } from '@/contexts/AuthContext';

interface Interview {
  id: string;
  candidate_name: string;
  candidate_email: string;
  target_role: string;
  experience: string;
  scheduled_time: string;
  status: string;
  resume_url?: string;
  google_meet_link?: string;
  google_calendar_event_id?: string;
}

interface InterviewRescheduleDialogProps {
  interview: Interview;
  userRole: 'interviewer' | 'interviewee';
  onClose: () => void;
  onSuccess: () => void;
}

const InterviewRescheduleDialog = ({ interview, userRole, onClose, onSuccess }: InterviewRescheduleDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReschedule = async () => {
    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rescheduling.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Cancel the current interview
      const { error: cancelError } = await supabase
        .from('interviews')
        .update({ 
          status: 'rescheduled',
          // You could add a reschedule_reason field to track this
        })
        .eq('id', interview.id);

      if (cancelError) {
        throw cancelError;
      }

      // If it's a candidate rescheduling, find a new interviewer and schedule
      if (userRole === 'interviewee') {
        const candidateData = {
          targetRole: interview.target_role,
          experience: interview.experience,
          timeSlot: '', // Will be matched with available slots
          resume: interview.resume_url ? undefined : undefined // Fix: don't pass resume as string, pass undefined
        };

        // Find matching interviewer
        const matchedInterviewer = await findMatchingInterviewer(candidateData);
        
        if (!matchedInterviewer) {
          toast({
            title: "No Available Interviewer",
            description: "We couldn't find an available interviewer at this time. Please try booking again later.",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        // Schedule new interview
        await scheduleInterview(
          matchedInterviewer,
          candidateData,
          interview.candidate_email,
          interview.candidate_name
        );

        toast({
          title: "Interview Rescheduled",
          description: "Your interview has been rescheduled with a new interviewer. You'll receive a confirmation email shortly.",
        });
      } else {
        // For interviewer rescheduling, just cancel and notify
        toast({
          title: "Interview Cancelled",
          description: "The interview has been cancelled. The candidate will be notified and can book a new session.",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error rescheduling interview:', error);
      toast({
        title: "Error",
        description: "Failed to reschedule the interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-600">
        <DialogHeader>
          <DialogTitle className="text-white">
            {userRole === 'interviewer' ? 'Cancel Interview' : 'Reschedule Interview'}
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            {userRole === 'interviewer' 
              ? 'Please provide a reason for cancelling this interview. The candidate will be notified.'
              : 'Please provide a reason for rescheduling. We\'ll find you a new interviewer based on your preferences.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Interview Details</h4>
            <p className="text-slate-300 text-sm">
              <strong>Role:</strong> {interview.target_role}
            </p>
            <p className="text-slate-300 text-sm">
              <strong>Scheduled:</strong> {new Date(interview.scheduled_time).toLocaleString()}
            </p>
            <p className="text-slate-300 text-sm">
              <strong>Candidate:</strong> {interview.candidate_name}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-white">
              Reason for {userRole === 'interviewer' ? 'cancellation' : 'rescheduling'}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder={`Please explain why you need to ${userRole === 'interviewer' ? 'cancel' : 'reschedule'} this interview...`}
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={isProcessing || !reason.trim()}
              className={userRole === 'interviewer' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {isProcessing 
                ? 'Processing...' 
                : userRole === 'interviewer' 
                  ? 'Cancel Interview' 
                  : 'Reschedule Interview'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewRescheduleDialog;
