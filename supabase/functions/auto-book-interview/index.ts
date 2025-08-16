import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoBookRequest {
  payment_session_id: string;
  user_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Auto-Book Interview Function Started ===');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { payment_session_id, user_id }: AutoBookRequest = await req.json();
    
    if (!payment_session_id || !user_id) {
      throw new Error('Missing required parameters: payment_session_id and user_id');
    }

    console.log('Processing auto-book for:', { payment_session_id, user_id });

    // Get the payment session with candidate data
    const { data: paymentSession, error: sessionError } = await supabaseClient
      .from('payment_sessions')
      .select('*')
      .eq('id', payment_session_id)
      .eq('user_id', user_id)
      .eq('payment_status', 'completed')
      .single();

    if (sessionError || !paymentSession) {
      console.error('Payment session not found or not completed:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Payment session not found or not completed' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if interview is already booked
    if (paymentSession.interview_matched) {
      console.log('Interview already matched for this payment session');
      return new Response(
        JSON.stringify({ message: 'Interview already booked', interview_matched: true }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user profile for email and name
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', user_id)
      .single();

    if (profileError || !userProfile) {
      console.error('User profile not found:', profileError);
      throw new Error('User profile not found');
    }

    const candidateData = paymentSession.candidate_data;
    
    // Check if candidate has selected a specific time slot
    if (!candidateData.selectedTimeSlot && !candidateData.timeSlot) {
      console.log('No specific time slot selected by candidate');
      return new Response(
        JSON.stringify({ message: 'No specific time slot selected' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Find matching interviewer
    console.log('Finding matching interviewer...');
    const matchingResponse = await supabaseClient.functions.invoke('find-matching-interviewer', {
      body: {
        experienceYears: candidateData.experienceYears,
        skillCategories: candidateData.skillCategories,
        specificSkills: candidateData.specificSkills,
        timeSlot: candidateData.selectedTimeSlot || candidateData.timeSlot,
        experience: candidateData.experienceYears?.toString(),
        resume: candidateData.resume,
        currentPosition: candidateData.currentPosition,
        company: candidateData.company
      }
    });

    if (matchingResponse.error) {
      console.error('Error finding matching interviewer:', matchingResponse.error);
      throw new Error('Failed to find matching interviewer');
    }

    const matchedInterviewer = matchingResponse.data;
    
    if (!matchedInterviewer) {
      console.log('No matching interviewer found');
      return new Response(
        JSON.stringify({ message: 'No matching interviewer found' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check availability one more time before booking
    const selectedTimeSlot = candidateData.selectedTimeSlot || candidateData.timeSlot;
    let canBookDirectly = false;
    
    if (matchedInterviewer.timeMatch) {
      // Exact time match - can book directly
      canBookDirectly = true;
      console.log('✅ Exact time match found - booking directly');
    } else if (matchedInterviewer.alternativeTimeSlots && matchedInterviewer.alternativeTimeSlots.length > 0) {
      // Check if the selected time slot is in alternatives
      const isInAlternatives = matchedInterviewer.alternativeTimeSlots.some((slot: string) => 
        slot === selectedTimeSlot
      );
      if (isInAlternatives) {
        canBookDirectly = true;
        console.log('✅ Selected time slot available in alternatives - booking directly');
      }
    }

    if (!canBookDirectly) {
      console.log('❌ Selected time slot not available - cannot auto-book');
      return new Response(
        JSON.stringify({ 
          message: 'Selected time slot not available', 
          matched_interviewer: matchedInterviewer 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Book the interview
    console.log('📅 Booking interview automatically...');
    const scheduleResponse = await supabaseClient.functions.invoke('schedule-interview', {
      body: {
        interviewer_id: matchedInterviewer.id,
        candidate_id: userProfile.email,
        candidate_name: userProfile.full_name || userProfile.email.split('@')[0],
        candidate_email: userProfile.email,
        interviewer_email: matchedInterviewer.interviewer_email,
        interviewer_name: matchedInterviewer.interviewer_name,
        target_role: candidateData.skillCategories?.join(', ') || 'Not specified',
        experience: candidateData.experienceYears?.toString() || 'Not specified',
        scheduled_time: selectedTimeSlot,
        status: 'scheduled',
        resume_url: candidateData.resumeUrl
      }
    });

    if (scheduleResponse.error) {
      console.error('Error scheduling interview:', scheduleResponse.error);
      throw new Error('Failed to schedule interview');
    }

    // Update payment session to mark interview as matched
    const { error: updateError } = await supabaseClient
      .from('payment_sessions')
      .update({ 
        interview_matched: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment_session_id);

    if (updateError) {
      console.error('Error updating payment session:', updateError);
      // Don't throw error here as interview is already booked
    }

    console.log('✅ Interview automatically booked successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Interview automatically booked',
        interview: scheduleResponse.data,
        interviewer: matchedInterviewer
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in auto-book-interview:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});