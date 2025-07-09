
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cf-signature',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Payment Webhook Called ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    // Only allow POST requests for webhooks
    if (req.method !== 'POST') {
      console.log('Invalid request method:', req.method);
      return new Response(JSON.stringify({ 
        error: 'Method not allowed',
        message: 'Only POST requests are accepted'
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    const webhookData = await req.json();
    console.log('Payment webhook received:', JSON.stringify(webhookData, null, 2));

    // Basic validation - ensure we have some webhook data
    if (!webhookData || typeof webhookData !== 'object') {
      console.error('Invalid webhook data received');
      return new Response(JSON.stringify({ 
        error: 'Invalid webhook data',
        message: 'Webhook data is missing or invalid'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Check if this is a Cashfree test webhook (they usually have minimal data)
    const isTestWebhook = !webhookData.type && (!webhookData.data || Object.keys(webhookData).length < 3);
    
    if (isTestWebhook) {
      console.log('=== Processing Cashfree Test Webhook ===');
      console.log('Test webhook data:', Object.keys(webhookData));
      
      // Return success for test calls to pass Cashfree's validation
      return new Response(JSON.stringify({ 
        status: 'success',
        message: 'Webhook endpoint is working correctly',
        test_response: true
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different webhook types
    if (webhookData.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      console.log('=== Processing Payment Success Webhook ===');
      const { order_id, payment_id, order_amount, payment_status } = webhookData.data || {};
      
      // Validate required fields
      if (!order_id) {
        console.error('Missing order_id in payment success webhook');
        return new Response(JSON.stringify({ 
          error: 'Missing order_id',
          message: 'order_id is required for payment success webhook'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
      
      console.log('Payment successful:', { order_id, payment_id, order_amount, payment_status });
      
      // Extract payment session ID from order_id (format: ORDER_{session_id})
      const sessionId = order_id.replace('ORDER_', '');
      console.log('Extracted session ID:', sessionId);
      
      // Update payment session status to successful
      const { data: updateData, error: updateError } = await supabase
        .from('payment_sessions')
        .update({
          payment_status: 'successful',
          cashfree_payment_id: payment_id
        })
        .eq('id', sessionId)
        .select();

      if (updateError) {
        console.error('Error updating payment session:', updateError);
        return new Response(JSON.stringify({ 
          status: 'error',
          message: 'Failed to update payment session',
          error: updateError.message
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } else {
        console.log('Payment session updated successfully:', updateData);
      }
      
      return new Response(JSON.stringify({ 
        status: 'success',
        message: 'Payment webhook processed successfully',
        session_id: sessionId,
        updated_records: updateData?.length || 0
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    if (webhookData.type === 'PAYMENT_FAILED_WEBHOOK') {
      console.log('=== Processing Payment Failed Webhook ===');
      const { order_id, payment_id, failure_reason } = webhookData.data || {};
      
      // Validate required fields
      if (!order_id) {
        console.error('Missing order_id in payment failed webhook');
        return new Response(JSON.stringify({ 
          error: 'Missing order_id',
          message: 'order_id is required for payment failed webhook'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
      
      console.log('Payment failed:', { order_id, payment_id, failure_reason });
      
      // Extract payment session ID from order_id
      const sessionId = order_id.replace('ORDER_', '');
      console.log('Extracted session ID:', sessionId);
      
      // Update payment session status to failed
      const { data: updateData, error: updateError } = await supabase
        .from('payment_sessions')
        .update({
          payment_status: 'failed',
          cashfree_payment_id: payment_id
        })
        .eq('id', sessionId)
        .select();

      if (updateError) {
        console.error('Error updating payment session:', updateError);
        return new Response(JSON.stringify({ 
          status: 'error',
          message: 'Failed to update payment session',
          error: updateError.message
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } else {
        console.log('Payment session marked as failed:', updateData);
      }
      
      return new Response(JSON.stringify({ 
        status: 'failed',
        message: 'Payment failed webhook processed',
        session_id: sessionId,
        updated_records: updateData?.length || 0
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Handle test mode webhooks or manual webhook calls
    if (webhookData.order_id && webhookData.payment_status) {
      console.log('=== Processing Manual/Test Webhook ===');
      const { order_id, payment_status, payment_id } = webhookData;
      
      const sessionId = order_id.replace('ORDER_', '');
      console.log('Manual webhook for session ID:', sessionId);
      
      const { data: updateData, error: updateError } = await supabase
        .from('payment_sessions')
        .update({
          payment_status: payment_status,
          cashfree_payment_id: payment_id || 'TEST_PAYMENT'
        })
        .eq('id', sessionId)
        .select();

      if (updateError) {
        console.error('Error updating payment session:', updateError);
        return new Response(JSON.stringify({ 
          status: 'error',
          message: 'Failed to update payment session',
          error: updateError.message
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      return new Response(JSON.stringify({ 
        status: 'success',
        message: 'Manual/Test webhook processed',
        session_id: sessionId,
        updated_records: updateData?.length || 0
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Handle any other webhook calls - likely test calls from Cashfree
    console.log('=== Processing Generic Webhook Call ===');
    console.log('Webhook data structure:', Object.keys(webhookData));
    
    // For any other calls, just return success to pass validation
    return new Response(JSON.stringify({ 
      status: 'success',
      message: 'Webhook endpoint is working correctly',
      received_data: Object.keys(webhookData)
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('=== Error Processing Payment Webhook ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        status: 'error',
        error: error.message,
        message: 'Webhook processing failed'
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
