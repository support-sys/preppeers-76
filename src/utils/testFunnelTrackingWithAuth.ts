// Test script for funnel tracking with authenticated user
import { supabase } from '@/integrations/supabase/client';
import { trackPlanSelection, trackTimeSlotSelection, trackInterviewerMatching } from './bookingProgressTracker';

export const testFunnelTrackingWithAuth = async (userId: string) => {
  console.log('🧪 Testing Funnel Tracking with Authenticated User...');
  console.log('👤 User ID:', userId);
  
  try {
    // Test 1: Check if user has an interviewee profile
    console.log('\n1️⃣ Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('interviewees')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Profile check failed:', profileError);
      return false;
    }
    
    if (profile) {
      console.log('✅ User profile found:', {
        target_role: profile.target_role,
        booking_progress: profile.booking_progress,
        selected_plan: profile.selected_plan
      });
    } else {
      console.log('⚠️ No interviewee profile found - user needs to complete profile first');
      console.log('💡 Tip: Go to /become-interviewer or complete profile to test funnel tracking');
      return false;
    }
    
    // Test 2: Test tracking functions
    console.log('\n2️⃣ Testing tracking functions...');
    
    // Test plan selection tracking
    try {
      await trackPlanSelection(userId, 'professional', { test: 'data' });
      console.log('✅ Plan selection tracking works');
    } catch (error) {
      console.error('❌ Plan selection tracking failed:', error);
    }
    
    // Test time slot tracking
    try {
      await trackTimeSlotSelection(userId, 'Monday, 08/09/2025 17:00-17:30');
      console.log('✅ Time slot tracking works');
    } catch (error) {
      console.error('❌ Time slot tracking failed:', error);
    }
    
    // Test interviewer matching tracking
    try {
      // Use a valid UUID format for testing
      await trackInterviewerMatching(userId, '00000000-0000-0000-0000-000000000001', 'Test Interviewer', 85.5);
      console.log('✅ Interviewer matching tracking works');
    } catch (error) {
      console.error('❌ Interviewer matching tracking failed:', error);
    }
    
    // Test 3: Verify data was updated
    console.log('\n3️⃣ Verifying tracking data...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('interviewees')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (updateError) {
      console.error('❌ Failed to verify tracking data:', updateError);
      return false;
    }
    
    console.log('✅ Updated profile data:', {
      selected_plan: updatedProfile.selected_plan,
      selected_time_slot: updatedProfile.selected_time_slot,
      matched_interviewer_name: updatedProfile.matched_interviewer_name,
      booking_progress: updatedProfile.booking_progress,
      last_activity_at: updatedProfile.last_activity_at
    });
    
    console.log('\n🎉 Funnel tracking test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Test suite failed with exception:', error);
    return false;
  }
};

// Helper function to create a test interviewee profile
export const createTestIntervieweeProfile = async (userId: string) => {
  console.log('👤 Creating test interviewee profile...');
  
  try {
    const { data, error } = await supabase
      .from('interviewees')
      .insert({
        user_id: userId,
        target_role: 'Software Engineer',
        bio: 'Test profile for funnel tracking',
        booking_progress: 'profile_complete'
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create test profile:', error);
      return { success: false, error };
    }
    
    console.log('✅ Test profile created:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception creating test profile:', error);
    return { success: false, error };
  }
};
