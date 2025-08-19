import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, User, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { format, parseISO } from 'date-fns';

interface TimeSlotConfirmationProps {
  matchedInterviewer: any;
  alternativeTimeSlot: {
    candidatePreferred: string;
    interviewerAvailable: string;
    availableSlots?: string[];
  };
  onAccept: (selectedSlot?: string) => void;
  onWaitForBetter: () => void;
  isLoading?: boolean;
}

const TimeSlotConfirmation = ({ 
  matchedInterviewer, 
  alternativeTimeSlot, 
  onAccept, 
  onWaitForBetter,
  isLoading = false 
}: TimeSlotConfirmationProps) => {
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const handleAccept = async () => {
    await onAccept(selectedSlot);
  };

  const formatTimeSlot = (timeSlot: string) => {
    try {
      // Check if timeSlot is valid
      if (!timeSlot || typeof timeSlot !== 'string') {
        console.error('Invalid timeSlot provided:', timeSlot);
        return {
          day: 'Unknown',
          date: 'Unknown',
          time: 'Invalid time'
        };
      }

      // Handle different time slot formats
      if (timeSlot.includes(',') && timeSlot.includes('-')) {
        // Format: "Tuesday, 07/10/2025 09:00-10:00"
        const parts = timeSlot.split(' ');
        if (parts.length < 2) {
          throw new Error('Invalid format - not enough parts');
        }
        
        const [datePart, timePart] = parts;
        const dateComponents = datePart.split(', ');
        if (dateComponents.length < 2) {
          throw new Error('Invalid date format');
        }
        
        const [dayName, dateStr] = dateComponents;
        const dateNumbers = dateStr.split('/');
        if (dateNumbers.length < 3) {
          throw new Error('Invalid date numbers format');
        }
        
        const [day, month, year] = dateNumbers;
        const timeComponents = timePart.split('-');
        if (timeComponents.length < 1) {
          throw new Error('Invalid time format');
        }
        
        const [startTime] = timeComponents;
        
        const fullDateTime = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${startTime}:00`;
        const date = parseISO(fullDateTime);
        
        return {
          day: format(date, 'EEEE'),
          date: format(date, 'MMM d, yyyy'),
          time: format(date, 'h:mm a')
        };
      } else {
        // Fallback for ISO strings
        const date = parseISO(timeSlot);
        return {
          day: format(date, 'EEEE'),
          date: format(date, 'MMM d, yyyy'),
          time: format(date, 'h:mm a')
        };
      }
    } catch (error) {
      console.error('Error formatting time slot:', error, 'TimeSlot value:', timeSlot);
      return {
        day: 'Unknown',
        date: 'Unknown',
        time: timeSlot || 'Invalid time'
      };
    }
  };

  const formatCandidatePreferred = (timeSlot: string) => {
    try {
      const date = parseISO(timeSlot);
      return `${format(date, 'EEEE')}, ${format(date, 'MMM d, yyyy')} at ${format(date, 'h:mm a')}`;
    } catch (error) {
      return timeSlot;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-2xl backdrop-blur-lg border-2 bg-white/10 border-blue-400/30">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-orange-500/20 backdrop-blur-sm">
            <Clock className="w-10 h-10 text-orange-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-orange-400">
            Great Match Found!
          </CardTitle>
          <CardDescription className="text-lg text-orange-200">
            We found a perfect interviewer, but there's a time preference difference
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Interviewer Details */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
            <div className="flex items-center space-x-4 mb-4">
              <User className="w-8 h-8 text-blue-400" />
              <div>
                <h3 className="text-xl font-bold text-blue-400">
                  {matchedInterviewer?.company || 'Senior Interviewer'}
                </h3>
                <p className="text-blue-200">
                  {matchedInterviewer?.position || 'Experienced Professional'}
                </p>
              </div>
            </div>
            {matchedInterviewer?.matchReasons && (
              <div className="space-y-2">
                <h4 className="font-semibold text-green-400">Why this is a great match:</h4>
                <ul className="text-sm text-green-200 space-y-1">
                  {matchedInterviewer.matchReasons.map((reason: string, index: number) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Time Slot Comparison */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-900/20 border border-red-800/30 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-300">Your Preferred Time</p>
                  <p className="text-xs text-red-400">{formatCandidatePreferred(alternativeTimeSlot.candidatePreferred)}</p>
                  <p className="text-xs text-red-500 mt-1">Not available with this interviewer</p>
                </div>
              </div>
            </div>

            {alternativeTimeSlot.availableSlots && alternativeTimeSlot.availableSlots.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-200">Choose from available slots:</p>
                {alternativeTimeSlot.availableSlots.map((slot, index) => {
                  const formatted = formatTimeSlot(slot);
                  return (
                    <div 
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedSlot === slot
                          ? 'bg-green-900/20 border-green-800/30 text-green-300'
                          : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 text-slate-300'
                      }`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${selectedSlot === slot ? 'text-green-400' : 'text-slate-500'}`} />
                        <div>
                          <p className="text-sm font-medium">{formatted.day}, {formatted.date}</p>
                          <p className="text-xs opacity-75">{formatted.time}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-green-900/20 border border-green-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-300">Next Available Slot</p>
                    <p className="text-xs text-green-400">{alternativeTimeSlot.interviewerAvailable}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recommendation Message */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 p-6 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-blue-400 mt-1" />
              <div>
                <h4 className="font-bold text-blue-400 mb-2">Our Recommendation</h4>
                <p className="text-blue-200 mb-3">
                  We strongly recommend accepting this interviewer's available slot as they are an excellent match for your skills and experience. 
                  Getting a quality interview is more valuable than the specific time preference.
                </p>
                <p className="text-sm text-blue-300">
                  If you wait for your exact preferred time, it may take longer to find another suitable interviewer.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleAccept}
              disabled={isLoading || (alternativeTimeSlot.availableSlots && !selectedSlot)}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? 'Scheduling...' : 'Accept & Schedule Interview'}
            </Button>
            
            <Button 
              onClick={onWaitForBetter}
              variant="outline"
              disabled={isLoading}
              className="border-2 border-orange-400/50 text-orange-400 hover:bg-orange-400/10 font-semibold py-4 rounded-xl transition-all duration-300"
            >
              Wait for My Preferred Time
            </Button>
          </div>

          <p className="text-center text-sm text-slate-400">
            {alternativeTimeSlot.availableSlots && alternativeTimeSlot.availableSlots.length > 0 
              ? "Please select a time slot above to proceed with scheduling."
              : "Note: If you choose to wait, we'll notify you when an interviewer becomes available for your preferred time slot."
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeSlotConfirmation;