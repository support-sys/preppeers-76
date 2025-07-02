
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { data, type } = await req.json()
    console.log('Received data:', data, 'Type:', type)
    
    // Google Sheets API endpoint - you'll need to replace with your actual sheet URL
    const SHEETS_API_URL = Deno.env.get('GOOGLE_SHEETS_WEBHOOK_URL')
    
    if (!SHEETS_API_URL) {
      console.log('Google Sheets webhook URL not configured')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Data received but Google Sheets webhook URL not configured. Please set GOOGLE_SHEETS_WEBHOOK_URL in your Supabase Edge Functions secrets.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Format data for Google Sheets
    const formattedData = {
      timestamp: new Date().toISOString(),
      type: type, // 'interviewer' or 'interviewee'
      ...data
    }

    console.log('Sending to Google Sheets:', formattedData)

    // Send to Google Sheets
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedData),
    })

    if (!response.ok) {
      throw new Error(`Failed to sync to Google Sheets: ${response.statusText}`)
    }

    console.log('Successfully synced to Google Sheets')

    return new Response(
      JSON.stringify({ success: true, message: 'Data synced to Google Sheets' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in sync-to-sheets:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
