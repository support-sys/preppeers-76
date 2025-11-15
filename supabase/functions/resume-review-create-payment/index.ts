// @ts-ignore - Deno runtime module resolution
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore - Deno runtime module resolution
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};
const BASE_PRICE = Number(Deno.env.get("RESUME_REVIEW_PRICE") ?? 99);
const PLAN_TYPE = "resume_review";

interface CreatePaymentPayload {
  resumeReviewId?: string;
  couponCode?: string;
}

interface CouponValidationResult {
  is_valid: boolean;
  discount_type: "percentage" | "fixed" | string;
  discount_value: number;
  message: string;
}

const sanitizeCustomerId = (value: string) =>
  value.replace(/@/g, "_at_").replace(/\./g, "_dot_").replace(/[^a-zA-Z0-9_-]/g, "_");

const decodeJwt = (token: string): { sub?: string; email?: string } => {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (_error) {
    return {};
  }
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
    return new Response(JSON.stringify({ error: "Supabase credentials not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: `Bearer ${serviceRoleKey}` } }
  });

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace(/bearer /i, "").trim();
    const decoded = decodeJwt(token);
    const userId = decoded.sub;
    const userEmail = decoded.email;

    if (!userId) {
      throw new Error("Invalid or missing user token");
    }

    const requestOrigin =
      req.headers.get("origin") ??
      (req.headers.get("referer")
        ? new URL(req.headers.get("referer")!).origin
        : null) ??
      new URL(req.url).origin ??
      "https://interviewise.in";

    const payload = (await req.json()) as CreatePaymentPayload;
    const { resumeReviewId, couponCode } = payload;

    if (!resumeReviewId) {
      throw new Error("resumeReviewId is required");
    }

    const { data: review, error: reviewError } = await supabase
      .from("resume_reviews")
      .select("id, user_id, user_email, user_name, payment_status, payment_amount")
      .eq("id", resumeReviewId)
      .single();

    if (reviewError || !review) {
      throw new Error("Resume review request not found");
    }

    if (review.user_id !== userId) {
      throw new Error("You do not have access to this resume review request");
    }

    if (review.payment_status === "paid") {
      return new Response(
        JSON.stringify({
          paymentRequired: false,
          message: "Payment already completed"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const originalAmount = BASE_PRICE;
    let discountAmount = 0;
    let appliedCoupon: CouponValidationResult | null = null;

    if (couponCode) {
      const { data: couponResult, error: couponError } = await supabase.rpc(
        "validate_coupon",
        {
          p_coupon_name: couponCode.trim(),
          p_plan_type: PLAN_TYPE,
          p_user_id: userId
        }
      );

      if (couponError) {
        throw new Error(couponError.message || "Failed to validate coupon");
      }

      const validation = (couponResult?.[0] ?? null) as CouponValidationResult | null;

      if (!validation || !validation.is_valid) {
        return new Response(
          JSON.stringify({
            error: "Invalid coupon",
            message: validation?.message ?? "Coupon is not valid for this plan"
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      appliedCoupon = validation;

      if (validation.discount_type === "percentage") {
        discountAmount = Math.round((originalAmount * validation.discount_value) / 100);
      } else if (validation.discount_type === "fixed") {
        discountAmount = Math.round(validation.discount_value);
      }

      discountAmount = Math.min(discountAmount, originalAmount);
    }

    const payableAmount = Math.max(originalAmount - discountAmount, 0);

    const { data: paymentRecord, error: paymentInsertError } = await supabase
      .from("resume_review_payments")
      .insert({
        resume_review_id: review.id,
        user_id: userId,
        amount: payableAmount,
        status: payableAmount === 0 ? "paid" : "pending",
        coupon_code: couponCode ? couponCode.trim().toUpperCase() : null
      })
      .select()
      .single();

    if (paymentInsertError || !paymentRecord) {
      throw new Error(paymentInsertError?.message || "Failed to create payment record");
    }

    if (payableAmount === 0) {
      // Mark resume review as paid without Cashfree checkout
      const { error: updateError } = await supabase
        .from("resume_reviews")
        .update({
          payment_status: "paid",
          payment_amount: payableAmount,
          payment_reference: `COUPON-${couponCode?.trim().toUpperCase() ?? "FULL"}`,
          payment_verified_at: new Date().toISOString()
        })
        .eq("id", review.id);

      if (updateError) {
        throw new Error(updateError.message || "Failed to update resume review payment status");
      }

      try {
        const { data: reviewRecord } = await supabase
          .from("resume_reviews")
          .select("id, user_email, user_name, target_role, experience_years, resume_url, status, payment_status, payment_amount, submitted_at")
          .eq("id", review.id)
          .single();

        if (reviewRecord) {
          const notifyUrl = `${supabaseUrl.replace(".supabase.co", ".functions.supabase.co")}/v1/resume-review-notify`;
          await fetch(notifyUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`
            },
            body: JSON.stringify({ record: reviewRecord })
          });
        }
      } catch (notifyError) {
        console.error("Failed to trigger resume-review-notify after coupon payment", notifyError);
      }

      return new Response(
        JSON.stringify({
          paymentRequired: false,
          amount: payableAmount,
          originalAmount,
          discountAmount,
          couponApplied: appliedCoupon
            ? {
                code: couponCode?.trim().toUpperCase(),
                discountType: appliedCoupon.discount_type,
                discountValue: appliedCoupon.discount_value,
                discountAmount
              }
            : null
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Paid flow: create Cashfree order
    const isTestMode = Deno.env.get("CASHFREE_TEST_MODE") === "true";
    const cashfreeAppId = isTestMode
      ? Deno.env.get("CASHFREE_APP_ID_TEST")
      : Deno.env.get("CASHFREE_APP_ID");
    const cashfreeSecretKey = isTestMode
      ? Deno.env.get("CASHFREE_SECRET_KEY_TEST")
      : Deno.env.get("CASHFREE_SECRET_KEY");

    if (!cashfreeAppId || !cashfreeSecretKey) {
      throw new Error("Cashfree credentials are missing");
    }

    const customerEmail = review.user_email || userEmail || "guest@example.com";
    const orderId = `RR_${resumeReviewId.replace(/-/g, "").substring(0, 12)}_${Date.now()}`;
    const sanitizedCustomer = sanitizeCustomerId(customerEmail);

    const paymentSessionData = {
      order_id: orderId,
      order_amount: payableAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: sanitizedCustomer,
        customer_name: review.user_name || "Resume Review Candidate",
        customer_email: customerEmail,
        customer_phone: "+919999999999"
      },
      order_meta: {
        return_url: `${requestOrigin}/resume-review?reviewId=${resumeReviewId}&payment=success`,
        notify_url: `${supabaseUrl.replace(".supabase.co", ".functions.supabase.co")}/v1/resume-review-payment-webhook`
      },
      order_note: "Resume Review Payment",
      order_tags: {
        resume_review_id: resumeReviewId,
        coupon_code: couponCode ? couponCode.trim().toUpperCase() : "",
        user_id: userId
      }
    };

    const cashfreeUrl = isTestMode
      ? "https://sandbox.cashfree.com/pg/orders"
      : "https://api.cashfree.com/pg/orders";

    const response = await fetch(cashfreeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": cashfreeAppId,
        "x-client-secret": cashfreeSecretKey,
        "x-api-version": "2023-08-01"
      },
      body: JSON.stringify(paymentSessionData)
    });

    const cashfreeData = await response.json();

    if (!response.ok) {
      console.error("Cashfree error:", cashfreeData);
      throw new Error(cashfreeData?.message || "Failed to create Cashfree order");
    }

    await supabase
      .from("resume_review_payments")
      .update({
        cashfree_order_id: cashfreeData?.order_id,
        raw_payload: cashfreeData
      })
      .eq("id", paymentRecord.id);

    await supabase
      .from("resume_reviews")
      .update({
        payment_status: "pending",
        payment_amount: payableAmount,
        payment_reference: cashfreeData?.order_id ?? orderId
      })
      .eq("id", review.id);

    return new Response(
      JSON.stringify({
        paymentRequired: true,
        amount: payableAmount,
        originalAmount,
        discountAmount,
        currency: "INR",
        paymentSessionId: cashfreeData?.payment_session_id,
        orderId: cashfreeData?.order_id,
        couponApplied: appliedCoupon
          ? {
              code: couponCode?.trim().toUpperCase(),
              discountType: appliedCoupon.discount_type,
              discountValue: appliedCoupon.discount_value,
              discountAmount
            }
          : null
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("resume-review-create-payment error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to initiate payment",
        message: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});


