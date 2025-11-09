import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

interface CompletionPayload {
  reviewId?: string;
  reportUrl?: string;
  emailSubject?: string;
}

const validatePayload = (payload: CompletionPayload) => {
  if (!payload.reviewId || typeof payload.reviewId !== "string") {
    throw new Error("Missing reviewId");
  }

  if (!payload.reportUrl || typeof payload.reportUrl !== "string") {
    throw new Error("Missing reportUrl");
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error("Service role key or URL not configured");
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const payload = await req.json() as CompletionPayload;
    validatePayload(payload);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const accessToken = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      console.error("Failed to verify user", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      console.error("User is not admin", profileError);
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: review, error: fetchError } = await supabaseAdmin
      .from("resume_reviews")
      .select("id, user_email, user_name, target_role, status, email_sent_at")
      .eq("id", payload.reviewId)
      .single();

    if (fetchError || !review) {
      throw new Error("Resume review not found");
    }

    const shouldSendEmail = review.status !== "completed" || !review.email_sent_at;

    const { error: updateError } = await supabaseAdmin
      .from("resume_reviews")
      .update({
        report_url: payload.reportUrl,
        status: "completed",
        report_generated_at: new Date().toISOString(),
        email_sent_at: shouldSendEmail ? new Date().toISOString() : review.email_sent_at,
        updated_at: new Date().toISOString()
      })
      .eq("id", payload.reviewId);

    if (updateError) {
      throw updateError;
    }

    if (!shouldSendEmail) {
      return new Response(JSON.stringify({ success: true, message: "Review already completed; no email sent." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const resend = new Resend(resendKey);
    const email = review.user_email;
    if (!email) {
      throw new Error("No candidate email on record");
    }

    const requestOrigin =
      req.headers.get("origin") ??
      (req.headers.get("referer")
        ? new URL(req.headers.get("referer")!).origin
        : null) ??
      new URL(req.url).origin ??
      "https://interviewise.com";

    const reviewLink = `${requestOrigin}/resume-review?reviewId=${encodeURIComponent(review.id)}&email=${encodeURIComponent(email)}`;
    const subject = payload.emailSubject ?? "Your Resume Review is Ready";

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
        <h1 style="color: #1f2937;">Your Resume Review is Ready!</h1>
        <p>Hi ${review.user_name ?? "there"},</p>
        <p>Your resume review report is ready. To view it:</p>
        <ol>
          <li>Log in to Interviewise using the same email (${email}).</li>
          <li>Visit the Resume Review page.</li>
          <li>Follow the prompts to unlock and view your report.</li>
        </ol>
        <p>
          <a href="${reviewLink}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 16px;">
            View Your Resume Review
          </a>
        </p>
        <p style="margin-top: 24px;">For the best results, share your experience on LinkedIn to unlock the report inside your account—this helps fellow job seekers discover the free service.</p>
        <p>Need help? Reply to this email and our support team will assist you.</p>
        <p>— Team Interviewise</p>
      </div>
    `;

    const emailResult = await resend.emails.send({
      from: "Interviewise Platform <support@interviewise.in>",
      to: [email],
      subject,
      html,
    });

    if (emailResult.error) {
      throw new Error(emailResult.error.message ?? "Failed to send email");
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.data?.id ?? null }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in resume-review-complete function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to complete resume review", details: error.message ?? `${error}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});


