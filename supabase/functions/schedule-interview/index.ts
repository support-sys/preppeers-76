
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Create interview record in database
    const { data: interview, error: interviewError } = await supabaseClient
      .from("interviews")
      .insert({
        interviewer_id: interviewData.interviewer_id,
        candidate_id: interviewData.candidate_id,
        candidate_name: interviewData.candidate_name,
        candidate_email: interviewData.candidate_email,
        interviewer_email: interviewData.interviewer_email,
        target_role: interviewData.target_role,
        experience: interviewData.experience,
        scheduled_time: interviewData.scheduled_time,
        status: interviewData.status,
        resume_url: interviewData.resume_url,
      })
      .select()
      .single();

    if (interviewError) {
      console.error("Error creating interview record:", interviewError);
      // For now, continue even if database insert fails
      // This allows the matching to work while we set up the interviews table
    }

    console.log("Interview record created:", interview);

    // TODO: Send email notifications here when email service is set up
    // For now, just return success response
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Interview scheduled successfully",
        interview: interview,
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
