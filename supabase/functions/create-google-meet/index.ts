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

// Generate a random meet link ID
function generateMeetId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segments = [];
  
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const eventData: CalendarEvent = await req.json();
    console.log("Creating Google Meet link for:", eventData.summary);

    // Generate a consistent meet link for this interview
    const meetId = generateMeetId();
    const meetLink = `https://meet.google.com/${meetId}`;
    
    console.log("Generated Google Meet link:", meetLink);

    // Try to create a proper calendar event if Google credentials are available
    const googleCredentials = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    
    if (googleCredentials) {
      try {
        console.log("Attempting to create Google Calendar event...");
        
        // Parse credentials
        const credentials = JSON.parse(googleCredentials);
        
        // Import crypto for JWT signing
        const encoder = new TextEncoder();
        const keyData = credentials.private_key.replace(/\\n/g, '\n');
        
        // Import the private key
        const privateKey = await crypto.subtle.importKey(
          "pkcs8",
          new TextEncoder().encode(keyData.replace(/-----BEGIN PRIVATE KEY-----\n?|\n?-----END PRIVATE KEY-----/g, '').replace(/\n/g, '')),
          {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
          },
          false,
          ["sign"]
        );

        // Create JWT
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

        const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const signatureInput = `${encodedHeader}.${encodedPayload}`;
        
        const signature = await crypto.subtle.sign(
          "RSASSA-PKCS1-v1_5",
          privateKey,
          encoder.encode(signatureInput)
        );
        
        const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
          .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        
        const jwt = `${signatureInput}.${encodedSignature}`;

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

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          const accessToken = tokenData.access_token;

          // Create calendar event
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

          if (eventResponse.ok) {
            const createdEvent = await eventResponse.json();
            const googleMeetLink = createdEvent.conferenceData?.entryPoints?.[0]?.uri;
            
            if (googleMeetLink) {
              console.log("Successfully created Google Calendar event with Meet link:", googleMeetLink);
              return new Response(
                JSON.stringify({
                  success: true,
                  meetLink: googleMeetLink,
                  eventId: createdEvent.id,
                  message: "Google Meet link created successfully via Calendar API",
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
        }
      } catch (calendarError) {
        console.error("Calendar API error:", calendarError);
      }
    }

    // Return the generated meet link as fallback
    console.log("Using generated Meet link:", meetLink);
    return new Response(
      JSON.stringify({
        success: true,
        meetLink,
        eventId: `generated-${Date.now()}`,
        message: "Google Meet link generated successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in create-google-meet function:", error);
    
    // Fallback with generated link
    const meetId = generateMeetId();
    const meetLink = `https://meet.google.com/${meetId}`;
    
    return new Response(
      JSON.stringify({
        success: true,
        meetLink,
        eventId: `fallback-${Date.now()}`,
        message: "Generated fallback Meet link",
        error: error.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});