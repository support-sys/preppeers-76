// Utility functions to track booking progress in the interviewees table
import { supabase } from '@/integrations/supabase/client';

export interface BookingProgressData {
  selected_plan?: string;
  selected_time_slot?: string;
  matched_interviewer_id?: string;
  matched_interviewer_name?: string;
  booking_progress: 'profile_complete' | 'plan_selected' | 'time_selected' | 'matched' | 'payment_initiated' | 'completed';
  form_data?: any;
  match_score?: number;
  payment_session_id?: string;
}

/**
 * Update booking progress for an interviewee
 */
export const updateBookingProgress = async (
  userId: string, 
  progressData: BookingProgressData
): Promise<{ error: any }> => {
  try {
    console.log('📊 Updating booking progress for user:', userId, progressData);

    const updateData = {
      ...progressData,
      last_activity_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('interviewees')
      .update(updateData)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error updating booking progress:', error);
      return { error };
    }

    console.log('✅ Booking progress updated successfully');
    return { error: null };
  } catch (error) {
    console.error('❌ Exception updating booking progress:', error);
    return { error };
  }
};

/**
 * Get booking progress for an interviewee
 */
export const getBookingProgress = async (userId: string): Promise<{ data: any, error: any }> => {
  try {
    const { data, error } = await supabase
      .from('interviewees')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ Error getting booking progress:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('❌ Exception getting booking progress:', error);
    return { data: null, error };
  }
};

/**
 * Track plan selection
 */
export const trackPlanSelection = async (userId: string, selectedPlan: string, formData: any) => {
  console.log('📊 trackPlanSelection called with:', {
    userId,
    selectedPlan,
    selectedPlanType: typeof selectedPlan,
    formDataSelectedPlan: formData?.selectedPlan
  });
  
  return updateBookingProgress(userId, {
    selected_plan: selectedPlan,
    booking_progress: 'plan_selected',
    form_data: formData
  });
};

/**
 * Track time slot selection
 */
export const trackTimeSlotSelection = async (userId: string, timeSlot: string) => {
  return updateBookingProgress(userId, {
    selected_time_slot: timeSlot,
    booking_progress: 'time_selected'
  });
};

/**
 * Track interviewer matching
 */
export const trackInterviewerMatching = async (
  userId: string, 
  interviewerId: string, 
  interviewerName: string,
  matchScore: number
) => {
  return updateBookingProgress(userId, {
    matched_interviewer_id: interviewerId,
    matched_interviewer_name: interviewerName,
    match_score: matchScore,
    booking_progress: 'matched'
  });
};

/**
 * Track payment initiation
 */
export const trackPaymentInitiation = async (userId: string, paymentSessionId: string) => {
  return updateBookingProgress(userId, {
    payment_session_id: paymentSessionId,
    booking_progress: 'payment_initiated'
  });
};

/**
 * Track completion
 */
export const trackBookingCompletion = async (userId: string) => {
  return updateBookingProgress(userId, {
    booking_progress: 'completed'
  });
};

/**
 * Get funnel analytics data
 */
export const getFunnelAnalytics = async (dateRange?: { from: string, to: string }) => {
  try {
    let query = supabase
      .from('interviewees')
      .select('booking_progress, selected_plan, created_at, last_activity_at, match_score');

    if (dateRange) {
      query = query.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error getting funnel analytics:', error);
      return { data: null, error };
    }

    // Process data for funnel analysis
    const funnelData = {
      total_users: data.length,
      profile_complete: data.filter(d => d.booking_progress === 'profile_complete').length,
      plan_selected: data.filter(d => d.booking_progress === 'plan_selected').length,
      time_selected: data.filter(d => d.booking_progress === 'time_selected').length,
      matched: data.filter(d => d.booking_progress === 'matched').length,
      payment_initiated: data.filter(d => d.booking_progress === 'payment_initiated').length,
      completed: data.filter(d => d.booking_progress === 'completed').length,
      plan_distribution: {
        essential: data.filter(d => d.selected_plan === 'essential').length,
        professional: data.filter(d => d.selected_plan === 'professional').length
      },
      avg_match_score: data.reduce((sum, d) => sum + (d.match_score || 0), 0) / data.length
    };

    return { data: funnelData, error: null };
  } catch (error) {
    console.error('❌ Exception getting funnel analytics:', error);
    return { data: null, error };
  }
};
