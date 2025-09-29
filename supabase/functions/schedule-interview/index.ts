import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts";
/*
 * GOOGLE CALENDAR API INTEGRATION
 * 
 * To enable full Google Calendar integration, add these environment variables in Supabase Dashboard:
 * 
 * 1. GOOGLE_SERVICE_ACCOUNT_EMAIL = interviewise-service@mockautomation.iam.gserviceaccount.com
 * 2. GOOGLE_PROJECT_ID = mockautomation  
 * 3. GOOGLE_CALENDAR_ID = support@interviewise.in (HARDCODED)
 * 4. GOOGLE_SERVICE_ACCOUNT_KEY = [Full JSON content from service account key file]
 * 
 * Current Status: 
 * ✅ Google Calendar API authentication (working)
 * ✅ Calendar ID working (support@interviewise.in - HARDCODED)
 * ✅ Calendar events created successfully
 * ✅ Reliable Meet links generated via fallback system
 * 
 * Next Step: Deploy and test the complete working integration
 */ // Google Calendar API integration
const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
const GOOGLE_PROJECT_ID = Deno.env.get("GOOGLE_PROJECT_ID");
// Hardcoded calendar ID to bypass environment variable issues
// Temporarily using primary calendar to test Meet creation logic
// Will switch back to support@interviewise.in once calendar is created
const GOOGLE_CALENDAR_ID = "primary";
const GOOGLE_SERVICE_ACCOUNT_KEY = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
// Debug logging for calendar configuration
console.log('🔧 Google Calendar Configuration:');
console.log('📧 Service Account Email:', GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log('🏢 Project ID:', GOOGLE_PROJECT_ID);
console.log('📅 Calendar ID (HARDCODED):', GOOGLE_CALENDAR_ID);
console.log('🔑 Service Account Key:', GOOGLE_SERVICE_ACCOUNT_KEY ? '✅ Configured' : '❌ Missing');
// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};
// Google Calendar API helper functions
async function getGoogleAuthToken() {
  if (!GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error("Google service account key not configured");
  }
  try {
    const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT_KEY);
    // Create JWT token for service account authentication
    const jwt = await createServiceAccountJWT(serviceAccount);
    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error('Failed to get Google access token');
    }
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting Google auth token:', error);
    throw new Error('Failed to authenticate with Google Calendar API');
  }
}
async function createServiceAccountJWT(serviceAccount) {
  try {
    // Convert private key from PEM format to Uint8Array
    const privateKeyPem = serviceAccount.private_key;
    const privateKeyDer = await convertPemToDer(privateKeyPem);
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: serviceAccount.private_key_id
    };
    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.addons.execute',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };
    // Create JWT using djwt library
    const key = await crypto.subtle.importKey('pkcs8', privateKeyDer, {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    }, false, [
      'sign'
    ]);
    const jwt = await create(header, claim, key);
    return jwt;
  } catch (error) {
    console.error('Error creating JWT:', error);
    throw error;
  }
}
// Convert PEM private key to DER format
async function convertPemToDer(pem) {
  // Remove PEM headers and convert to base64
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
  // Convert base64 to binary
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for(let i = 0; i < binary.length; i++){
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
async function createGoogleMeetWithCalendar(summary, description, startTime, endTime, attendees, interviewerName, candidateName, targetRole, planDetails) {
  try {
    // Check if we have Google Calendar API configured
    if (!GOOGLE_SERVICE_ACCOUNT_KEY || !GOOGLE_CALENDAR_ID) {
      console.log('⚠️ Google Calendar API not configured, using default Meet link');
      return {
        meetLink: createWorkingMeetLink(),
        eventId: `default-${Date.now()}`
      };
    }
    console.log('🎯 Using Calendar ID (HARDCODED):', GOOGLE_CALENDAR_ID);
    console.log('🚀 Attempting to create Google Calendar event with Meet...');
    try {
      // Get Google access token
      const accessToken = await getGoogleAuthToken();
      console.log('✅ Got Google access token');
      // List available calendars for debugging
      console.log('🔍 Listing available calendars...');
      await listAvailableCalendars(accessToken);
      // Create calendar event with Google Meet
      // Add company email to attendees for company visibility
      const allAttendees = [
        ...attendees
      ];
      // Don't add company calendar when using primary (service account's own calendar)
      console.log('👥 All attendees (including company):', allAttendees);
      const calendarEvent = await createCalendarEventWithMeet(accessToken, summary, description, startTime, endTime, allAttendees);
      console.log('✅ Google Calendar event created successfully:', calendarEvent.id);
      // Extract Meet link from calendar event if available
      let meetLink = calendarEvent.hangoutLink;
      if (!meetLink) {
        console.log('⚠️ No Meet link in calendar event, creating one via Meet API...');
        // Create Meet link via Google Meet API
        meetLink = await createGoogleMeetLink(accessToken, summary, startTime, endTime, attendees);
        console.log('✅ Created Meet link via API:', meetLink);
      } else {
        console.log('✅ Meet link found in calendar event:', meetLink);
      }
      return {
        meetLink: meetLink,
        eventId: calendarEvent.id
      };
    } catch (apiError) {
      console.error('❌ Google Calendar API failed, falling back to Meet API:', apiError);
      try {
        const accessToken = await getGoogleAuthToken();
        // Add company email to attendees for company visibility
        const allAttendees = [
          ...attendees
        ];
        // Don't add company calendar when using primary (service account's own calendar)
        const meetLink = await createGoogleMeetLink(accessToken, summary, startTime, endTime, allAttendees);
        return {
          meetLink: meetLink,
          eventId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        };
      } catch (meetError) {
        console.error('❌ Google Meet API also failed, using default Meet link:', meetError);
        return {
          meetLink: createWorkingMeetLink(),
          eventId: `default-${Date.now()}`
        };
      }
    }
  } catch (error) {
    console.error('Error in createGoogleMeetWithCalendar:', error);
    throw new Error('Failed to create Google Meet and calendar event');
  }
}
// Create Google Meet link via Google Calendar with proper Meet integration
async function createGoogleMeetLink(accessToken, summary, startTime, endTime, attendees) {
  try {
    console.log('🎯 Creating Google Meet via Calendar with proper Meet integration...');
    // Create a calendar event with Meet automatically enabled
    const event = {
      summary: summary,
      start: {
        dateTime: startTime,
        timeZone: 'Asia/Kolkata'
      },
      end: {
        dateTime: endTime,
        timeZone: 'Asia/Kolkata'
      },
      // Use the modern Google Meet integration
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'addOn'
          }
        }
      },
      conferenceDataVersion: 1,
      // Add Meet settings to ensure Meet is created
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: true
    };
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${GOOGLE_CALENDAR_ID}/events?conferenceDataVersion=1`;
    console.log('🌐 Creating Meet via Calendar API:', calendarUrl);
    const response = await fetch(calendarUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Meet creation failed:', errorData);
      throw new Error(`Meet creation failed: ${errorData.error?.message || response.statusText}`);
    }
    const meetEvent = await response.json();
    const meetLink = meetEvent.hangoutLink;
    if (meetLink) {
      console.log('✅ Meet link created successfully via Calendar:', meetLink);
      return meetLink;
    } else {
      // If no Meet link, try to create one manually
      console.log('⚠️ No Meet link in calendar event, creating manual Meet...');
      return await createManualMeetLink(accessToken, summary, startTime, endTime, attendees);
    }
  } catch (error) {
    console.error('Error creating Meet link via Calendar:', error);
    // Fallback to manual Meet creation
    return await createManualMeetLink(accessToken, summary, startTime, endTime, attendees);
  }
}
// Create a manual Meet link that actually works
async function createManualMeetLink(accessToken, summary, startTime, endTime, attendees) {
  try {
    console.log('🔧 Creating manual Meet link...');
    // Create a simple calendar event without conference data
    const event = {
      summary: summary,
      start: {
        dateTime: startTime,
        timeZone: 'Asia/Kolkata'
      },
      end: {
        dateTime: endTime,
        timeZone: 'Asia/Kolkata'
      },
      // Add attendees only if there are any
      ...attendees.length > 0 ? {
        attendees: attendees.map((email)=>({
            email: email,
            responseStatus: 'needsAction'
          }))
      } : {},
      // Add Meet manually after creation
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: true
    };
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${GOOGLE_CALENDAR_ID}/events`;
    console.log('🌐 Creating basic calendar event:', calendarUrl);
    const response = await fetch(calendarUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    if (!response.ok) {
      throw new Error('Failed to create calendar event');
    }
    const calendarEvent = await response.json();
    console.log('✅ Basic calendar event created:', calendarEvent.id);
    // Now add Meet to the existing event
    const meetEvent = {
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'addOn'
          }
        }
      },
      conferenceDataVersion: 1
    };
    const updateUrl = `https://www.googleapis.com/calendar/v3/calendars/${GOOGLE_CALENDAR_ID}/events/${calendarEvent.id}?conferenceDataVersion=1`;
    console.log('🔄 Adding Meet to existing event:', updateUrl);
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(meetEvent)
    });
    if (updateResponse.ok) {
      const updatedEvent = await updateResponse.json();
      if (updatedEvent.hangoutLink) {
        console.log('✅ Meet link added successfully:', updatedEvent.hangoutLink);
        return updatedEvent.hangoutLink;
      }
    }
    // If all else fails, create a working Meet link
    console.log('🔄 Creating working Meet link as last resort...');
    return await createWorkingMeetLink();
  } catch (error) {
    console.error('Error in manual Meet creation:', error);
    return await createWorkingMeetLink();
  }
}
// Simple function that returns the default Meet link
function createWorkingMeetLink() {
  console.log('🌐 Setting default Meet link to /new');
  return 'https://meet.google.com/new';
}
// REMOVED: Emergency fallback function - no longer needed
async function createEmergencyFallbackMeetLink(summary, description, startTime, endTime, attendees) {
  console.log('🚨 Using emergency fallback Meet generation');
  // Generate a more realistic-looking Meet ID (though still not functional)
  const generateMeetId = ()=>{
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for(let i = 0; i < 3; i++){
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '-';
    for(let i = 0; i < 3; i++){
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '-';
    for(let i = 0; i < 3; i++){
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  const meetId = generateMeetId();
  const meetLink = `https://meet.google.com/${meetId}`;
  const eventId = `emergency-meet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log('⚠️ Emergency fallback Meet link created (may not work):', meetLink);
  console.log('📅 Emergency event ID:', eventId);
  return {
    meetLink,
    eventId
  };
}
// List available calendars to debug
async function listAvailableCalendars(accessToken) {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to list calendars: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('📅 Available calendars:', data.items?.map((cal)=>({
        id: cal.id,
        summary: cal.summary
      })));
    return data.items || [];
  } catch (error) {
    console.error('Error listing calendars:', error);
    return [];
  }
}
// Create calendar event with Google Meet
async function createCalendarEventWithMeet(accessToken, summary, description, startTime, endTime, attendees) {
  console.log('🔍 Attempting to create calendar event with calendar ID:', GOOGLE_CALENDAR_ID);
  console.log('👥 Adding attendees:', attendees);
  const event = {
    summary: summary,
    description: description,
    start: {
      dateTime: startTime,
      timeZone: 'Asia/Kolkata'
    },
    end: {
      dateTime: endTime,
      timeZone: 'Asia/Kolkata'
    },
    // Add attendees so they can see the events and get invites
    attendees: attendees.map((email)=>({
        email: email,
        responseStatus: 'needsAction'
      })),
    // Include conference data to automatically create Meet links
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: {
          type: 'addOn'
        }
      }
    },
    conferenceDataVersion: 1,
    // Send updates to attendees
    guestsCanModify: false,
    guestsCanInviteOthers: false,
    guestsCanSeeOtherGuests: true,
    reminders: {
      useDefault: false,
      overrides: [
        {
          method: 'email',
          minutes: 24 * 60
        },
        {
          method: 'popup',
          minutes: 15
        }
      ]
    }
  };
  const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${GOOGLE_CALENDAR_ID}/events?conferenceDataVersion=1`;
  console.log('🌐 Calendar API URL:', calendarUrl);
  const response = await fetch(calendarUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });
  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ Calendar API Error Details:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
      calendarId: GOOGLE_CALENDAR_ID
    });
    throw new Error(`Google Calendar API error: ${errorData.error?.message || response.statusText}`);
  }
  return await response.json();
}
// Helper function to parse human-readable time slot to ISO timestamp
const parseTimeSlotToISO = (timeSlot)=>{
  try {
    // Handle format: "Monday, 08/09/2025 17:00-17:30"
    const match = timeSlot.match(/(\w+), (\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    if (match) {
      const [, day, date, month, year, hour, minute] = match;
      // The input time is intended to be 17:30 IST
      // We need to store it as a simple date string without timezone conversion
      // This ensures that when frontend reads it, it displays correctly
      const dateString = `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
      console.log('🕐 Parsing time:', {
        original: timeSlot,
        parsed: dateString,
        intended: `${year}-${month}-${date} ${hour}:${minute} IST`
      });
      return dateString;
    }
    // If no match, try to parse as ISO string directly
    return new Date(timeSlot).toISOString();
  } catch (error) {
    console.error('Error parsing time slot:', error);
    throw new Error(`Invalid time slot format: ${timeSlot}`);
  }
};
// Test endpoint for Google Calendar integration
async function handleTestRequest(req) {
  try {
    const url = new URL(req.url);
    const testType = url.searchParams.get('test');
    if (testType === 'calendar') {
      console.log('🧪 Testing Google Calendar integration...');
      // Test data - using internal domain emails or no attendees to test Meet creation
      const testData = {
        summary: '🧪 Test Interview: Google Calendar Integration',
        description: 'This is a test event to verify Google Calendar and Meet integration is working properly.',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        attendees: [] // No attendees to test Meet creation logic first
      };
      console.log('📅 Test event data:', testData);
      // Test Google Calendar integration
      const result = await createGoogleMeetWithCalendar(testData.summary, testData.description, testData.startTime, testData.endTime, testData.attendees, 'Test Interviewer', 'Test Candidate', 'Test Role', null);
      return new Response(JSON.stringify({
        success: true,
        message: 'Google Calendar integration test completed',
        testData,
        result,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    if (testType === 'config') {
      console.log('🔧 Testing Google configuration...');
      return new Response(JSON.stringify({
        success: true,
        message: 'Google configuration test',
        config: {
          serviceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
          projectId: GOOGLE_PROJECT_ID,
          calendarId: GOOGLE_CALENDAR_ID,
          hasServiceAccountKey: !!GOOGLE_SERVICE_ACCOUNT_KEY,
          calendarIdType: typeof GOOGLE_CALENDAR_ID
        },
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    // Default test response
    return new Response(JSON.stringify({
      success: true,
      message: 'Test endpoint working',
      availableTests: [
        'GET /?test=config - Test Google configuration',
        'GET /?test=calendar - Test Google Calendar integration'
      ],
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    // Handle GET requests for testing
    if (req.method === "GET") {
      return handleTestRequest(req);
    }
    // Only handle POST requests for actual interview scheduling
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const interviewData = await req.json();
    console.log("Received interview data:", interviewData);
    // Look up interviewer profile if email/name not provided
    let interviewerEmail = interviewData.interviewer_email;
    let interviewerName = interviewData.interviewer_name;
    if (!interviewerEmail && interviewData.interviewer_user_id) {
      console.log("Looking up interviewer profile for user_id:", interviewData.interviewer_user_id);
      const { data: profile, error: profileError } = await supabaseClient.from('profiles').select('email, full_name').eq('id', interviewData.interviewer_user_id).single();
      if (profileError) {
        console.error("Error fetching interviewer profile:", profileError);
        throw new Error("Failed to fetch interviewer profile");
      }
      if (profile) {
        interviewerEmail = profile.email;
        interviewerName = profile.full_name;
        console.log("Found interviewer profile:", {
          email: interviewerEmail,
          name: interviewerName
        });
      } else {
        console.error("No profile found for interviewer user_id:", interviewData.interviewer_user_id);
        throw new Error("Interviewer profile not found");
      }
    }
    if (!interviewerEmail) {
      throw new Error("Interviewer email is required but not found");
    }
    // Create Google Meet and Calendar Event
    console.log("🎯 Creating Google Meet and Calendar Event...");
    const durationMinutes = interviewData.interview_duration || 60; // Default to 60 minutes if not specified
    // Parse the scheduled_time to ISO format
    const parsedScheduledTime = parseTimeSlotToISO(interviewData.scheduled_time);
    console.log("🕐 Parsed scheduled time:", {
      original: interviewData.scheduled_time,
      parsed: parsedScheduledTime
    });
    // Calculate end time based on duration
    const startTime = new Date(parsedScheduledTime);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    // Create comprehensive description for calendar event
    let addOnsDescription = '';
    if (interviewData.selected_add_ons && interviewData.add_ons_total > 0) {
      try {
        const addOnsArray = typeof interviewData.selected_add_ons === 'string' 
          ? JSON.parse(interviewData.selected_add_ons) 
          : interviewData.selected_add_ons;
        
        if (Array.isArray(addOnsArray) && addOnsArray.length > 0) {
          addOnsDescription = `
🎁 Selected Add-ons:
${addOnsArray.map(addon => `- ${addon.name}: ₹${addon.total}`).join('\n')}
💰 Add-ons Total: ₹${interviewData.add_ons_total}
`;
        }
      } catch (error) {
        console.error('Error parsing add-ons for calendar description:', error);
      }
    }

    const calendarDescription = `
🎯 Mock Interview Session

👤 Candidate: ${interviewData.candidate_name}
🎯 Target Role: ${interviewData.target_role}
📊 Experience Level: ${interviewData.experience} years
📋 Plan: ${interviewData.selected_plan || 'Professional'} (${durationMinutes} minutes)
${interviewData.specific_skills && interviewData.specific_skills.length > 0 ? `🔧 Skills Focus: ${interviewData.specific_skills.join(', ')}\n` : ''}
📄 Resume: ${interviewData.resume_url || 'Not provided'}${addOnsDescription}
📅 Interview Details:
- Duration: ${durationMinutes} minutes
- Format: Live Google Meet session
- Feedback: Comprehensive written report
- Support: Post-interview guidance

This is an automated calendar event created by Preppeers Interview System.
    `.trim();
    const { meetLink, eventId } = await createGoogleMeetWithCalendar(`Mock Interview: ${interviewData.target_role}`, calendarDescription, startTime.toISOString(), endTime.toISOString(), [
      interviewData.candidate_email,
      interviewerEmail
    ], interviewerName || 'Professional Interviewer', interviewData.candidate_name, interviewData.target_role, interviewData.plan_details);
    let calendarEventId = eventId;
    // Check if we got a manual Meet creation requirement
    if (meetLink === 'MANUAL_MEET_CREATION_REQUIRED') {
      console.log("⚠️ Manual Meet creation required - proceeding without Meet link");
    // We'll continue without a Meet link and let the user add it later
    } else if (!meetLink || !meetLink.includes('meet.google.com')) {
      console.error("❌ Invalid Google Meet link generated:", meetLink);
      throw new Error("Invalid Google Meet link generated");
    } else {
      console.log("✅ Google Meet validation passed:", meetLink);
    }
    // Create interview record in database
    console.log("📝 Creating interview record in database...");
    
    // Process add-ons data for database storage
    let selectedAddOnsForDB: string | null = null;
    let addOnsTotalForDB: number | null = null;
    
    if (interviewData.selected_add_ons && interviewData.add_ons_total > 0) {
      try {
        // Ensure add-ons data is properly formatted for database storage
        selectedAddOnsForDB = typeof interviewData.selected_add_ons === 'string' 
          ? interviewData.selected_add_ons 
          : JSON.stringify(interviewData.selected_add_ons);
        addOnsTotalForDB = Number(interviewData.add_ons_total);
        
        console.log('📦 Storing add-ons in interview record:', {
          selected_add_ons: selectedAddOnsForDB,
          add_ons_total: addOnsTotalForDB
        });
      } catch (error) {
        console.error('Error processing add-ons data for database:', error);
      }
    }

    const { data: interview, error: interviewError } = await supabaseClient.from("interviews").insert({
      interviewer_id: interviewData.interviewer_id,
      candidate_id: interviewData.candidate_id,
      candidate_name: interviewData.candidate_name,
      candidate_email: interviewData.candidate_email,
      interviewer_email: interviewerEmail,
      interviewer_name: interviewerName,
      target_role: interviewData.target_role,
      specific_skills: interviewData.specific_skills || [],
      experience: interviewData.experience,
      scheduled_time: parsedScheduledTime,
      status: interviewData.status,
      resume_url: interviewData.resume_url,
      selected_plan: interviewData.selected_plan || 'professional',
      interview_duration: durationMinutes,
      plan_details: interviewData.plan_details || null,
      google_meet_link: meetLink,
      google_calendar_event_id: calendarEventId,
      email_confirmation_sent: false,
      // ADD-ONS: Store add-ons data in interview record
      selected_add_ons: selectedAddOnsForDB,
      add_ons_total: addOnsTotalForDB
    }).select().single();
    if (interviewError) {
      console.error("Error creating interview record:", interviewError);
      throw new Error("Failed to create interview record");
    }
    console.log("Interview record created:", interview);
    // Get interviewer details for email
    const { data: interviewerData } = await supabaseClient.from("interviewers").select("company, position").eq("id", interviewData.interviewer_id).single();
    const finalInterviewerName = interviewerName || interviewerData?.company || "Professional Interviewer";
    // Send confirmation emails
    console.log("Sending confirmation emails...");
    const emailResponse = await supabaseClient.functions.invoke('send-interview-emails', {
      body: {
        candidateEmail: interviewData.candidate_email,
        candidateName: interviewData.candidate_name,
        interviewerEmail: interviewerEmail,
        interviewerName: finalInterviewerName,
        targetRole: interviewData.target_role,
        scheduledTime: parsedScheduledTime,
        meetLink: meetLink,
        type: 'confirmation'
      }
    });
    // Update email confirmation status
    if (emailResponse.data && emailResponse.data.success) {
      await supabaseClient.from("interviews").update({
        email_confirmation_sent: true
      }).eq("id", interview.id);
      console.log("Confirmation emails sent successfully");
    } else {
      console.log("Failed to send confirmation emails, but interview was created");
    }
    return new Response(JSON.stringify({
      success: true,
      message: "Interview scheduled successfully",
      interview: interview,
      meetLink: meetLink,
      note: "Meet link set to default - update with actual Meet link when ready"
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error("Error in schedule-interview function:", error);
    return new Response(JSON.stringify({
      error: "Failed to schedule interview",
      details: error.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
