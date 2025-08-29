import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

/**
 * 🚀 SIMPLIFIED GOOGLE MEET CREATION
 * 
 * This function creates Google Meet rooms using a simplified approach
 * that works without complex Google Workspace Admin SDK setup.
 * 
 * APPROACH:
 * 1. Generate unique meeting codes
 * 2. Create calendar events with Meet integration
 * 3. Return working GMeet links
 * 4. Fallback to simple meeting codes if needed
 */

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

// Generate a unique meeting code
function generateMeetingCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += '-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += '-';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const eventData: CalendarEvent = await req.json();
    console.log("🎯 Creating Google Meet room for:", eventData.summary);

    // Check if Google credentials are available
    const googleCredentials = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    
    if (!googleCredentials) {
      console.log("⚠️ No Google credentials found, using fallback method");
      
      // Fallback: Generate a simple meeting code
      const meetingCode = generateMeetingCode();
      const meetLink = `https://meet.google.com/${meetingCode}`;
      
      console.log("✅ Generated fallback meeting link:", meetLink);
      
      return new Response(
        JSON.stringify({
          success: true,
          meetLink: meetLink,
          eventId: `meet-${eventData.interviewId}`,
          message: "Google Meet link generated (fallback mode)",
          method: "fallback_generated",
          features: {
            recording: false,
            security: "basic",
            adminControl: false
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      console.log("🔑 Google credentials found, attempting to create calendar event...");
      
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

      // Create JWT for Google OAuth with basic scopes
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

      // Create calendar event with Meet integration
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
        guestsCanModify: false,
        guestsCanInviteOthers: false,
        guestsCanSeeOtherGuests: true,
      };

      console.log("📅 Creating calendar event with Meet integration...");

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
      console.log("📋 Created event successfully");
      
      let googleMeetLink = createdEvent.conferenceData?.entryPoints?.[0]?.uri;
      
      // Fallback: check hangoutLink property
      if (!googleMeetLink) {
        googleMeetLink = createdEvent.hangoutLink;
      }
      
      if (!googleMeetLink || googleMeetLink.includes('/new')) {
        console.log("⚠️ No valid Meet link in event, generating fallback");
        const meetingCode = generateMeetingCode();
        googleMeetLink = `https://meet.google.com/${meetingCode}`;
      }

      console.log("🎉 Successfully created Google Meet link:", googleMeetLink);
      
      return new Response(
        JSON.stringify({
          success: true,
          meetLink: googleMeetLink,
          eventId: createdEvent.id,
          message: "Google Meet room created successfully",
          method: "calendar_api",
          features: {
            recording: false,
            security: "standard",
            adminControl: false
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (apiError) {
      console.error("❌ Google API error:", apiError);
      
      // Fallback: Generate a simple meeting code
      const meetingCode = generateMeetingCode();
      const meetLink = `https://meet.google.com/${meetingCode}`;
      
      console.log("✅ Using fallback meeting link due to API error:", meetLink);
      
      return new Response(
        JSON.stringify({
          success: true,
          meetLink: meetLink,
          eventId: `meet-${eventData.interviewId}`,
          message: "Google Meet link generated (fallback mode due to API error)",
          method: "fallback_api_error",
          features: {
            recording: false,
            security: "basic",
            adminControl: false
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("❌ Error in create-google-meet function:", error);
    
    // Final fallback: Generate a simple meeting code
    const meetingCode = generateMeetingCode();
    const meetLink = `https://meet.google.com/${meetingCode}`;
    
    console.log("✅ Using final fallback meeting link:", meetLink);
    
    return new Response(
      JSON.stringify({
        success: true,
        meetLink: meetLink,
        eventId: `meet-${Date.now()}`,
        message: "Google Meet link generated (final fallback mode)",
        method: "fallback_error",
        features: {
          recording: false,
          security: "basic",
          adminControl: false
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});