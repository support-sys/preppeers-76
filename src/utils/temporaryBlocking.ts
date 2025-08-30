import { supabase } from '@/integrations/supabase/client';
import { format, addMinutes } from 'date-fns';

export interface TemporaryReservation {
  id: string;
  interviewer_id: string;
  blocked_date: string;
  start_time: string;
  end_time: string;
  expires_at: string;
  reserved_by_user_id: string;
}

/**
 * Creates a temporary reservation for a time slot (10 minutes)
 * This prevents other users from booking the same slot during payment
 */
export const createTemporaryReservation = async (
  interviewerId: string,
  timeSlot: string,
  userId: string,
  durationMinutes: number = 30
): Promise<string> => {
  try {
    console.log(`🔒 Creating temporary reservation for ${timeSlot} (${durationMinutes} min)`);
    
    // Parse the time slot to get date and time components
    // Handle format: "Tuesday, 02/09/2025 17:30-18:00"
    const dateTimeMatch = timeSlot.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    
    if (!dateTimeMatch) {
      throw new Error(`Invalid time slot format: ${timeSlot}. Expected format: "DD/MM/YYYY HH:MM"`);
    }
    
    const [, day, month, year, hour, minute] = dateTimeMatch;
    
    // Create date in DD/MM/YYYY format (European format)
    const scheduledDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    const scheduledDateStr = format(scheduledDate, 'yyyy-MM-dd');
    const startTime = format(scheduledDate, 'HH:mm');
    const endTime = format(addMinutes(scheduledDate, durationMinutes), 'HH:mm');
    
    // Debug logging for date parsing
    console.log(`🔍 Date parsing debug:`);
    console.log(`  Original timeSlot: ${timeSlot}`);
    console.log(`  Parsed components: day=${day}, month=${month}, year=${year}, hour=${hour}, minute=${minute}`);
    console.log(`  Created Date object: ${scheduledDate.toISOString()}`);
    console.log(`  Formatted date: ${scheduledDateStr}`);
    console.log(`  Start time: ${startTime}, End time: ${endTime}`);
    
    // Calculate expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    console.log(`📅 Reservation details: ${scheduledDateStr} ${startTime}-${endTime}, expires at ${expiresAt.toISOString()}`);
    
    // Use the database function to create temporary reservation
    const { data, error } = await supabase.rpc('create_temporary_reservation', {
      p_interviewer_id: interviewerId,
      p_blocked_date: scheduledDateStr,
      p_start_time: startTime,
      p_end_time: endTime,
      p_reserved_by_user_id: userId,
      p_duration_minutes: 10
    });
    
    if (error) {
      console.error('❌ Error creating temporary reservation:', error);
      throw new Error(`Failed to reserve time slot: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Failed to create temporary reservation - no ID returned');
    }
    
    console.log(`✅ Temporary reservation created with ID: ${data}`);
    return data;
    
  } catch (error) {
    console.error('💥 Error in createTemporaryReservation:', error);
    throw error;
  }
};

/**
 * Updates a temporary reservation to permanent block after successful payment
 * Direct update - now that RLS policy is fixed
 */
export const updateTemporaryToPermanent = async (
  reservationId: string,
  interviewId: string
): Promise<void> => {
  try {
    console.log(`🔄 Converting temporary reservation ${reservationId} to permanent for interview ${interviewId}`);
    
    const { data: updateResult, error } = await supabase
      .from('interviewer_time_blocks')
      .update({
        is_temporary: false,
        expires_at: null,
        block_reason: 'interview_scheduled',
        interview_id: interviewId,
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)
      .eq('is_temporary', true)
      .select();
    
    if (error) {
      console.error('❌ Error updating temporary to permanent:', error);
      throw new Error(`Failed to update reservation: ${error.message}`);
    }
    
    if (!updateResult || updateResult.length === 0) {
      console.error('❌ No records were updated - record not found or conditions not met');
      throw new Error('No records were updated - record not found or conditions not met');
    }
    
    console.log('✅ Successfully converted temporary reservation to permanent');
    console.log('🔍 Debug: Updated record:', updateResult[0]);
    
  } catch (error) {
    console.error('💥 Error in updateTemporaryToPermanent:', error);
    throw error;
  }
};

/**
 * Converts a temporary reservation to a permanent block after successful payment
 * @deprecated Use updateTemporaryToPermanent instead for better reliability
 */
export const convertTemporaryToPermanent = async (
  reservationId: string,
  interviewId: string
): Promise<void> => {
  console.log('⚠️ convertTemporaryToPermanent is deprecated, using updateTemporaryToPermanent instead');
  return updateTemporaryToPermanent(reservationId, interviewId);
};

/**
 * Releases a temporary reservation (e.g., if payment fails or user cancels)
 */
export const releaseTemporaryReservation = async (reservationId: string): Promise<void> => {
  try {
    console.log(`🔓 Releasing temporary reservation ${reservationId}`);
    
    const { error } = await supabase
      .from('interviewer_time_blocks')
      .delete()
      .eq('id', reservationId)
      .eq('is_temporary', true);
    
    if (error) {
      console.error('❌ Error releasing temporary reservation:', error);
      throw new Error(`Failed to release reservation: ${error.message}`);
    }
    
    console.log(`✅ Successfully released temporary reservation`);
    
  } catch (error) {
    console.error('💥 Error in releaseTemporaryReservation:', error);
    throw error;
  }
};

/**
 * Checks if a time slot is available (considering temporary blocks)
 */
export const isTimeSlotAvailable = async (
  interviewerId: string,
  timeSlot: string,
  durationMinutes: number = 30
): Promise<boolean> => {
  try {
    console.log(`🔍 Checking availability for ${timeSlot} (${durationMinutes} min)`);
    
    const scheduledDate = new Date(timeSlot);
    const scheduledDateStr = format(scheduledDate, 'yyyy-MM-dd');
    const startTime = format(scheduledDate, 'HH:mm');
    const endTime = format(addMinutes(scheduledDate, durationMinutes), 'HH:mm');
    
    // Use the database function to check availability
    const { data, error } = await supabase.rpc('is_time_slot_available', {
      p_interviewer_id: interviewerId,
      p_blocked_date: scheduledDateStr,
      p_start_time: startTime,
      p_end_time: endTime
    });
    
    if (error) {
      console.error('❌ Error checking time slot availability:', error);
      return false; // Assume unavailable on error
    }
    
    const isAvailable = data === true;
    console.log(`📊 Time slot availability: ${isAvailable ? '✅ AVAILABLE' : '❌ UNAVAILABLE'}`);
    
    return isAvailable;
    
  } catch (error) {
    console.error('💥 Error in isTimeSlotAvailable:', error);
    return false; // Assume unavailable on error
  }
};

/**
 * Gets all temporary reservations for a user
 */
export const getUserTemporaryReservations = async (userId: string): Promise<TemporaryReservation[]> => {
  try {
    console.log(`🔍 Fetching temporary reservations for user ${userId}`);
    
    const { data, error } = await supabase
      .from('interviewer_time_blocks')
      .select('*')
      .eq('reserved_by_user_id', userId)
      .eq('is_temporary', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching user temporary reservations:', error);
      throw new Error(`Failed to fetch reservations: ${error.message}`);
    }
    
    console.log(`✅ Found ${data?.length || 0} active temporary reservations`);
    return data || [];
    
  } catch (error) {
    console.error('💥 Error in getUserTemporaryReservations:', error);
    throw error;
  }
};

/**
 * Cleans up expired temporary reservations (can be called periodically)
 */
export const cleanupExpiredReservations = async (): Promise<number> => {
  try {
    console.log('🧹 Cleaning up expired temporary reservations...');
    
    const { data, error } = await supabase.rpc('cleanup_expired_temporary_blocks');
    
    if (error) {
      console.error('❌ Error cleaning up expired reservations:', error);
      throw new Error(`Failed to cleanup: ${error.message}`);
    }
    
    console.log('✅ Cleanup completed successfully');
    return 1; // Return count of cleaned up reservations
    
  } catch (error) {
    console.error('💥 Error in cleanupExpiredReservations:', error);
    throw error;
  }
};

/**
 * Gets reservation details by ID
 */
export const getReservationDetails = async (reservationId: string): Promise<TemporaryReservation | null> => {
  try {
    console.log(`🔍 Fetching reservation details for ${reservationId}`);
    
    const { data, error } = await supabase
      .from('interviewer_time_blocks')
      .select('*')
      .eq('id', reservationId)
      .eq('is_temporary', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️ Reservation not found');
        return null;
      }
      console.error('❌ Error fetching reservation details:', error);
      throw new Error(`Failed to fetch reservation: ${error.message}`);
    }
    
    console.log(`✅ Found reservation: ${data.blocked_date} ${data.start_time}-${data.end_time}`);
    return data;
    
  } catch (error) {
    console.error('💥 Error in getReservationDetails:', error);
    throw error;
  }
};
