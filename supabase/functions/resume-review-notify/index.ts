// @ts-ignore - Deno runtime module resolution
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore - Deno runtime module resolution
import { Resend } from "npm:resend@2.0.0";
// @ts-ignore - Deno runtime module resolution
import { encode as encodeBase64 } from "https://deno.land/std@0.190.0/encoding/base64.ts";

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

interface ResumeReviewRecord {
  id: string;
  user_email: string;
  user_name: string;
  target_role: string;
  experience_years: number | null;
  resume_url: string;
  status: string;
  submitted_at?: string;
  payment_status?: string;
  payment_amount?: number | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Derive base URL from request origin (same approach as resume-review-complete)
    // Priority: origin header → referer header → check if req.url is Supabase (use fallback) → fallback to production
    let requestOrigin =
      req.headers.get("origin") ??
      (req.headers.get("referer")
        ? new URL(req.headers.get("referer")!).origin
        : null);
    
    // If we couldn't get origin from headers, check req.url
    // But if req.url is a Supabase URL (Edge Function call), use fallback instead
    if (!requestOrigin) {
      const reqUrlOrigin = new URL(req.url).origin;
      if (reqUrlOrigin.includes(".supabase.co")) {
        // This is an Edge Function-to-Edge Function call, use fallback
        requestOrigin = "https://interviewise.in";
      } else {
        requestOrigin = reqUrlOrigin;
      }
    }
    
    // Final fallback
    requestOrigin = requestOrigin ?? "https://interviewise.in";
    
    console.log("📧 Request origin:", requestOrigin);

    const payload = await req.json();
    console.log("📧 Received resume review payload:", JSON.stringify(payload, null, 2));

    // Supabase Database Webhook sends: { type: 'UPDATE' | 'INSERT', table: 'resume_reviews', record: {...}, old_record: {...} }
    // Or sometimes: { new: {...}, old: {...} }
    const record: ResumeReviewRecord | undefined = payload?.record ?? payload?.new ?? payload;
    const eventType = payload?.type ?? (payload?.old ? 'UPDATE' : 'INSERT');

    console.log("📋 Event type:", eventType);
    console.log("📋 Extracted record:", JSON.stringify(record, null, 2));

    if (!record) {
      console.error("❌ No record found in payload");
      return new Response(JSON.stringify({ error: "Missing record in payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("✅ Record extracted - ID:", record.id);
    console.log("✅ Payment status:", record.payment_status ?? "null/undefined");
    console.log("✅ Review status:", record.status ?? "null/undefined");

    if (!record.resume_url) {
      console.error("❌ Record missing resume_url", record);
      return new Response(JSON.stringify({ error: "Missing resume_url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Only skip if payment_status exists AND is not "paid"
    // If payment_status is null/undefined, allow through (for backward compatibility)
    if (record.payment_status !== undefined && record.payment_status !== null && record.payment_status !== "paid") {
      console.log("⏭️ Skipping notification – payment not completed. Payment status:", record.payment_status);
      return new Response(JSON.stringify({ message: "Skipped - payment not completed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (record.status && record.status !== "pending") {
      console.log("⏭️ Skipping notification for status:", record.status);
      return new Response(JSON.stringify({ message: "Skipped - status not pending" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("✅ All checks passed. Proceeding to send notification email...");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supportEmail = Deno.env.get("SUPPORT_EMAIL") ?? "support@interviewise.in";
    // Derive upload URL from request origin (works for both dev and prod)
    // Falls back to env var if request origin not available (e.g., database webhooks)
    const uploadBaseUrl = Deno.env.get("RESUME_REVIEW_UPLOAD_URL_BASE") ?? `${requestOrigin}/admin/resume-review/upload`;
    const uploadLink = `${uploadBaseUrl}?reviewId=${encodeURIComponent(record.id)}`;
    
    console.log("📧 Upload link:", uploadLink);

    let attachmentContent: string | null = null;
    let attachmentName = `resume-${record.id}.pdf`;

    try {
      console.log("Fetching resume file", record.resume_url);
      const resumeResponse = await fetch(record.resume_url);
      if (!resumeResponse.ok) {
        throw new Error(`Failed to fetch resume (${resumeResponse.status})`);
      }
      const arrayBuffer = await resumeResponse.arrayBuffer();
      attachmentContent = encodeBase64(new Uint8Array(arrayBuffer));

      try {
        const resumeUrl = new URL(record.resume_url);
        const pathSegments = resumeUrl.pathname.split("/");
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (lastSegment) {
          attachmentName = decodeURIComponent(lastSegment);
        }
      } catch (urlError) {
        console.warn("Unable to derive filename from resume_url", urlError);
      }
    } catch (attachmentError) {
      console.error("Unable to attach resume file", attachmentError);
    }

    const resend = new Resend(resendApiKey);

    const submittedAt = record.submitted_at ? new Date(record.submitted_at) : new Date();
    const submittedAtDisplay = submittedAt.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short"
    });

    const resumeAttachmentNote = attachmentContent
      ? `<p>Resume has been attached to this email for your convenience.<br/>Direct download link: <a href="${record.resume_url}" target="_blank">View Resume</a></p>`
      : `<p>Resume attachment unavailable. Please download via this link:<br/><a href="${record.resume_url}" target="_blank">View Resume</a></p>`;

    const experienceDisplay = (record.experience_years ?? record.experience_years === 0)
      ? `${record.experience_years} years`
      : "N/A";

    const htmlBody = `
      <h2>New Resume Review Submission</h2>
      <p>A new resume review request has been submitted.</p>
      <div style="background:#f8f9ff;border-radius:12px;padding:16px;margin:16px 0;">
        <h3 style="margin-top:0;">Candidate Details</h3>
        <p><strong>Name:</strong> ${record.user_name ?? "N/A"}</p>
        <p><strong>Email:</strong> ${record.user_email ?? "N/A"}</p>
        <p><strong>Target Role:</strong> ${record.target_role ?? "N/A"}</p>
        <p><strong>Experience:</strong> ${experienceDisplay}</p>
        <p><strong>Submitted At:</strong> ${submittedAtDisplay}</p>
      </div>
      <p><strong>Payment:</strong> Paid ₹${record.payment_amount ?? 99}</p>
      ${resumeAttachmentNote}
      <p>
        Once the review is ready, upload the finalized PDF using the link below.<br/>
        The upload page will automatically update the status to <strong>completed</strong> and store the report in Supabase.
      </p>
      <p style="margin:24px 0;">
        <a href="${uploadLink}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Upload Completed Review</a>
      </p>
      <p style="color:#4b5563;">If you encounter any issues, please reply to this email for assistance.</p>
    `;

    const emailRequest: Parameters<typeof resend.emails.send>[0] = {
      from: "Interviewise Platform <support@interviewise.in>",
      to: [supportEmail],
      subject: `New Resume Review Submission - ${record.user_name ?? record.user_email ?? record.id}`,
      html: htmlBody,
      attachments: attachmentContent
        ? [
            {
              filename: attachmentName,
              content: attachmentContent
            }
          ]
        : undefined
    };

    const emailResult = await resend.emails.send(emailRequest);

    if (emailResult.error) {
      console.error("Failed to send resume review notification", emailResult.error);
      throw new Error(emailResult.error.message ?? "Failed to send email");
    }

    console.log("Resume review notification sent", emailResult.data?.id);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.data?.id ?? null }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in resume-review-notify function", error);
    return new Response(
      JSON.stringify({ error: "Failed to send resume review notification", details: `${error}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});


