import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay, isSameDay } from 'date-fns';

export interface AvailableTimeSlot {
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
  daysToCheck: number = 14,
  planDuration: number = 60, // Duration in minutes, default 60
  userId?: string // Add user ID for RLS authentication
  
): Promise<AvailableTimeSlot[]> => {
  console.log('🔍 === AVAILABLE TIME SLOTS FUNCTION START ===');
  console.log('🔍 Parameters:', { interviewerId, planDuration, daysToCheck, candidatePreferredDate });
  console.log('🔍 Interviewer time slots:', interviewerTimeSlots);
  
  if (!interviewerTimeSlots) return [];

  // Parse the JSON string if it's a string
  let parsedTimeSlots = interviewerTimeSlots;
  if (typeof interviewerTimeSlots === 'string') {
    try {
      parsedTimeSlots = JSON.parse(interviewerTimeSlots);
      console.log('🔍 Parsed time slots from JSON string:', parsedTimeSlots);
    } catch (error) {
      console.error('❌ Error parsing time slots JSON:', error);
      return [];
    }
  }

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
    console.log('🔍 Checking date range:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));
    console.log('🔍 Interviewer ID:', interviewerId);
    
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    console.log('🔍 Query parameters:', {
      interviewerId,
      startDateStr,
      endDateStr,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    // Try different date formats to debug the issue
    console.log('🔍 Attempting query with date strings:', startDateStr, 'to', endDateStr);
    
    // Create authenticated Supabase client if userId is provided
    let supabaseClient = supabase;
    if (userId) {
      console.log('🔍 Using authenticated client for user:', userId);
      // For RLS to work, we need to ensure the user is authenticated
      // The existing client should work if the user is logged in
    }
    
    // Try multiple approaches to get blocked slots due to potential RLS issues
    let blockedSlots: any[] = [];
    let error: any = null;

    // Approach 1: Try the original query
    const { data: blockedSlots1, error: error1 } = await supabaseClient
      .from('interviewer_time_blocks')
      .select('blocked_date, start_time, end_time, is_temporary, expires_at')
      .eq('interviewer_id', interviewerId)
      .gte('blocked_date', startDateStr)
      .lte('blocked_date', endDateStr);

    if (!error1 && blockedSlots1) {
      blockedSlots = blockedSlots1;
      console.log('🔍 Blocked slots from database (approach 1):', blockedSlots);
    } else {
      console.log('🔍 Approach 1 failed:', error1);
      
      // Approach 2: Try without date filters
      const { data: blockedSlots2, error: error2 } = await supabaseClient
        .from('interviewer_time_blocks')
        .select('blocked_date, start_time, end_time, is_temporary, expires_at')
        .eq('interviewer_id', interviewerId);

      if (!error2 && blockedSlots2) {
        // Filter manually by date
        blockedSlots = blockedSlots2.filter(slot => 
          slot.blocked_date >= startDateStr && slot.blocked_date <= endDateStr
        );
        console.log('🔍 Blocked slots from database (approach 2):', blockedSlots);
      } else {
        console.log('🔍 Approach 2 failed:', error2);
        
        // Approach 3: Try with different client (unauthenticated)
        const { data: blockedSlots3, error: error3 } = await supabase
          .from('interviewer_time_blocks')
          .select('blocked_date, start_time, end_time, is_temporary, expires_at')
          .eq('interviewer_id', interviewerId)
          .gte('blocked_date', startDateStr)
          .lte('blocked_date', endDateStr);

        if (!error3 && blockedSlots3) {
          blockedSlots = blockedSlots3;
          console.log('🔍 Blocked slots from database (approach 3):', blockedSlots);
        } else {
          console.log('🔍 Approach 3 failed:', error3);
          error = error3;
        }
      }
    }

    console.log('🔍 Final blocked slots count:', blockedSlots ? blockedSlots.length : 0);
    
    // Test query: Check if there are ANY blocked slots for this interviewer
    const { data: allBlockedSlots, error: testError } = await supabaseClient
      .from('interviewer_time_blocks')
      .select('blocked_date, start_time, end_time, interviewer_id')
      .eq('interviewer_id', interviewerId);
    
    // Also test: Check if there are ANY rows in the table at all
    const { data: anyBlockedSlots, error: anyError } = await supabaseClient
      .from('interviewer_time_blocks')
      .select('blocked_date, start_time, end_time, interviewer_id')
      .limit(5);
    
    // Test: Check for the specific date we know exists
    const { data: specificDateSlots, error: specificError } = await supabaseClient
      .from('interviewer_time_blocks')
      .select('blocked_date, start_time, end_time, interviewer_id')
      .eq('blocked_date', '2025-09-02');
    
    if (testError) {
      console.error('Test query error:', testError);
    } else {
      console.log('🔍 ALL blocked slots for this interviewer (no date filter):', allBlockedSlots);
      console.log('🔍 Total blocked slots found (no date filter):', allBlockedSlots ? allBlockedSlots.length : 0);
    }
    
    if (anyError) {
      console.error('Any blocked slots query error:', anyError);
    } else {
      console.log('🔍 ANY blocked slots in table (no filters):', anyBlockedSlots);
      console.log('🔍 Total rows in table:', anyBlockedSlots ? anyBlockedSlots.length : 0);
    }
    
    if (specificError) {
      console.error('Specific date query error:', specificError);
    } else {
      console.log('🔍 Specific date 2025-09-02 query result:', specificDateSlots);
      console.log('🔍 Total rows for 2025-09-02:', specificDateSlots ? specificDateSlots.length : 0);
    }



    // Convert blocked slots to a map for quick lookup
    const blockedSlotsMap = new Map<string, Array<{start: string, end: string}>>();
    (blockedSlots || []).forEach(slot => {
      // Check if this is a temporary reservation that has expired
      if (slot.is_temporary && slot.expires_at) {
        const now = new Date();
        const expiresAt = new Date(slot.expires_at);
        if (now > expiresAt) {
          console.log(`🔍 Skipping expired temporary reservation: ${slot.blocked_date} ${slot.start_time}-${slot.end_time}`);
          return; // Skip expired temporary reservations
        }
      }
      
      const dateKey = slot.blocked_date;
      console.log(`🔍 Processing blocked slot: date=${dateKey}, start=${slot.start_time}, end=${slot.end_time}, temporary=${slot.is_temporary}, expires=${slot.expires_at}`);
      
      if (!blockedSlotsMap.has(dateKey)) {
        blockedSlotsMap.set(dateKey, []);
      }
      blockedSlotsMap.get(dateKey)!.push({
        start: slot.start_time,
        end: slot.end_time
      });
    });

    // Note: We're no longer fetching scheduled_interviews as blocked slots
    // because interviewer_time_blocks already contains the correct blocked time data
    // This prevents duplicate blocking and ensures accurate availability
    console.log('🔍 Using only interviewer_time_blocks for blocked slots (no scheduled_interviews)');



    console.log('🔍 Final blocked slots map:', Object.fromEntries(blockedSlotsMap));

    // Check each day starting from the preferred date
    for (let i = 0; i <= daysToCheck; i++) {
      const checkDate = addDays(startDate, i);
      const dayName = format(checkDate, 'EEEE'); // Monday, Tuesday, etc.
      const dateString = format(checkDate, 'yyyy-MM-dd');
      const displayDate = format(checkDate, 'dd/MM/yyyy');

      console.log(`🔍 Checking day ${i}: ${dayName} ${dateString}`);

      // Check if this day has available slots in interviewer's schedule
      const daySlots = parsedTimeSlots[dayName];
      if (!daySlots || !Array.isArray(daySlots)) {
        console.log(`🔍 No slots for ${dayName}, skipping`);
        continue;
      }

      console.log(`🔍 Found ${daySlots.length} slots for ${dayName}:`, daySlots);

      // Get blocked slots for this specific date
      const blockedForDate = blockedSlotsMap.get(dateString) || [];
      console.log(`🔍 Blocked slots for ${dateString}:`, blockedForDate);

      // Check each available slot against blocked slots
      daySlots.forEach((slot: any, slotIndex: number) => {
        if (typeof slot === 'object' && slot.start && slot.end) {
          console.log(`🔍 Processing slot ${slotIndex + 1}: ${slot.start}-${slot.end}`);
          
          // Slice the time slot into smaller segments based on plan duration
          const slicedSegments = sliceTimeSlot(slot.start, slot.end, planDuration);
          console.log(`🔍 Sliced into ${slicedSegments.length} segments:`, slicedSegments);
          
          // Check each segment individually
          slicedSegments.forEach((segment, segmentIndex) => {
            console.log(`🔍 Checking segment ${segmentIndex + 1}: ${segment.start}-${segment.end}`);
            
            // Check if this segment conflicts with any blocked slots
            const isBlocked = blockedForDate.some(blocked => {
              const overlap = timeRangesOverlap(segment.start, segment.end, blocked.start, blocked.end);
              console.log(`🔍 Segment ${segment.start}-${segment.end} vs blocked ${blocked.start}-${blocked.end}: overlap = ${overlap}`);
              return overlap;
            });

            if (!isBlocked) {
              console.log(`✅ Segment ${segment.start}-${segment.end} is AVAILABLE!`);
              availableSlots.push({
                date: dateString,
                dayName,
                startTime: segment.start,
                endTime: segment.end,
                displayText: `${dayName}, ${displayDate} ${segment.start}-${segment.end}`
              });
            } else {
              console.log(`❌ Segment ${segment.start}-${segment.end} is BLOCKED`);
            }
          });
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

    console.log('🔍 Total available slots found:', availableSlots.length);
    console.log('🔍 Available slots:', availableSlots.map(slot => `${slot.dayName}, ${slot.date} ${slot.startTime}-${slot.endTime}`));

    const finalSlots = availableSlots.slice(0, 6); // Return first 6 slots to show more options
    console.log('🔍 Final sorted slots (first 6):', finalSlots.map(slot => `${slot.dayName}, ${slot.date} ${slot.startTime}-${slot.endTime}`));
    console.log('🔍 === AVAILABLE TIME SLOTS FUNCTION END ===');
    
    return finalSlots;
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

// Helper function to slice a time slot into smaller segments based on plan duration
const sliceTimeSlot = (startTime: string, endTime: string, planDuration: number): Array<{start: string, end: string}> => {
  const segments: Array<{start: string, end: string}> = [];
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const totalDuration = endMinutes - startMinutes;
  
  if (totalDuration >= planDuration) {
    const numSegments = Math.floor(totalDuration / planDuration);
    
    for (let i = 0; i < numSegments; i++) {
      const segmentStartMinutes = startMinutes + (i * planDuration);
      const segmentEndMinutes = segmentStartMinutes + planDuration;
      
      // Ensure we don't exceed the original end time
      if (segmentEndMinutes > endMinutes) {
        break;
      }
      
      const segmentStart = `${Math.floor(segmentStartMinutes / 60).toString().padStart(2, '0')}:${(segmentStartMinutes % 60).toString().padStart(2, '0')}`;
      const segmentEnd = `${Math.floor(segmentEndMinutes / 60).toString().padStart(2, '0')}:${(segmentEndMinutes % 60).toString().padStart(2, '0')}`;
      
      segments.push({ start: segmentStart, end: segmentEnd });
    }
  }
  
  return segments;
};

// Convert AvailableTimeSlot to ISO datetime string for booking
export const convertToISODateTime = (slot: AvailableTimeSlot): string => {
  const [hours, minutes] = slot.startTime.split(':').map(Number);
  const date = new Date(slot.date);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};