
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
    const requestBody = await req.json();
    console.log('Full request body received:', JSON.stringify(requestBody, null, 2));

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
    }: PaymentSessionRequest = requestBody;

    console.log('Creating payment session for:', { order_id, amount, customer_email });

    const cashfreeAppId = Deno.env.get('CASHFREE_APP_ID');
    const cashfreeSecretKey = Deno.env.get('CASHFREE_SECRET_KEY');

    if (!cashfreeAppId || !cashfreeSecretKey) {
      console.error('Cashfree credentials not found');
      throw new Error('Cashfree credentials not configured');
    }

    console.log('Using Cashfree App ID:', cashfreeAppId);
    console.log('Cashfree Secret Key exists:', !!cashfreeSecretKey);

    // Convert metadata to simple string key-value pairs for order_tags
    const orderTags: Record<string, string> = {};
    if (metadata) {
      console.log('Processing metadata:', JSON.stringify(metadata, null, 2));
      
      // Flatten metadata to simple string key-value pairs
      orderTags.user_email = metadata.user_email || customer_email;
      orderTags.user_name = metadata.user_name || customer_name;
      
      if (metadata.candidate_data) {
        orderTags.target_role = String(metadata.candidate_data.target_role || '');
        orderTags.experience = String(metadata.candidate_data.experience || '');
        orderTags.notice_period = String(metadata.candidate_data.noticePeriod || '');
      }
    }

    console.log('Final order tags:', JSON.stringify(orderTags, null, 2));

    // Create payment session with Cashfree
    const paymentSessionData = {
      order_id,
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id,
        customer_name,
        customer_email,
        customer_phone: '9999999999' // Default phone number for demo
      },
      order_meta: {
        return_url,
        notify_url,
        payment_methods: ''
      },
      order_note: 'Mock Interview Payment',
      order_tags: orderTags
    };

    console.log('Sending request to Cashfree with data:', JSON.stringify(paymentSessionData, null, 2));

    const cashfreeUrl = 'https://sandbox.cashfree.com/pg/orders';
    console.log('Making request to:', cashfreeUrl);

    const response = await fetch(cashfreeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': cashfreeAppId,
        'x-client-secret': cashfreeSecretKey,
        'x-api-version': '2022-09-01'
      },
      body: JSON.stringify(paymentSessionData)
    });

    console.log('Cashfree response status:', response.status);
    console.log('Cashfree response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Cashfree raw response:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Cashfree response as JSON:', parseError);
      throw new Error(`Invalid JSON response from Cashfree: ${responseText}`);
    }

    console.log('Cashfree parsed response:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error('Cashfree API error details:');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Response:', responseData);
      
      // Return detailed error information
      throw new Error(`Cashfree API Error (${response.status}): ${JSON.stringify(responseData)}`);
    }

    if (!responseData.payment_session_id) {
      console.error('No payment_session_id in response:', responseData);
      throw new Error('Invalid payment session response - missing payment_session_id');
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
    console.error('Detailed error in create-payment-session:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to create payment session',
        details: error.toString()
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
