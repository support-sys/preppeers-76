import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalendarEvent {
  interviewId: string;
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
  attendees: string[];
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const eventData: CalendarEvent = await req.json();
    console.log("Creating Google Meet link for:", eventData.summary);

    // Check if Google credentials are available
    const googleCredentials = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    
    if (!googleCredentials) {
      console.error("❌ GOOGLE_SERVICE_ACCOUNT_KEY not found in environment");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Google service account credentials not configured",
          message: "Cannot create Google Meet link without proper credentials",
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    try {
      console.log("🔑 Google credentials found, creating calendar event...");
      
      // Parse credentials
      const credentials = JSON.parse(googleCredentials);
      
      // Import crypto for JWT signing
      const encoder = new TextEncoder();
      const keyData = credentials.private_key.replace(/\\n/g, '\n');
      
      // Clean and decode the private key
      const pemKey = keyData
        .replace(/-----BEGIN PRIVATE KEY-----\n?|\n?-----END PRIVATE KEY-----/g, '')
        .replace(/\n/g, '');
      
      // Convert base64 to ArrayBuffer
      const binaryKey = Uint8Array.from(atob(pemKey), c => c.charCodeAt(0));
      
      // Import the private key
      const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        binaryKey,
        {
          name: "RSASSA-PKCS1-v1_5",
          hash: "SHA-256",
        },
        false,
        ["sign"]
      );

      // Create JWT for Google OAuth
      const now = Math.floor(Date.now() / 1000);
      const header = {
        alg: "RS256",
        typ: "JWT",
      };

      const payload = {
        iss: credentials.client_email,
        scope: "https://www.googleapis.com/auth/calendar",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      };

      // Base64 URL encode
      const base64UrlEncode = (obj: any) => {
        return btoa(JSON.stringify(obj))
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_');
      };

      const encodedHeader = base64UrlEncode(header);
      const encodedPayload = base64UrlEncode(payload);
      const signatureInput = `${encodedHeader}.${encodedPayload}`;
      
      const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        privateKey,
        encoder.encode(signatureInput)
      );
      
      const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      
      const jwt = `${signatureInput}.${encodedSignature}`;

      console.log("🔐 JWT created, requesting access token...");

      // Get access token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: jwt,
        }),
      });

      if (!tokenResponse.ok) {
        const tokenError = await tokenResponse.text();
        console.error("❌ Token request failed:", tokenError);
        throw new Error(`Failed to get access token: ${tokenError}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      
      console.log("✅ Access token obtained, creating calendar event...");

      // Create calendar event with Google Meet
      const calendarEvent = {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.startTime,
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: "Asia/Kolkata",
        },
        attendees: eventData.attendees.map(email => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `meet-${eventData.interviewId}-${Date.now()}`,
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
      };

      console.log("📅 Creating event with attendees:", eventData.attendees);

      const eventResponse = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(calendarEvent),
        }
      );

      if (!eventResponse.ok) {
        const eventError = await eventResponse.text();
        console.error("❌ Calendar event creation failed:", eventError);
        throw new Error(`Failed to create calendar event: ${eventError}`);
      }

      const createdEvent = await eventResponse.json();
      console.log("📋 Created event response:", JSON.stringify(createdEvent, null, 2));
      
      let googleMeetLink = createdEvent.conferenceData?.entryPoints?.[0]?.uri;
      
      // Fallback: check hangoutLink property
      if (!googleMeetLink) {
        googleMeetLink = createdEvent.hangoutLink;
      }
      
      // Last resort: extract from htmlLink if available
      if (!googleMeetLink && createdEvent.htmlLink) {
        const meetMatch = createdEvent.htmlLink.match(/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/);
        if (meetMatch) {
          googleMeetLink = `https://${meetMatch[0]}`;
        }
      }
      
      if (!googleMeetLink || googleMeetLink.includes('/new')) {
        console.error("❌ No valid Google Meet link found in created event");
        console.error("Event data:", JSON.stringify(createdEvent, null, 2));
        throw new Error("Google Meet link not generated in calendar event");
      }

      console.log("🎉 Successfully created Google Calendar event with Meet link:", googleMeetLink);
      
      return new Response(
        JSON.stringify({
          success: true,
          meetLink: googleMeetLink,
          eventId: createdEvent.id,
          message: "Real Google Meet link created successfully via Calendar API",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (calendarError) {
      console.error("❌ Calendar API error:", calendarError);
      return new Response(
        JSON.stringify({
          success: false,
          error: calendarError.message,
          message: "Failed to create Google Meet link through Calendar API",
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

  } catch (error) {
    console.error("❌ Error in create-google-meet function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: "Failed to create Google Meet link",
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});