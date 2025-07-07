
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookData = await req.json();
    console.log('Payment webhook received:', webhookData);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Process payment status
    if (webhookData.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const { order_id, payment_id, order_amount, payment_status } = webhookData.data;
      
      console.log('Payment successful:', { order_id, payment_id, order_amount });
      
      // Extract payment session ID from order_id (format: ORDER_{session_id})
      const sessionId = order_id.replace('ORDER_', '');
      
      // Update payment session status
      const { error: updateError } = await supabase
        .from('payment_sessions')
        .update({
          payment_status: 'successful',
          cashfree_payment_id: payment_id
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Error updating payment session:', updateError);
      } else {
        console.log('Payment session updated successfully');
      }
      
      return new Response(JSON.stringify({ 
        status: 'success',
        message: 'Payment webhook processed successfully'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    if (webhookData.type === 'PAYMENT_FAILED_WEBHOOK') {
      const { order_id, payment_id, failure_reason } = webhookData.data;
      
      console.log('Payment failed:', { order_id, payment_id, failure_reason });
      
      // Extract payment session ID from order_id
      const sessionId = order_id.replace('ORDER_', '');
      
      // Update payment session status
      const { error: updateError } = await supabase
        .from('payment_sessions')
        .update({
          payment_status: 'failed',
          cashfree_payment_id: payment_id
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Error updating payment session:', updateError);
      } else {
        console.log('Payment session marked as failed');
      }
      
      return new Response(JSON.stringify({ 
        status: 'failed',
        message: 'Payment failed webhook processed'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({ 
      status: 'received',
      message: 'Webhook received but not processed'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error processing payment webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to process payment webhook'
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
