import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cf-signature'
};
const handler = async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
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
          ...corsHeaders
        }
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
          ...corsHeaders
        }
      });
    }
    // Check various conditions that indicate this is a test webhook from Cashfree
    const isTestWebhook = !webhookData.type || // No webhook type
    Object.keys(webhookData).length < 3 || // Very few fields
    !webhookData.data || // No data field
    webhookData.data && !webhookData.data.order && !webhookData.data.order_id // Data exists but no order info
    ;
    // Log webhook details for debugging
    console.log('Webhook type:', webhookData.type);
    console.log('Has data field:', !!webhookData.data);
    console.log('Has order field:', !!(webhookData.data && webhookData.data.order));
    console.log('Has order_id in order:', !!(webhookData.data && webhookData.data.order && webhookData.data.order.order_id));
    console.log('Is test webhook?', isTestWebhook);
    if (isTestWebhook) {
      console.log('=== Processing Cashfree Test Webhook ===');
      console.log('Test webhook data keys:', Object.keys(webhookData));
      console.log('Webhook data structure:', JSON.stringify(webhookData, null, 2));
      // Return success for test calls to pass Cashfree's validation
      return new Response(JSON.stringify({
        status: 'success',
        message: 'Webhook endpoint is working correctly',
        test_response: true,
        received_keys: Object.keys(webhookData)
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Handle different webhook types for actual payment events
    if (webhookData.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      console.log('=== Processing Payment Success Webhook ===');
      const order_id = webhookData.data?.order?.order_id;
      const payment_id = webhookData.data?.payment?.cf_payment_id;
      const order_amount = webhookData.data?.order?.order_amount;
      const payment_status = webhookData.data?.payment?.payment_status;
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
            ...corsHeaders
          }
        });
      }
      console.log('Payment successful:', {
        order_id,
        payment_id,
        order_amount,
        payment_status
      });
      // Extract payment session ID from order_id (format: ORDER_{session_id})
      const sessionId = order_id.replace('ORDER_', '');
      console.log('Extracted session ID:', sessionId);
      // Update payment session status to successful
      const { data: updateData, error: updateError } = await supabase.from('payment_sessions').update({
        payment_status: 'completed',
        cashfree_payment_id: payment_id ? String(payment_id) : null
      }).eq('id', sessionId).select();
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
            ...corsHeaders
          }
        });
      } else {
        console.log('Payment session updated successfully:', updateData);
        // Trigger auto-booking in background if payment is successful
        if (updateData && updateData.length > 0) {
          const paymentSession = updateData[0];
          
          // Log add-ons data when payment is completed
          if (paymentSession.selected_add_ons && paymentSession.add_ons_total > 0) {
            console.log('📦 Payment completed with add-ons:', {
              payment_session_id: sessionId,
              selected_add_ons: paymentSession.selected_add_ons,
              add_ons_total: paymentSession.add_ons_total,
              total_amount: paymentSession.amount
            });
          } else {
            console.log('📦 Payment completed without add-ons:', {
              payment_session_id: sessionId,
              total_amount: paymentSession.amount
            });
          }
          
          console.log('🔄 Triggering auto-book interview for payment session:', sessionId);
          // Use background task to auto-book interview
          try {
            const autoBookResponse = await supabase.functions.invoke('auto-book-interview', {
              body: {
                payment_session_id: sessionId,
                user_id: paymentSession.user_id
              },
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
              }
            });
            if (autoBookResponse.error) {
              console.error('Auto-book interview failed:', autoBookResponse.error);
            } else {
              console.log('✅ Auto-book interview response:', autoBookResponse.data);
            }
          } catch (autoBookError) {
            console.error('Error calling auto-book interview:', autoBookError);
          // Don't fail the webhook if auto-booking fails
          }
        }
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
          ...corsHeaders
        }
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
            ...corsHeaders
          }
        });
      }
      console.log('Payment failed:', {
        order_id,
        payment_id,
        failure_reason
      });
      // Extract payment session ID from order_id
      const sessionId = order_id.replace('ORDER_', '');
      console.log('Extracted session ID:', sessionId);
      // Update payment session status to failed
      const { data: updateData, error: updateError } = await supabase.from('payment_sessions').update({
        payment_status: 'failed',
        cashfree_payment_id: payment_id ? String(payment_id) : null
      }).eq('id', sessionId).select();
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
            ...corsHeaders
          }
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
          ...corsHeaders
        }
      });
    }
    // Handle manual test mode webhooks with order_id
    if (webhookData.order_id && webhookData.payment_status) {
      console.log('=== Processing Manual/Test Webhook ===');
      const { order_id, payment_status, payment_id } = webhookData;
      const sessionId = order_id.replace('ORDER_', '');
      console.log('Manual webhook for session ID:', sessionId);
      const { data: updateData, error: updateError } = await supabase.from('payment_sessions').update({
        payment_status: payment_status,
        cashfree_payment_id: payment_id || 'TEST_PAYMENT'
      }).eq('id', sessionId).select();
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
            ...corsHeaders
          }
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
          ...corsHeaders
        }
      });
    }
    // Handle any other webhook calls - return success for validation
    console.log('=== Processing Generic Webhook Call ===');
    console.log('Webhook data structure:', Object.keys(webhookData));
    return new Response(JSON.stringify({
      status: 'success',
      message: 'Webhook endpoint is working correctly',
      received_data: Object.keys(webhookData)
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('=== Error Processing Payment Webhook ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({
      status: 'error',
      error: error.message,
      message: 'Webhook processing failed'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
};
serve(handler);
