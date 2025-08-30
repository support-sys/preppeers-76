
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
  customer_phone?: string;
  order_id: string;
  return_url: string;
  notify_url: string;
  metadata?: any;
  selected_plan?: string;
  plan_details?: any;
}

// Function to sanitize customer_id for Cashfree requirements
const sanitizeCustomerId = (email: string): string => {
  return email.replace(/@/g, '_at_').replace(/\./g, '_dot_').replace(/[^a-zA-Z0-9_-]/g, '_');
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Payment Session Creation Started ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    // Check authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ 
          error: 'authentication Failed',
          message: 'Missing or invalid authorization header'
        }),
        {
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          },
        }
      );
    }

    // Extract and validate JWT token
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.error('Empty JWT token');
      return new Response(
        JSON.stringify({ 
          error: 'authentication Failed',
          message: 'Empty JWT token'
        }),
        {
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          },
        }
      );
    }

    console.log('JWT token received, length:', token.length);
    console.log('JWT token starts with:', token.substring(0, 20) + '...');
    
    // Log all request headers for debugging
    console.log('=== REQUEST HEADERS ===');
    for (const [key, value] of req.headers.entries()) {
      console.log(`${key}: ${value}`);
    }
    console.log('=== END REQUEST HEADERS ===');
    
    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));

    const {
      amount,
      currency,
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      order_id,
      return_url,
      notify_url,
      metadata,
      selected_plan,
      plan_details
    } = requestBody;

    // Validate required fields
    if (!amount || !customer_email || !order_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          message: 'Amount, customer_email, and order_id are required'
        }),
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          },
        }
      );
    }

    // Extract user_id from JWT token (this is the authenticated user)
    let user_id: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      user_id = payload.sub;
      if (!user_id) {
        throw new Error('No user_id in token');
      }
    } catch (error) {
      console.error('Error extracting user_id from token:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid token',
          message: 'Could not extract user_id from token'
        }),
        {
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          },
        }
      );
    }

    console.log('Extracted user_id from token:', user_id);

    // Determine if we're in test mode based on environment
    const isTestMode = Deno.env.get('CASHFREE_MODE') === 'test' || 
                      Deno.env.get('NODE_ENV') === 'development' ||
                      Deno.env.get('NODE_ENV') === 'test';

    // Get Cashfree credentials based on mode
    const cashfreeAppId = isTestMode 
      ? Deno.env.get('CASHFREE_TEST_APP_ID')
      : Deno.env.get('CASHFREE_PROD_APP_ID');
    
    const cashfreeSecretKey = isTestMode 
      ? Deno.env.get('CASHFREE_TEST_SECRET_KEY')
      : Deno.env.get('CASHFREE_PROD_SECRET_KEY');

    if (!cashfreeAppId || !cashfreeSecretKey) {
      console.error('Missing Cashfree credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error',
          message: 'Missing Cashfree credentials'
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

    console.log('Using Cashfree mode:', isTestMode ? 'TEST' : 'PRODUCTION');

    // Sanitize customer_id to meet Cashfree requirements
    const sanitizedCustomerId = sanitizeCustomerId(customer_email);
    console.log('Sanitized customer_id:', sanitizedCustomerId);

    // Use correct Supabase edge function URL for webhook
    const webhookUrl = 'https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/payment-webhook';
    console.log('Webhook URL:', webhookUrl);

    // Prepare order tags with plan information
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

    // Add plan information to order tags
    if (selected_plan) {
      orderTags.selected_plan = selected_plan;
      orderTags.plan_name = plan_details?.name || 'Professional';
      orderTags.interview_duration = String(plan_details?.duration || 60);
    }

    console.log('Order tags prepared:', JSON.stringify(orderTags, null, 2));

    // Create payment session payload according to Cashfree API v4
    const paymentSessionData = {
      order_id,
      order_amount: Number(amount),
      order_currency: currency || 'INR',
      customer_details: {
        customer_id: sanitizedCustomerId,
        customer_name: customer_name || 'Customer',
        customer_email,
        customer_phone: customer_phone || '+919999999999' // Fallback to test number with country code if not provided
      },
      order_meta: {
        return_url: return_url || 'https://example.com/book?payment=success', // Use HTTPS for Cashfree requirement
        notify_url: webhookUrl, // Use the correct webhook URL
      },
      order_note: 'Mock Interview Payment',
      order_tags: orderTags
    };

    console.log('=== Cashfree API Request ===');
    console.log('Request payload:', JSON.stringify(paymentSessionData, null, 2));

    // Use test URL for development, production URL for production
    const cashfreeUrl = isTestMode 
      ? 'https://sandbox.cashfree.com/pg/orders'  // Test/Sandbox URL
      : 'https://api.cashfree.com/pg/orders';     // Production URL
    
    console.log('API URL:', cashfreeUrl);

    const requestHeaders = {
      'Content-Type': 'application/json',
      'x-client-id': cashfreeAppId,
      'x-client-secret': cashfreeSecretKey,
      'x-api-version': '2023-08-01'
    };

    const response = await fetch(cashfreeUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(paymentSessionData)
    });

    console.log('=== Cashfree API Response ===');
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);

    const responseText = await response.text();
    console.log('Raw response body:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Parsed response:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      return new Response(
        JSON.stringify({
          error: 'Invalid response from payment service',
          message: 'Failed to parse payment service response'
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

    if (!response.ok) {
      console.error('=== Cashfree API Error ===');
      console.error('Status:', response.status);
      console.error('Error Response:', responseData);
      
      const errorMessage = responseData?.message || responseData?.error_description || 'Payment service error';
      
      return new Response(
        JSON.stringify({
          error: errorMessage,
          message: 'Failed to create payment session'
        }),
        {
          status: response.status,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          },
        }
      );
    }

    if (!responseData.payment_session_id) {
      console.error('Missing payment_session_id in response:', responseData);
      return new Response(
        JSON.stringify({
          error: 'Invalid payment session response',
          message: 'Missing payment session ID'
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

    console.log('=== Payment Session Created Successfully ===');
    console.log('Order ID:', responseData.order_id);
    console.log('Payment Session ID:', responseData.payment_session_id);

    const successResponse = {
      payment_session_id: responseData.payment_session_id,
      order_id: responseData.order_id,
      order_status: responseData.order_status
    };

    console.log('Returning success response:', successResponse);

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('=== Function Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
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
