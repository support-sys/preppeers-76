
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InterviewData {
  interviewer_id: string;
  interviewer_user_id?: string; // Add user_id for profile lookup
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  interviewer_email?: string; // Make optional since we'll look it up
  interviewer_name?: string; // Make optional since we'll look it up
  target_role: string;
  experience: string;
  scheduled_time: string;
  status: string;
  resume_url?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const interviewData: InterviewData = await req.json();
    console.log("Received interview data:", interviewData);

    // Look up interviewer profile if email/name not provided
    let interviewerEmail = interviewData.interviewer_email;
    let interviewerName = interviewData.interviewer_name;
    
    if (!interviewerEmail && interviewData.interviewer_user_id) {
      console.log("Looking up interviewer profile for user_id:", interviewData.interviewer_user_id);
      
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', interviewData.interviewer_user_id)
        .single();
      
      if (profileError) {
        console.error("Error fetching interviewer profile:", profileError);
        throw new Error("Failed to fetch interviewer profile");
      }
      
      if (profile) {
        interviewerEmail = profile.email;
        interviewerName = profile.full_name;
        console.log("Found interviewer profile:", { email: interviewerEmail, name: interviewerName });
      } else {
        console.error("No profile found for interviewer user_id:", interviewData.interviewer_user_id);
        throw new Error("Interviewer profile not found");
      }
    }
    
    if (!interviewerEmail) {
      throw new Error("Interviewer email is required but not found");
    }

    // Create Google Meet link
    console.log("Creating Google Meet link...");
    const meetResponse = await supabaseClient.functions.invoke('create-google-meet', {
      body: {
        interviewId: `interview-${Date.now()}`,
        summary: `Mock Interview: ${interviewData.target_role}`,
        description: `Mock interview session for ${interviewData.candidate_name} applying for ${interviewData.target_role}`,
        startTime: interviewData.scheduled_time,
        endTime: new Date(new Date(interviewData.scheduled_time).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
        attendees: [interviewData.candidate_email, interviewerEmail],
      }
    });

    let meetLink = "https://meet.google.com/new"; // fallback
    let calendarEventId = null;

    if (meetResponse.data && meetResponse.data.success) {
      meetLink = meetResponse.data.meetLink;
      calendarEventId = meetResponse.data.eventId;
      console.log("Google Meet link created:", meetLink);
    } else {
      console.log("Using fallback Google Meet link");
    }

    // Create interview record in database
    const { data: interview, error: interviewError } = await supabaseClient
      .from("interviews")
      .insert({
        interviewer_id: interviewData.interviewer_id,
        candidate_id: interviewData.candidate_id,
        candidate_name: interviewData.candidate_name,
        candidate_email: interviewData.candidate_email,
        interviewer_email: interviewerEmail,
        interviewer_name: interviewerName,
        target_role: interviewData.target_role,
        experience: interviewData.experience,
        scheduled_time: interviewData.scheduled_time,
        status: interviewData.status,
        resume_url: interviewData.resume_url,
        google_meet_link: meetLink,
        google_calendar_event_id: calendarEventId,
        email_confirmation_sent: false,
      })
      .select()
      .single();

    if (interviewError) {
      console.error("Error creating interview record:", interviewError);
      throw new Error("Failed to create interview record");
    }

    console.log("Interview record created:", interview);

    // Get interviewer details for email
    const { data: interviewerData } = await supabaseClient
      .from("interviewers")
      .select("company, position")
      .eq("id", interviewData.interviewer_id)
      .single();

    const finalInterviewerName = interviewerName || interviewerData?.company || "Professional Interviewer";

    // Send confirmation emails
    console.log("Sending confirmation emails...");
    const emailResponse = await supabaseClient.functions.invoke('send-interview-emails', {
      body: {
        candidateEmail: interviewData.candidate_email,
        candidateName: interviewData.candidate_name,
        interviewerEmail: interviewerEmail,
        interviewerName: finalInterviewerName,
        targetRole: interviewData.target_role,
        scheduledTime: interviewData.scheduled_time,
        meetLink: meetLink,
        type: 'confirmation',
      }
    });

    // Update email confirmation status
    if (emailResponse.data && emailResponse.data.success) {
      await supabaseClient
        .from("interviews")
        .update({ email_confirmation_sent: true })
        .eq("id", interview.id);
      
      console.log("Confirmation emails sent successfully");
    } else {
      console.log("Failed to send confirmation emails, but interview was created");
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Interview scheduled successfully",
        interview: interview,
        meetLink: meetLink,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in schedule-interview function:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to schedule interview",
        details: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
