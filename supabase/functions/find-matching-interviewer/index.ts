import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FindMatchingRequest {
  experienceYears: number;
  skillCategories: string[];
  specificSkills: string[];
  timeSlot: string;
  experience: string;
  resume?: any;
  currentPosition?: string;
  company?: string;
}

interface AvailableTimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  displayText: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Find Matching Interviewer Function Started ===');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: FindMatchingRequest = await req.json();
    console.log('Finding interviewer for:', requestData);

    // Get all eligible interviewers
    const { data: interviewers, error: interviewersError } = await supabaseClient
      .from('interviewers')
      .select(`
        id,
        user_id,
        experience_years,
        time_slots,
        current_available_date,
        current_time_slots,
        is_eligible,
        skills,
        technologies,
        availability_days,
        company,
        position
      `)
      .eq('is_eligible', true);

    if (interviewersError) {
      console.error('Error fetching interviewers:', interviewersError);
      throw new Error('Failed to fetch interviewers');
    }

    if (!interviewers || interviewers.length === 0) {
      console.log('No eligible interviewers found');
      return new Response(
        JSON.stringify({ error: 'No eligible interviewers found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${interviewers.length} eligible interviewers`);

    // Enhanced matching algorithm
    let bestMatch = null;
    let bestScore = 0;

    for (const interviewer of interviewers) {
      let score = 0;
      
      // Experience matching (0-30 points)
      if (interviewer.experience_years) {
        const experienceDiff = Math.abs(interviewer.experience_years - requestData.experienceYears);
        if (experienceDiff <= 1) score += 30;
        else if (experienceDiff <= 2) score += 20;
        else if (experienceDiff <= 3) score += 10;
      }
      
      // Skills matching (0-40 points)
      const interviewerSkills = [...(interviewer.skills || []), ...(interviewer.technologies || [])];
      const candidateSkills = [...(requestData.skillCategories || []), ...(requestData.specificSkills || [])];
      
      if (interviewerSkills.length > 0 && candidateSkills.length > 0) {
        const matchingSkills = candidateSkills.filter(skill => 
          interviewerSkills.some(iSkill => 
            iSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(iSkill.toLowerCase())
          )
        );
        const skillMatchPercentage = matchingSkills.length / candidateSkills.length;
        score += Math.round(skillMatchPercentage * 40);
      }
      
      // Time slot availability (0-30 points)
      let timeMatch = false;
      const alternativeTimeSlots: string[] = [];
      
      if (interviewer.current_time_slots && requestData.timeSlot) {
        // Check if requested time slot is available
        timeMatch = checkTimeSlotAvailability(interviewer, requestData.timeSlot);
        if (timeMatch) {
          score += 30;
        } else {
          // Generate alternative time slots
          const alternatives = await generateAlternativeTimeSlots(supabaseClient, interviewer, requestData.timeSlot);
          alternativeTimeSlots.push(...alternatives);
          if (alternatives.length > 0) {
            score += 15; // Partial points for having alternatives
          }
        }
      }
      
      console.log(`Interviewer ${interviewer.id} score: ${score}, timeMatch: ${timeMatch}`);
      
      if (score > bestScore) {
        // Get interviewer profile for email
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('email, full_name')
          .eq('id', interviewer.user_id)
          .single();
        
        bestMatch = {
          ...interviewer,
          score,
          timeMatch,
          alternativeTimeSlots,
          interviewer_email: profile?.email || `interviewer-${interviewer.user_id}@temp.com`,
          interviewer_name: profile?.full_name || interviewer.company || 'Professional Interviewer'
        };
        bestScore = score;
      }
    }

    if (!bestMatch || bestScore < 20) { // Minimum threshold
      console.log('No suitable interviewer found with minimum score');
      return new Response(
        JSON.stringify({ error: 'No suitable interviewer found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Best match found:', { id: bestMatch.id, score: bestScore, timeMatch: bestMatch.timeMatch });
    
    return new Response(
      JSON.stringify(bestMatch),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in find-matching-interviewer:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function checkTimeSlotAvailability(interviewer: any, requestedTimeSlot: string): boolean {
  try {
    // Parse the requested time slot
    if (requestedTimeSlot.includes(',') && requestedTimeSlot.includes('/')) {
      // Format: "Monday, 16/08/2025 10:00-11:00"
      const parts = requestedTimeSlot.split(' ');
      if (parts.length >= 3) {
        const dayName = parts[0].replace(',', '');
        const datePart = parts[1];
        const timePart = parts[2];
        
        // Check if interviewer is available on this day
        if (interviewer.availability_days && interviewer.availability_days.includes(dayName)) {
          // Check if time slot is within interviewer's available times
          const [startTime] = timePart.split('-');
          const requestedHour = parseInt(startTime.split(':')[0]);
          
          // Simple check: if interviewer has time slots, assume 9-17 availability
          if (requestedHour >= 9 && requestedHour <= 17) {
            return true;
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    return false;
  }
}

async function generateAlternativeTimeSlots(
  supabaseClient: any, 
  interviewer: any, 
  requestedTimeSlot: string
): Promise<string[]> {
  try {
    // Get blocked time slots for this interviewer
    const { data: blockedSlots } = await supabaseClient
      .from('interviewer_time_blocks')
      .select('blocked_date, start_time, end_time')
      .eq('interviewer_id', interviewer.id);

    const alternatives: string[] = [];
    const availableDays = interviewer.availability_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Generate next 7 days of alternatives
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      
      const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (availableDays.includes(dayName)) {
        // Check common interview times
        const timeSlots = ['10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00'];
        
        for (const timeSlot of timeSlots) {
          const dateStr = checkDate.toLocaleDateString('en-GB'); // dd/mm/yyyy format
          const alternativeSlot = `${dayName}, ${dateStr} ${timeSlot}`;
          
          // Check if this slot is not blocked
          const isBlocked = blockedSlots?.some((block: any) => {
            const blockDate = new Date(block.blocked_date);
            return blockDate.toDateString() === checkDate.toDateString();
          });
          
          if (!isBlocked && alternatives.length < 3) {
            alternatives.push(alternativeSlot);
          }
        }
      }
    }
    
    return alternatives;
  } catch (error) {
    console.error('Error generating alternative time slots:', error);
    return [];
  }
}