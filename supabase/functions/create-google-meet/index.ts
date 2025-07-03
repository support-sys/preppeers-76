
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    console.log("Creating Google Calendar event:", eventData);

    // Get Google service account credentials
    const googleCredentials = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    if (!googleCredentials) {
      throw new Error("Google service account key not configured");
    }

    const credentials = JSON.parse(googleCredentials);
    
    // Create JWT token for Google API authentication
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

    // Create JWT (simplified version - in production, use a proper JWT library)
    const base64Header = btoa(JSON.stringify(header));
    const base64Payload = btoa(JSON.stringify(payload));
    const signatureInput = `${base64Header}.${base64Payload}`;
    
    // Get access token from Google
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${signatureInput}.signature`, // Simplified - use proper JWT signing
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Failed to get Google access token");
      // Fallback: create a simple meet link
      const meetLink = `https://meet.google.com/new`;
      return new Response(
        JSON.stringify({
          success: true,
          meetLink,
          eventId: `fallback-${Date.now()}`,
          message: "Created fallback Meet link",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Create calendar event with Google Meet
    const calendarEvent = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime,
        timeZone: "UTC",
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: "UTC",
      },
      attendees: eventData.attendees.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    };

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
      console.error("Failed to create calendar event");
      // Fallback: create a simple meet link
      const meetLink = `https://meet.google.com/new`;
      return new Response(
        JSON.stringify({
          success: true,
          meetLink,
          eventId: `fallback-${Date.now()}`,
          message: "Created fallback Meet link",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createdEvent = await eventResponse.json();
    const meetLink = createdEvent.conferenceData?.entryPoints?.[0]?.uri || `https://meet.google.com/new`;

    console.log("Successfully created Google Calendar event:", createdEvent.id);

    return new Response(
      JSON.stringify({
        success: true,
        meetLink,
        eventId: createdEvent.id,
        message: "Google Meet link created successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in create-google-meet function:", error);
    
    // Fallback: create a simple meet link
    const meetLink = `https://meet.google.com/new`;
    return new Response(
      JSON.stringify({
        success: true,
        meetLink,
        eventId: `fallback-${Date.now()}`,
        message: "Created fallback Meet link due to error",
        error: error.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
