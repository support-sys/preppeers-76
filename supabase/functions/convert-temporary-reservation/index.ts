import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConvertRequest {
  reservationId: string;
  interviewId: string;
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

    const { reservationId, interviewId }: ConvertRequest = await req.json();
    console.log("Converting temporary reservation:", { reservationId, interviewId });

    if (!reservationId || !interviewId) {
      throw new Error("reservationId and interviewId are required");
    }

    // Use service role to update the record (bypasses RLS)
    const { data, error } = await supabaseClient
      .from("interviewer_time_blocks")
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
      console.error("Error updating temporary reservation:", error);
      throw new Error(`Failed to update reservation: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error("No records were updated - record not found or conditions not met");
    }

    console.log("Successfully converted temporary reservation to permanent:", data[0]);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Temporary reservation converted successfully",
        updatedRecord: data[0],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in convert-temporary-reservation function:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to convert temporary reservation",
        details: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
