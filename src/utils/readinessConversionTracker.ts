import { supabase } from '@/integrations/supabase/client';

/**
 * Track conversion from readiness assessment to booking
 * This is called when a user successfully books a mock interview
 */
export const trackReadinessConversion = async (
  userEmail: string, 
  bookingId: string
): Promise<void> => {
  try {
    console.log('🔄 Tracking readiness conversion for:', userEmail, 'booking:', bookingId);
    
    // Find the most recent readiness assessment for this user
    const { data: assessment, error: fetchError } = await supabase
      .from('interview_readiness_assessments')
      .select('id, user_email, converted_to_booking')
      .eq('user_email', userEmail)
      .eq('converted_to_booking', false) // Only update unconverted assessments
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching readiness assessment:', fetchError);
      return;
    }

    if (!assessment) {
      console.log('ℹ️ No unconverted readiness assessment found for:', userEmail);
      return;
    }

    // Update the assessment to mark it as converted
    const { error: updateError } = await supabase
      .from('interview_readiness_assessments')
      .update({
        converted_to_booking: true,
        booking_id: bookingId,
        conversion_date: new Date().toISOString()
      })
      .eq('id', assessment.id);

    if (updateError) {
      console.error('❌ Error updating readiness conversion:', updateError);
      return;
    }

    console.log('✅ Readiness conversion tracked successfully:', {
      assessmentId: assessment.id,
      userEmail,
      bookingId,
      convertedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in trackReadinessConversion:', error);
  }
};

/**
 * Get conversion analytics for readiness assessments
 */
export const getReadinessConversionAnalytics = async () => {
  try {
    const { data, error } = await supabase
      .from('readiness_assessment_analytics')
      .select('*');

    if (error) {
      console.error('❌ Error fetching conversion analytics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error in getReadinessConversionAnalytics:', error);
    return null;
  }
};
