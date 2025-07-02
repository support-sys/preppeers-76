
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InterviewData {
  interviewer_id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  interviewer_email: string;
  target_role: string;
  experience: string;
  scheduled_time: string;
  status: string;
  resume_url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const interviewData: InterviewData = await req.json();
    
    // Create interview record in database
    const { data: interview, error: insertError } = await supabase
      .from('interviews')
      .insert({
        interviewer_id: interviewData.interviewer_id,
        candidate_id: interviewData.candidate_id,
        candidate_name: interviewData.candidate_name,
        candidate_email: interviewData.candidate_email,
        target_role: interviewData.target_role,
        experience: interviewData.experience,
        scheduled_time: interviewData.scheduled_time,
        status: interviewData.status,
        resume_url: interviewData.resume_url
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating interview:', insertError);
      throw insertError;
    }

    // Generate Google Meet link (in a real implementation, you'd use Google Calendar API)
    const meetLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 15)}`;

    // Update interview with meet link
    const { error: updateError } = await supabase
      .from('interviews')
      .update({ meet_link: meetLink })
      .eq('id', interview.id);

    if (updateError) {
      console.error('Error updating interview with meet link:', updateError);
    }

    // Send email notifications (placeholder - you would integrate with your email service)
    console.log('Sending email notifications...');
    console.log('Candidate email:', interviewData.candidate_email);
    console.log('Meet link:', meetLink);
    console.log('Scheduled time:', interviewData.scheduled_time);

    // Here you would integrate with your email service (Resend, SendGrid, etc.)
    // to send emails to both candidate and interviewer with the meet link and resume

    return new Response(
      JSON.stringify({ 
        success: true, 
        interview_id: interview.id,
        meet_link: meetLink 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error) {
    console.error('Error in schedule-interview function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
