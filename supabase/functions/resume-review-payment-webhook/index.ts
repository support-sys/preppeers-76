// @ts-ignore - Deno runtime module resolution
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore - Deno runtime module resolution
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cf-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Missing Supabase credentials:", { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!serviceRoleKey 
    });
    return new Response(JSON.stringify({ error: "Supabase credentials missing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Validate service role key format (should start with 'eyJ' if it's a JWT, or be a long string)
  if (serviceRoleKey.length < 50) {
    console.warn("⚠️ Service role key seems too short:", serviceRoleKey.length);
  }

  try {
    const payload = await req.json();
    console.log("Resume review webhook payload:", JSON.stringify(payload, null, 2));

    const webhookType = payload?.type;
    const orderId = payload?.data?.order?.order_id;
    const paymentStatus = payload?.data?.payment?.payment_status;
    const cashfreePaymentId = payload?.data?.payment?.cf_payment_id;

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing order_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const isTestWebhook =
      !webhookType ||
      (paymentStatus === undefined && !payload?.data?.payment) ||
      payload?.data?.payment?.payment_status === "TEST";

    if (isTestWebhook) {
      return new Response(
        JSON.stringify({
          message: "Test webhook acknowledged",
          orderId
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: `Bearer ${serviceRoleKey}` } }
    });

    const { data: payment, error: fetchError } = await supabase
      .from("resume_review_payments")
      .select("id, resume_review_id, status, amount")
      .eq("cashfree_order_id", orderId)
      .single();

    if (fetchError || !payment) {
      console.error("Payment record not found for order:", orderId, fetchError);
      return new Response(
        JSON.stringify({
          error: "Payment record not found"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (payment.status === "paid") {
      return new Response(
        JSON.stringify({
          message: "Payment already processed",
          orderId
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (paymentStatus !== "SUCCESS") {
      await supabase
        .from("resume_review_payments")
        .update({
          status: "failed",
          raw_payload: payload
        })
        .eq("id", payment.id);

      return new Response(
        JSON.stringify({
          message: "Payment not successful",
          status: paymentStatus || "UNKNOWN",
          orderId
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { error: paymentUpdateError } = await supabase
      .from("resume_review_payments")
      .update({
        status: "paid",
        cashfree_payment_id: cashfreePaymentId ?? null,
        raw_payload: payload
      })
      .eq("id", payment.id);

    if (paymentUpdateError) {
      throw paymentUpdateError;
    }

    const { error: reviewUpdateError } = await supabase
      .from("resume_reviews")
      .update({
        payment_status: "paid",
        payment_reference: orderId,
        payment_amount: payment.amount,
        payment_verified_at: new Date().toISOString()
      })
      .eq("id", payment.resume_review_id);

    if (reviewUpdateError) {
      throw reviewUpdateError;
    }

    // Trigger notification via resume-review-notify function
    try {
      console.log("📧 Fetching resume review record to notify admin...");
      const { data: reviewRecord, error: fetchReviewError } = await supabase
        .from("resume_reviews")
        .select("id, user_email, user_name, target_role, experience_years, resume_url, status, payment_status, payment_amount, submitted_at")
        .eq("id", payment.resume_review_id)
        .single();

      if (fetchReviewError || !reviewRecord) {
        console.error("❌ Failed to fetch review record for notification:", fetchReviewError);
        // Don't throw - payment is already processed, so we continue
      } else {
        console.log("✅ Review record fetched:", JSON.stringify(reviewRecord, null, 2));
        
        // Only trigger notification if payment is paid and status is pending
        if (reviewRecord.payment_status === "paid" && reviewRecord.status === "pending") {
          console.log("📧 Calling resume-review-notify function...");
          
          // Construct the correct function URL
          // supabaseUrl format: https://xxxxx.supabase.co
          // Function URL format: https://xxxxx.supabase.co/functions/v1/resume-review-notify
          const notifyUrl = `${supabaseUrl}/functions/v1/resume-review-notify`;
          
          // Ensure service role key is trimmed (in case of whitespace)
          const trimmedServiceRoleKey = serviceRoleKey.trim();
          
          console.log("📧 Notify URL:", notifyUrl);
          console.log("📧 Service Role Key length:", trimmedServiceRoleKey.length);
          console.log("📧 Service Role Key starts with:", trimmedServiceRoleKey.substring(0, 20) + "...");
          
          const notifyResponse = await fetch(notifyUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${trimmedServiceRoleKey}`,
              "apikey": trimmedServiceRoleKey,
              "x-client-info": "resume-review-payment-webhook"
            },
            body: JSON.stringify({ 
              type: "UPDATE",
              table: "resume_reviews",
              record: reviewRecord
            })
          });

          console.log("📧 Notify response status:", notifyResponse.status);
          
          let notifyResult;
          try {
            notifyResult = await notifyResponse.json();
            console.log("📧 Notify response:", JSON.stringify(notifyResult, null, 2));
          } catch (jsonError) {
            const text = await notifyResponse.text();
            console.error("❌ Failed to parse notify response as JSON:", text);
            notifyResult = { error: "Failed to parse response", text };
          }
          
          if (!notifyResponse.ok) {
            console.error("❌ resume-review-notify returned error:", notifyResponse.status, notifyResult);
            console.error("❌ Response headers:", Object.fromEntries(notifyResponse.headers.entries()));
            // Don't throw - payment is already processed, so we continue
          } else {
            console.log("✅ Successfully triggered resume-review-notify:", JSON.stringify(notifyResult, null, 2));
          }
        } else {
          console.log("⏭️ Skipping notification - payment status:", reviewRecord.payment_status, "review status:", reviewRecord.status);
        }
      }
    } catch (notifyError) {
      console.error("❌ Failed to trigger resume-review-notify:", notifyError);
      // Don't throw - payment is already processed, so we continue
    }

    return new Response(
      JSON.stringify({
        message: "Payment processed",
        orderId,
        paymentId: cashfreePaymentId ?? null
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("resume-review-payment-webhook error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process payment webhook",
        message: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});


