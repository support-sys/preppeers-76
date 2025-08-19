import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatDateTimeIST } from '@/utils/dateUtils';

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

interface RescheduleFormProps {
  interview: Interview;
  onSubmit: (data: { date: Date; time: string; reason: string }) => void;
  onClose: () => void;
  isLoading: boolean;
}

export const RescheduleForm = ({ interview, onSubmit, onClose, isLoading }: RescheduleFormProps) => {
  const [reason, setReason] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Generate time slots from 09:00 to 18:00
  const timeSlots = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = format(new Date(2024, 0, 1, hour, minute), 'h:mm a');
      timeSlots.push({ value: timeString, label: displayTime });
    }
  }

  const handleSubmit = () => {
    if (!reason.trim() || !selectedDate || !selectedTime) {
      return;
    }
    
    onSubmit({
      date: selectedDate,
      time: selectedTime,
      reason: reason.trim()
    });
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1); // Tomorrow

  const isFormValid = reason.trim() && selectedDate && selectedTime;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Reschedule Interview
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            We'll find you the best available interviewer for your new preferred time. Since payment is already completed, you can reschedule directly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="text-foreground font-semibold mb-2">Current Interview Details</h4>
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-foreground">
                New Preferred Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < minDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-foreground">
                New Preferred Time *
              </Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Select a time" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem 
                      key={slot.value} 
                      value={slot.value}
                    >
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-foreground">
                Reason for Rescheduling *
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why you need to reschedule this interview..."
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !isFormValid}
              className="min-w-[120px]"
            >
              {isLoading ? 'Finding Interviewer...' : 'Find New Interviewer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};