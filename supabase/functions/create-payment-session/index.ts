
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentSessionRequest {
  amount: number;
  currency: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  order_id: string;
  return_url: string;
  notify_url: string;
  metadata?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      amount,
      currency,
      customer_id,
      customer_name,
      customer_email,
      order_id,
      return_url,
      notify_url,
      metadata
    }: PaymentSessionRequest = await req.json();

    console.log('Creating payment session for:', { order_id, amount, customer_email });

    const cashfreeAppId = Deno.env.get('CASHFREE_APP_ID');
    const cashfreeSecretKey = Deno.env.get('CASHFREE_SECRET_KEY');

    if (!cashfreeAppId || !cashfreeSecretKey) {
      throw new Error('Cashfree credentials not configured');
    }

    // Create payment session with Cashfree
    const paymentSessionData = {
      order_id,
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id,
        customer_name,
        customer_email,
        customer_phone: '9999999999' // Default phone number
      },
      order_meta: {
        return_url,
        notify_url,
        payment_methods: ''
      },
      order_note: 'Mock Interview Payment',
      order_tags: metadata ? JSON.stringify(metadata) : null
    };

    const response = await fetch('https://sandbox.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': cashfreeAppId,
        'x-client-secret': cashfreeSecretKey,
        'x-api-version': '2022-09-01'
      },
      body: JSON.stringify(paymentSessionData)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Cashfree API error:', responseData);
      throw new Error(responseData.message || 'Failed to create payment session');
    }

    console.log('Payment session created successfully:', responseData.order_id);

    return new Response(JSON.stringify({
      payment_session_id: responseData.payment_session_id,
      order_id: responseData.order_id,
      order_status: responseData.order_status
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error creating payment session:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to create payment session'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
