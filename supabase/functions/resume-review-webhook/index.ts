/**
 * Supabase Edge Function: Resume Review Webhook
 * 
 * This function receives database webhook events and forwards them to n8n
 * 
 * Setup:
 * 1. Deploy this Edge Function
 * 2. Create a database webhook in Supabase Dashboard:
 *    - Table: resume_reviews
 *    - Events: INSERT
 *    - Type: HTTP Request
 *    - URL: https://{project-ref}.supabase.co/functions/v1/resume-review-webhook
 * 3. Set n8n webhook URL as environment variable: N8N_WEBHOOK_URL
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get n8n webhook URL from environment variable
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    
    if (!n8nWebhookUrl) {
      console.error('N8N_WEBHOOK_URL environment variable not set');
      return new Response(
        JSON.stringify({ error: 'N8N_WEBHOOK_URL not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the webhook payload from Supabase
    const payload = await req.json();
    console.log('Received webhook payload:', payload);

    // Extract the record data (Supabase sends it in different formats)
    let recordData;
    if (payload.record) {
      // Database webhook format
      recordData = payload.record;
    } else if (payload.type === 'INSERT' && payload.new) {
      // Alternative format
      recordData = payload.new;
    } else {
      recordData = payload;
    }

    // Only process if status is 'pending'
    if (recordData.status !== 'pending') {
      console.log('Skipping - status is not pending:', recordData.status);
      return new Response(
        JSON.stringify({ message: 'Skipped - status not pending' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build payload for n8n
    const n8nPayload = {
      id: recordData.id,
      user_email: recordData.user_email,
      user_name: recordData.user_name,
      target_role: recordData.target_role,
      experience_years: recordData.experience_years,
      resume_url: recordData.resume_url,
      status: recordData.status,
      submitted_at: recordData.submitted_at,
      utm_source: recordData.utm_source,
      referrer: recordData.referrer,
      timestamp: new Date().toISOString()
    };

    console.log('Forwarding to n8n webhook:', n8nWebhookUrl);
    console.log('Payload:', n8nPayload);

    // Call n8n webhook
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook call failed:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to call n8n webhook',
          status: response.status,
          message: errorText
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const responseData = await response.json();
    console.log('n8n webhook response:', responseData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook forwarded to n8n',
        n8nResponse: responseData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in resume-review-webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});


