/**
 * Resume Review Conversion Tracking
 * Tracks conversions from resume review to mock interview booking
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Track when a resume review user books a mock interview
 */
export const trackResumeReviewConversion = async (
  userEmail: string,
  interviewId: string
): Promise<void> => {
  try {
    // Find the most recent resume review for this email
    const { data: resumeReview, error: findError } = await supabase
      .from('resume_reviews')
      .select('id')
      .eq('user_email', userEmail)
      .eq('converted_to_booking', false)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error('Error finding resume review:', findError);
      return;
    }

    if (!resumeReview) {
      console.log('No resume review found for conversion tracking');
      return;
    }

    // Update the resume review to mark as converted
    const { error: updateError } = await supabase
      .from('resume_reviews')
      .update({
        converted_to_booking: true,
        booking_id: interviewId,
        conversion_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', resumeReview.id);

    if (updateError) {
      console.error('Error updating resume review conversion:', updateError);
    } else {
      console.log('✅ Resume review conversion tracked:', {
        reviewId: resumeReview.id,
        interviewId,
        userEmail
      });
    }
  } catch (error) {
    console.error('Error in trackResumeReviewConversion:', error);
  }
};

/**
 * Check if user has a resume review and get their data
 */
export const getResumeReviewData = async (userEmail: string) => {
  try {
    const { data, error } = await supabase
      .from('resume_reviews')
      .select('*')
      .eq('user_email', userEmail)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching resume review:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getResumeReviewData:', error);
    return null;
  }
};

/**
 * Get conversion rate statistics
 */
export const getResumeReviewConversionStats = async () => {
  try {
    const { data, error } = await supabase
      .from('resume_reviews')
      .select('converted_to_booking, submitted_at');

    if (error) {
      console.error('Error fetching conversion stats:', error);
      return null;
    }

    const total = data?.length || 0;
    const converted = data?.filter(r => r.converted_to_booking).length || 0;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return {
      total,
      converted,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  } catch (error) {
    console.error('Error in getResumeReviewConversionStats:', error);
    return null;
  }
};


