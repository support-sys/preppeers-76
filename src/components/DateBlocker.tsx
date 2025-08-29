import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { CalendarX, Save, Trash2, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DateBlockerProps {
  onClose: () => void;
  onBlockedDatesChange?: () => void;
}

interface TimeBlock {
  id: string;
  blocked_date: string;
  start_time: string;
  end_time: string;
  block_reason: string;
  interview_id?: string;
}

interface InterviewBlock {
  id: string;
  candidate_name: string;
  target_role: string;
  scheduled_time: string;
}

const DateBlocker = ({ onClose, onBlockedDatesChange }: DateBlockerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [interviewBlocks, setInterviewBlocks] = useState<InterviewBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlockedDates();
  }, []);

  const loadBlockedDates = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // First get the interviewer record to get the interviewer_id
      const { data: interviewerData, error: interviewerError } = await supabase
        .from('interviewers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (interviewerError) {
        console.error('Error fetching interviewer data:', interviewerError);
        toast({
          title: "Error",
          description: "Failed to load interviewer data.",
          variant: "destructive",
        });
        return;
      }

      // Fetch blocked time blocks for this interviewer
      const { data: timeBlocksData, error: timeBlocksError } = await supabase
        .from('interviewer_time_blocks')
        .select('*')
        .eq('interviewer_id', interviewerData.id)
        .order('blocked_date', { ascending: true });

      if (timeBlocksError) {
        console.error('Error fetching time blocks:', timeBlocksError);
        toast({
          title: "Error",
          description: "Failed to load blocked dates.",
          variant: "destructive",
        });
        return;
      }

      // Also fetch scheduled interviews to show as blocked dates
      const { data: interviewsData, error: interviewsError } = await supabase
        .from('interviews')
        .select('id, scheduled_time, candidate_name, target_role')
        .eq('interviewer_id', interviewerData.id)
        .eq('status', 'scheduled')
        .order('scheduled_time', { ascending: true });

      if (interviewsError) {
        console.error('Error fetching interviews:', interviewsError);
      }

      // Convert time blocks to blocked dates
      const uniqueDates = new Set<string>();
      const processedTimeBlocks: TimeBlock[] = [];

      // Add manually blocked dates
      timeBlocksData?.forEach((block: TimeBlock) => {
        uniqueDates.add(block.blocked_date);
        processedTimeBlocks.push(block);
      });

      // Add interview dates as blocked dates
      interviewsData?.forEach((interview: InterviewBlock) => {
        const interviewDate = new Date(interview.scheduled_time);
        const dateStr = format(interviewDate, 'yyyy-MM-dd');
        uniqueDates.add(dateStr);
        
        // Create a time block for the interview
        const interviewBlock: TimeBlock = {
          id: interview.id,
          blocked_date: dateStr,
          start_time: format(interviewDate, 'HH:mm:ss'),
          end_time: format(new Date(interviewDate.getTime() + 60 * 60 * 1000), 'HH:mm:ss'), // +1 hour
          block_reason: 'interview_scheduled',
          interview_id: interview.id
        };
        
        processedTimeBlocks.push(interviewBlock);
      });

      const blockedDatesArray = Array.from(uniqueDates).map(dateStr => new Date(dateStr));
      setBlockedDates(blockedDatesArray);
      setTimeBlocks(processedTimeBlocks);
      setInterviewBlocks(interviewsData || []);

    } catch (error) {
      console.error('Error in loadBlockedDates:', error);
      toast({
        title: "Error",
        description: "Failed to load blocked dates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const isAlreadySelected = selectedDates.some(
      selectedDate => selectedDate.toDateString() === date.toDateString()
    );
    
    if (isAlreadySelected) {
      setSelectedDates(selectedDates.filter(
        selectedDate => selectedDate.toDateString() !== date.toDateString()
      ));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleBlockDates = async () => {
    if (selectedDates.length === 0) {
      toast({
        title: "No dates selected",
        description: "Please select dates to block.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!user) throw new Error("User not authenticated");

      // Get interviewer ID
      const { data: interviewerData, error: interviewerError } = await supabase
        .from('interviewers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (interviewerError) throw interviewerError;

      // Create time blocks for selected dates (blocking entire day)
      const timeBlocksToInsert = selectedDates.map(date => ({
        interviewer_id: interviewerData.id,
        blocked_date: format(date, 'yyyy-MM-dd'),
        start_time: '00:00:00',
        end_time: '23:59:59',
        block_reason: 'manual_block'
      }));

      const { error: insertError } = await supabase
        .from('interviewer_time_blocks')
        .insert(timeBlocksToInsert);

      if (insertError) throw insertError;

      // Refresh the blocked dates
      await loadBlockedDates();
      
      setSelectedDates([]);
      
      // Notify parent component about the change
      if (onBlockedDatesChange) {
        onBlockedDatesChange();
      }
      
      toast({
        title: "Success",
        description: `${selectedDates.length} date(s) have been blocked successfully!`,
      });
    } catch (error) {
      console.error('Error blocking dates:', error);
      toast({
        title: "Error",
        description: "Failed to block dates. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnblockDate = async (dateToUnblock: Date) => {
    try {
      const dateStr = format(dateToUnblock, 'yyyy-MM-dd');
      
      // Delete all time blocks for this date
      const { error: deleteError } = await supabase
        .from('interviewer_time_blocks')
        .delete()
        .eq('blocked_date', dateStr)
        .eq('block_reason', 'manual_block');

      if (deleteError) throw deleteError;

      // Refresh the blocked dates
      await loadBlockedDates();
      
      // Notify parent component about the change
      if (onBlockedDatesChange) {
        onBlockedDatesChange();
      }
      
      toast({
        title: "Success",
        description: "Date has been unblocked successfully!",
      });
    } catch (error) {
      console.error('Error unblocking date:', error);
      toast({
        title: "Error",
        description: "Failed to unblock date. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isDateBlocked = (date: Date) => {
    return blockedDates.some(blockedDate => 
      blockedDate.toDateString() === date.toDateString()
    );
  };

  const isDateSelected = (date: Date) => {
    return selectedDates.some(selectedDate => 
      selectedDate.toDateString() === date.toDateString()
    );
  };

  const getTimeBlocksForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return timeBlocks.filter(block => block.blocked_date === dateStr);
  };

  const getInterviewForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return interviewBlocks.find(interview => {
      const interviewDate = format(new Date(interview.scheduled_time), 'yyyy-MM-dd');
      return interviewDate === dateStr;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Loading blocked dates...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <CalendarX className="w-5 h-5 mr-2" />
            Block Dates
          </CardTitle>
          <CardDescription className="text-slate-300">
            Select dates when you're not available for interviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={handleDateSelect}
            className="bg-white/5 rounded-md p-3"
            modifiers={{
              blocked: blockedDates,
              selected: selectedDates,
            }}
            modifiersStyles={{
              blocked: { backgroundColor: 'rgba(239, 68, 68, 0.5)' },
              selected: { backgroundColor: 'rgba(59, 130, 246, 0.5)' },
            }}
            disabled={(date) => date < new Date()}
          />
          
          <div className="mt-4 space-y-2">
            {selectedDates.length > 0 && (
              <div>
                <p className="text-sm text-slate-300 mb-2">Selected dates to block:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedDates.map((date, index) => (
                    <span key={index} className="bg-blue-600/50 text-white px-2 py-1 rounded text-xs">
                      {format(date, 'MMM dd, yyyy')}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBlockDates}
                className="bg-red-600 hover:bg-red-700"
                disabled={selectedDates.length === 0}
              >
                Block Selected Dates
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Currently Blocked Dates</CardTitle>
          <CardDescription className="text-slate-300">
            Dates when you're unavailable for interviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockedDates.length === 0 ? (
            <p className="text-slate-300">No dates are currently blocked.</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {blockedDates.map((date, index) => {
                const dateTimeBlocks = getTimeBlocksForDate(date);
                const interview = getInterviewForDate(date);
                const isInterviewDate = interview !== undefined;
                
                return (
                  <div key={index} className="p-3 bg-white/5 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        {format(date, 'EEEE, MMMM dd, yyyy')}
                      </span>
                      {!isInterviewDate && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnblockDate(date)}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Show interview details if it's an interview date */}
                    {interview && (
                      <div className="mb-2 p-2 bg-blue-600/20 rounded border border-blue-400/30">
                        <div className="flex items-center text-sm text-blue-300 mb-1">
                          <User className="w-3 h-3 mr-1" />
                          <span className="font-medium">Interview Scheduled</span>
                        </div>
                        <div className="text-xs text-blue-200">
                          <div>Candidate: {interview.candidate_name}</div>
                          <div>Role: {interview.target_role}</div>
                          <div>Time: {format(new Date(interview.scheduled_time), 'HH:mm')}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Show time blocks for this date */}
                    {dateTimeBlocks.length > 0 && (
                      <div className="space-y-1">
                        {dateTimeBlocks.map((block) => (
                          <div key={block.id} className="flex items-center text-sm text-slate-300">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>
                              {block.start_time} - {block.end_time}
                              {block.block_reason !== 'manual_block' && block.block_reason !== 'interview_scheduled' && (
                                <span className="text-slate-400 ml-2">
                                  ({block.block_reason})
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DateBlocker;
