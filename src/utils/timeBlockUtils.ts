import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

// Function to check if a time slot is available (not blocked)
export const isTimeSlotAvailable = async (
  interviewerId: string,
  requestedTime: string
): Promise<boolean> => {
  try {
    const requestedDate = new Date(requestedTime);
    const requestedDateStr = format(requestedDate, 'yyyy-MM-dd');
    const startTime = format(requestedDate, 'HH:mm');
    const endTime = format(new Date(requestedDate.getTime() + 60 * 60 * 1000), 'HH:mm');

    // Check if there are any conflicting time blocks
    const { data: conflicts, error } = await supabase
      .from('interviewer_time_blocks')
      .select('id')
      .eq('interviewer_id', interviewerId)
      .eq('blocked_date', requestedDateStr)
      .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

    if (error) {
      console.error('Error checking time slot availability:', error);
      return true; // Default to available if we can't check
    }

    return !conflicts || conflicts.length === 0;
  } catch (error) {
    console.error('Error in isTimeSlotAvailable:', error);
    return true; // Default to available on error
  }
};

// Function to get all blocked time slots for an interviewer on a specific date
export const getBlockedTimeSlots = async (
  interviewerId: string,
  date: string
): Promise<Array<{ start_time: string; end_time: string; block_reason: string }>> => {
  try {
    const { data: blocks, error } = await supabase
      .from('interviewer_time_blocks')
      .select('start_time, end_time, block_reason')
      .eq('interviewer_id', interviewerId)
      .eq('blocked_date', date)
      .order('start_time');

    if (error) {
      console.error('Error fetching blocked time slots:', error);
      return [];
    }

    return blocks || [];
  } catch (error) {
    console.error('Error in getBlockedTimeSlots:', error);
    return [];
  }
};

// Function to manually block a time slot
export const manuallyBlockTimeSlot = async (
  interviewerId: string,
  blockedDate: string,
  startTime: string,
  endTime: string,
  reason: string = 'manually_blocked'
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('interviewer_time_blocks')
      .insert({
        interviewer_id: interviewerId,
        blocked_date: blockedDate,
        start_time: startTime,
        end_time: endTime,
        block_reason: reason
      });

    if (error) {
      console.error('Error manually blocking time slot:', error);
      throw error;
    }

    console.log(`✅ Successfully blocked ${blockedDate} ${startTime}-${endTime} for interviewer ${interviewerId}`);
  } catch (error) {
    console.error('Error in manuallyBlockTimeSlot:', error);
    throw error;
  }
};

// Function to remove a time block
export const removeTimeBlock = async (timeBlockId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('interviewer_time_blocks')
      .delete()
      .eq('id', timeBlockId);

    if (error) {
      console.error('Error removing time block:', error);
      throw error;
    }

    console.log(`✅ Successfully removed time block ${timeBlockId}`);
  } catch (error) {
    console.error('Error in removeTimeBlock:', error);
    throw error;
  }
};