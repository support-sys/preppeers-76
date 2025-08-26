import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TryPreviewedInterviewerRequest {
  interviewer_id: string;
  candidate_data: any;
  preferred_time_slot?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Try Previewed Interviewer Function Started ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { interviewer_id, candidate_data, preferred_time_slot }: TryPreviewedInterviewerRequest = await req.json();
    
    console.log('Request data:', { 
      interviewer_id, 
      preferred_time_slot,
      candidate_skills: candidate_data.skillCategories || candidate_data.specificSkills
    });

    // 1. Verify interviewer still exists and is eligible
    const { data: interviewer, error: interviewerError } = await supabase
      .from('interviewers')
      .select(`
        id, experience_years, skills, technologies, company, position,
        current_time_slots, availability_days, is_eligible,
        user_id
      `)
      .eq('id', interviewer_id)
      .eq('is_eligible', true)
      .single();

    if (interviewerError || !interviewer) {
      console.log('❌ Interviewer no longer available:', interviewerError?.message);
      return new Response(
        JSON.stringify({ 
          available: false, 
          reason: 'Interviewer no longer available'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // 2. Get interviewer profile details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', interviewer.user_id)
      .single();

    if (profileError || !profile) {
      console.log('❌ Interviewer profile not found:', profileError?.message);
      return new Response(
        JSON.stringify({ 
          available: false, 
          reason: 'Interviewer profile not found'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // 3. Check time slot availability if preferred time is specified
    let timeAvailable = true;
    let availableTimeSlots = [];

    if (preferred_time_slot) {
      console.log('Checking time availability for:', preferred_time_slot);
      
      try {
        // Parse the preferred time slot to get date and time
        const preferredDate = new Date(preferred_time_slot);
        if (isNaN(preferredDate.getTime())) {
          throw new Error('Invalid date format');
        }

        const dateStr = preferredDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = preferredDate.toTimeString().slice(0, 5); // HH:MM
        const endTimeStr = new Date(preferredDate.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5);

        // Check for existing time blocks that would conflict
        const { data: conflictingBlocks, error: blocksError } = await supabase
          .from('interviewer_time_blocks')
          .select('id, start_time, end_time, block_reason')
          .eq('interviewer_id', interviewer_id)
          .eq('blocked_date', dateStr)
          .or(`start_time.lt.${endTimeStr},end_time.gt.${timeStr}`);

        if (blocksError) {
          console.error('Error checking time blocks:', blocksError);
          timeAvailable = false;
        } else if (conflictingBlocks && conflictingBlocks.length > 0) {
          console.log('❌ Time slot conflicts with existing blocks:', conflictingBlocks);
          timeAvailable = false;
        }

        // If time not available, get alternative slots
        if (!timeAvailable) {
          // Get next 3 available slots within 7 days
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(startDate.getDate() + 7);

          const availabilityDays = interviewer.availability_days || [];
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayName = dayNames[d.getDay()];
            if (availabilityDays.includes(dayName) && availableTimeSlots.length < 3) {
              const checkDateStr = d.toISOString().split('T')[0];
              
              // Check if this date has any blocks
              const { data: dayBlocks } = await supabase
                .from('interviewer_time_blocks')
                .select('start_time, end_time')
                .eq('interviewer_id', interviewer_id)
                .eq('blocked_date', checkDateStr);

              // Find free slots (simplified - assuming 10:00-17:00 working hours)
              const workingHours = ['10:00', '11:00', '14:00', '15:00', '16:00'];
              for (const hour of workingHours) {
                const endHour = String(parseInt(hour.split(':')[0]) + 1).padStart(2, '0') + ':00';
                
                const hasConflict = dayBlocks?.some(block => 
                  hour < block.end_time && endHour > block.start_time
                );

                if (!hasConflict) {
                  const slotDate = new Date(d);
                  slotDate.setHours(parseInt(hour.split(':')[0]), 0, 0, 0);
                  
                  availableTimeSlots.push({
                    datetime: slotDate.toISOString(),
                    display: `${dayName}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${hour}-${endHour}`
                  });
                  
                  if (availableTimeSlots.length >= 3) break;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error parsing or checking time slot:', error);
        timeAvailable = false;
      }
    }

    console.log('✅ Previewed interviewer is available');
    console.log('Time available:', timeAvailable);
    console.log('Alternative slots:', availableTimeSlots.length);

    return new Response(
      JSON.stringify({
        available: true,
        interviewer: {
          id: interviewer.id,
          name: profile.full_name,
          email: profile.email,
          company: interviewer.company,
          position: interviewer.position,
          experience_years: interviewer.experience_years,
          skills: interviewer.skills,
          technologies: interviewer.technologies
        },
        time_available: timeAvailable,
        alternative_time_slots: availableTimeSlots.map(slot => slot.display),
        alternative_time_slots_iso: availableTimeSlots.map(slot => slot.datetime)
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('=== Function Error ===');
    console.error('Error:', error.message);
    
    return new Response(
      JSON.stringify({
        available: false,
        reason: 'Internal server error',
        error: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});