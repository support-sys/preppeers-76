import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay, isSameDay } from 'date-fns';

interface AvailableTimeSlot {
  date: string; // YYYY-MM-DD format
  dayName: string; // Monday, Tuesday, etc.
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  displayText: string; // "Monday, 16/08/2025 10:00-11:00"
}

export const getAvailableTimeSlotsForInterviewer = async (
  interviewerId: string,
  interviewerTimeSlots: any,
  candidatePreferredDate?: string, // ISO date string or date-like string
  daysToCheck: number = 14
): Promise<AvailableTimeSlot[]> => {
  if (!interviewerTimeSlots) return [];

  const availableSlots: AvailableTimeSlot[] = [];
  
  // Parse candidate's preferred date or use today as fallback
  let startDate = startOfDay(new Date());
  if (candidatePreferredDate) {
    try {
      const preferredDate = new Date(candidatePreferredDate);
      if (!isNaN(preferredDate.getTime())) {
        startDate = startOfDay(preferredDate);
      }
    } catch (error) {
      console.log('Could not parse candidate preferred date, using today:', error);
    }
  }

  try {
    // Get all blocked time slots for this interviewer from the preferred date onwards
    const endDate = addDays(startDate, daysToCheck);
    const { data: blockedSlots, error } = await supabase
      .from('interviewer_time_blocks')
      .select('blocked_date, start_time, end_time')
      .eq('interviewer_id', interviewerId)
      .gte('blocked_date', format(startDate, 'yyyy-MM-dd'))
      .lte('blocked_date', format(endDate, 'yyyy-MM-dd'));

    if (error) {
      console.error('Error fetching blocked slots:', error);
      return [];
    }

    // Also get already scheduled interviews for this interviewer in the same date range
    const { data: scheduledInterviews, error: interviewsError } = await supabase
      .from('interviews')
      .select('scheduled_time')
      .eq('interviewer_id', interviewerId)
      .gte('scheduled_time', startDate.toISOString())
      .lte('scheduled_time', endDate.toISOString())
      .in('status', ['scheduled', 'confirmed']); // Only consider active interviews

    if (interviewsError) {
      console.error('Error fetching scheduled interviews:', error);
      return [];
    }

    // Convert blocked slots to a map for quick lookup
    const blockedSlotsMap = new Map<string, Array<{start: string, end: string}>>();
    (blockedSlots || []).forEach(slot => {
      const dateKey = slot.blocked_date;
      if (!blockedSlotsMap.has(dateKey)) {
        blockedSlotsMap.set(dateKey, []);
      }
      blockedSlotsMap.get(dateKey)!.push({
        start: slot.start_time,
        end: slot.end_time
      });
    });

    // Convert scheduled interviews to blocked slots map
    (scheduledInterviews || []).forEach(interview => {
      const scheduledDate = new Date(interview.scheduled_time);
      const dateKey = format(scheduledDate, 'yyyy-MM-dd');
      const startTime = format(scheduledDate, 'HH:mm');
      const endTime = format(new Date(scheduledDate.getTime() + 60 * 60 * 1000), 'HH:mm'); // +1 hour
      
      if (!blockedSlotsMap.has(dateKey)) {
        blockedSlotsMap.set(dateKey, []);
      }
      blockedSlotsMap.get(dateKey)!.push({
        start: startTime,
        end: endTime
      });
    });

    // Check each day starting from the preferred date
    for (let i = 0; i <= daysToCheck; i++) {
      const checkDate = addDays(startDate, i);
      const dayName = format(checkDate, 'EEEE'); // Monday, Tuesday, etc.
      const dateString = format(checkDate, 'yyyy-MM-dd');
      const displayDate = format(checkDate, 'dd/MM/yyyy');

      // Check if this day has available slots in interviewer's schedule
      const daySlots = interviewerTimeSlots[dayName];
      if (!daySlots || !Array.isArray(daySlots)) continue;

      // Get blocked slots for this specific date
      const blockedForDate = blockedSlotsMap.get(dateString) || [];

      // Check each available slot against blocked slots
      daySlots.forEach((slot: any) => {
        if (typeof slot === 'object' && slot.start && slot.end) {
          const slotStart = slot.start;
          const slotEnd = slot.end;

          // Check if this slot conflicts with any blocked slots
          const isBlocked = blockedForDate.some(blocked => {
            return timeRangesOverlap(slotStart, slotEnd, blocked.start, blocked.end);
          });

          if (!isBlocked) {
            availableSlots.push({
              date: dateString,
              dayName,
              startTime: slotStart,
              endTime: slotEnd,
              displayText: `${dayName}, ${displayDate} ${slotStart}-${slotEnd}`
            });
          }
        }
      });
    }

    // Sort by date and time
    // Prioritize slots on the same day as preferred date, then later dates
    availableSlots.sort((a, b) => {
      const aIsPreferredDay = isSameDay(new Date(a.date), startDate);
      const bIsPreferredDay = isSameDay(new Date(b.date), startDate);
      
      // Prioritize slots on the preferred day
      if (aIsPreferredDay && !bIsPreferredDay) return -1;
      if (!aIsPreferredDay && bIsPreferredDay) return 1;
      
      // Then sort by date
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      // Finally sort by time
      return a.startTime.localeCompare(b.startTime);
    });

    return availableSlots.slice(0, 3);
  } catch (error) {
    console.error('Error getting available time slots:', error);
    return [];
  }
};

// Helper function to check if two time ranges overlap
const timeRangesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);

  return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
};

// Helper function to convert time string to minutes since midnight
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Convert AvailableTimeSlot to ISO datetime string for booking
export const convertToISODateTime = (slot: AvailableTimeSlot): string => {
  const [hours, minutes] = slot.startTime.split(':').map(Number);
  const date = new Date(slot.date);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};