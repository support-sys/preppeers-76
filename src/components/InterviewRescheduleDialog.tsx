
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTimeIST } from '@/utils/dateUtils';
import RescheduleFlow from '@/components/RescheduleFlow';

interface Interview {
  id: string;
  candidate_name: string;
  candidate_email: string;
  target_role: string;
  experience: string;
  scheduled_time: string;
  status: string;
  interviewer_id: string; // <-- Add this line
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

  // For interviewee, use the new reschedule flow
  if (userRole === 'interviewee') {
    return (
      <RescheduleFlow
        interview={interview}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  // For interviewer, use simple cancellation
  const handleCancel = async () => {
    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancelling.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error: updateError } = await supabase
        .from('interviews')
        .update({ 
          status: 'cancelled'
        })
        .eq('id', interview.id);
      
      if (updateError) {
        throw updateError;
      }
      
      toast({
        title: "Interview Cancelled",
        description: "The interview has been cancelled. The candidate will be notified and can book a new session.",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error cancelling interview:', error);
      toast({
        title: "Error",
        description: "Failed to cancel the interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Cancel Interview
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Please provide a reason for cancelling this interview. The candidate will be notified.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="text-foreground font-semibold mb-2">Interview Details</h4>
            <p className="text-muted-foreground text-sm">
              <strong>Role:</strong> {interview.target_role}
            </p>
            <p className="text-muted-foreground text-sm">
              <strong>Scheduled:</strong> {formatDateTimeIST(interview.scheduled_time)}
            </p>
            <p className="text-muted-foreground text-sm">
              <strong>Candidate:</strong> {interview.candidate_name}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-foreground">
              Reason for cancellation
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need to cancel this interview..."
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isProcessing || !reason.trim()}
              variant="destructive"
            >
              {isProcessing ? 'Processing...' : 'Cancel Interview'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewRescheduleDialog;
