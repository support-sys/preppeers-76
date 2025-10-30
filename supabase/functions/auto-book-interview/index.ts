import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    console.log('=== Auto-Book Interview Function Started ===');
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { payment_session_id, user_id } = await req.json();
    if (!payment_session_id || !user_id) {
      throw new Error('Missing required parameters: payment_session_id and user_id');
    }
    console.log('Processing auto-book for:', {
      payment_session_id,
      user_id
    });
    // Get the payment session with candidate data
    const { data: paymentSession, error: sessionError } = await supabaseClient.from('payment_sessions').select('*').eq('id', payment_session_id).eq('user_id', user_id).eq('payment_status', 'completed').single();
    if (sessionError || !paymentSession) {
      console.error('Payment session not found or not completed:', sessionError);
      return new Response(JSON.stringify({
        error: 'Payment session not found or not completed'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Check if interview is already booked
    if (paymentSession.interview_matched) {
      console.log('Interview already matched for this payment session');
      return new Response(JSON.stringify({
        message: 'Interview already booked',
        interview_matched: true
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get user profile for email and name
    const { data: userProfile, error: profileError } = await supabaseClient.from('profiles').select('email, full_name').eq('id', user_id).single();
    if (profileError || !userProfile) {
      console.error('User profile not found:', profileError);
      throw new Error('User profile not found');
    }
    const candidateData = paymentSession.candidate_data;
    // Check if candidate has selected a specific time slot
    if (!candidateData.selectedTimeSlot && !candidateData.timeSlot) {
      console.log('No specific time slot selected by candidate');
      return new Response(JSON.stringify({
        message: 'No specific time slot selected'
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Use pre-matched interviewer from payment session (no need to re-run matching)
    console.log('Using pre-matched interviewer from payment session...');
    const matchedInterviewer = paymentSession.matched_interviewer;
    const interviewerId = paymentSession.interviewer_id;
    
    if (!matchedInterviewer || !interviewerId) {
      console.error('No pre-matched interviewer found in payment session');
      return new Response(JSON.stringify({
        error: 'No pre-matched interviewer found',
        message: 'Interviewer should have been matched during payment process'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    console.log('Pre-matched interviewer basic info:', {
      id: interviewerId,
      company: matchedInterviewer.company,
      match_score: matchedInterviewer.match_score
    });
    
    // Fetch complete interviewer details from database
    console.log('Fetching complete interviewer details from database...');
    const { data: interviewerDetails, error: interviewerError } = await supabaseClient
      .from('interviewers')
      .select(`
        id,
        user_id,
        company,
        position,
        bio,
        linkedin_url,
        github_url,
        skills,
        technologies,
        experience_years,
        current_time_slots,
        time_slots
      `)
      .eq('id', interviewerId)
      .single();
      
    if (interviewerError || !interviewerDetails) {
      console.error('Error fetching interviewer details:', interviewerError);
      throw new Error('Interviewer details not found');
    }
    
    // Fetch interviewer's email and name from profiles table
    const { data: interviewerProfile, error: interviewerProfileError } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', interviewerDetails.user_id)
      .single();
      
    if (interviewerProfileError || !interviewerProfile) {
      console.error('Error fetching interviewer profile:', interviewerProfileError);
      throw new Error('Interviewer profile not found');
    }
    
    const interviewerEmail = interviewerProfile.email;
    const interviewerName = interviewerProfile.full_name || interviewerProfile.email.split('@')[0];
    
    console.log('Complete interviewer details:', {
      id: interviewerId,
      name: interviewerName,
      email: interviewerEmail,
      company: interviewerDetails.company,
      match_score: matchedInterviewer.match_score
    });
    // Get the selected time slot - this is the candidate's FINAL selection from PlanSelection
    // They already chose this slot from available alternatives, so we can book it directly
    // IMPORTANT: Check candidateData first as it has the correct value, then fallback to paymentSession
    const selectedTimeSlot = candidateData.selectedTimeSlot || candidateData.timeSlot;
    
    if (!selectedTimeSlot) {
      console.log('❌ No time slot selected - cannot auto-book');
      return new Response(JSON.stringify({
        message: 'No time slot selected',
        matched_interviewer: matchedInterviewer
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    console.log('✅ Time slot selected:', selectedTimeSlot, '- proceeding to book');
    console.log('📅 Booking interview automatically...');
    // Convert human-readable time slot to ISO timestamp for database
    let scheduledTimeISO = selectedTimeSlot;
    if (selectedTimeSlot && !selectedTimeSlot.includes('T')) {
      try {
        // Parse format: "Monday, 08/09/2025 17:00-17:30"
        const match = selectedTimeSlot.match(/(\w+), (\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
        if (match) {
          const [, day, date, month, year, hour, minute] = match;
          // The input time is intended to be 17:30 IST
          // We need to store it as a simple date string without timezone conversion
          const dateString = `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
          scheduledTimeISO = dateString;
          console.log('🕐 Converted time slot:', {
            original: selectedTimeSlot,
            intended: `${year}-${month}-${date} ${hour}:${minute} IST`,
            iso: scheduledTimeISO
          });
        }
      } catch (error) {
        console.error('Error converting time slot:', error);
      // Fallback to original
      }
    }

    // Extract add-ons data from payment session
    const selected_add_ons = paymentSession.selected_add_ons;
    const add_ons_total = paymentSession.add_ons_total;
    
    console.log('📦 Add-ons data from payment session:', {
      selected_add_ons,
      add_ons_total
    });

    const scheduleResponse = await supabaseClient.functions.invoke('schedule-interview', {
      body: {
        interviewer_id: interviewerId,
        candidate_id: userProfile.email,
        candidate_name: userProfile.full_name || userProfile.email.split('@')[0],
        candidate_email: userProfile.email,
        interviewer_email: interviewerEmail,
        interviewer_name: interviewerName,
        target_role: candidateData.skillCategories?.join(', ') || 'Not specified',
        experience: candidateData.experienceYears?.toString() || 'Not specified',
        scheduled_time: scheduledTimeISO,
        status: 'scheduled',
        resume_url: candidateData.resumeUrl,
        // FIX: Add missing plan data to ensure interview record matches payment session
        selected_plan: candidateData.selectedPlan || candidateData.selected_plan,
        interview_duration: candidateData.interviewDuration || candidateData.interview_duration || candidateData.plan_duration,
        plan_details: candidateData.plan_details,
        // FIX: Add missing specific skills to ensure interview record includes candidate skills
        specific_skills: candidateData.specificSkills || [],
        // ADD-ONS: Include add-ons data in interview scheduling
        selected_add_ons: selected_add_ons,
        add_ons_total: add_ons_total
      },
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      }
    });
    if (scheduleResponse.error) {
      console.error('Error scheduling interview:', scheduleResponse.error);
      throw new Error('Failed to schedule interview');
    }
    // Debug: Check what's in the schedule response
    console.log('🔄 Schedule response data:', scheduleResponse.data);
    console.log('🔄 Interview ID from response:', scheduleResponse.data?.interview?.id);
    // Update temporary reservation to interview_scheduled after successful interview scheduling
    // Force deployment - added comprehensive debugging for temporary reservation cleanup
    console.log('🔄 Updating temporary reservation to interview_scheduled...');
    try {
      // Parse the time slot to get the date for update
      if (selectedTimeSlot) {
        console.log('🔄 Parsing time slot:', selectedTimeSlot);
        // Handle formats: "Monday, 08/09/2025 17:00-17:30" and "Tuesday, 02/09/2025 17:30-18:00"
        // The system generates different date formats, so we need a more flexible regex
        // Also handle potential variations in spacing and formatting
        const match = selectedTimeSlot.match(/(\w+),\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
        if (match) {
          const [, day, date, month, year, hour, minute] = match;
          const blockDate = `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}`;
          const startTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
          console.log('🔄 Extracted components:', {
            day,
            date,
            month,
            year,
            hour,
            minute
          });
          console.log('🔄 Looking for:', {
            blockDate,
            startTime
          });
          // Update the temporary reservation to interview_scheduled
          const { error: updateBlockError } = await supabaseClient.from('interviewer_time_blocks').update({
            block_reason: 'interview_scheduled',
            is_temporary: false,
            interview_id: scheduleResponse.data?.interview?.id || null,
            updated_at: new Date().toISOString(),
            expires_at: null // Remove expiration since it's now a permanent block
          }).eq('interviewer_id', matchedInterviewer.id).eq('blocked_date', blockDate).eq('start_time', startTime).eq('block_reason', 'temporary_reservation').eq('is_temporary', true);
          if (updateBlockError) {
            console.error('Warning: Failed to update temporary reservation:', updateBlockError);
            console.error('Update query details:', {
              blockDate,
              startTime,
              interviewerId: matchedInterviewer.id
            });
          } else {
            console.log('✅ Temporary reservation updated to interview_scheduled successfully');
          }
        } else {
          console.error('❌ Failed to parse time slot format:', selectedTimeSlot);
        }
      } else {
        console.log('🔄 Skipping cleanup - time slot format not supported:', selectedTimeSlot);
      }
    } catch (updateBlockError) {
      console.error('Warning: Error during temporary reservation update:', updateBlockError);
    // Don't fail the interview booking if update fails
    }
    // Update payment session to mark interview as matched
    const { error: updateError } = await supabaseClient.from('payment_sessions').update({
      interview_matched: true,
      updated_at: new Date().toISOString()
    }).eq('id', payment_session_id);
    if (updateError) {
      console.error('Error updating payment session:', updateError);
    // Don't throw error here as interview is already booked
    }
    console.log('✅ Interview automatically booked successfully');
    return new Response(JSON.stringify({
      success: true,
      message: 'Interview automatically booked',
      interview: scheduleResponse.data,
      interviewer: matchedInterviewer
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in auto-book-interview:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
