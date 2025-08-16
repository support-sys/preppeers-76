import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { 
  MatchingCandidate, 
  MatchedInterviewer, 
  checkSkillsMatch, 
  checkTimeSlotMatch, 
  parseExperience, 
  getAlternativeTimeSlots,
  checkEnhancedSkillsMatch,
  checkEnhancedExperienceMatch,
  MINIMUM_SKILL_THRESHOLD
} from "@/utils/interviewerMatching";
import { getAvailableTimeSlotsForInterviewer } from "@/utils/availableTimeSlots";

// Helper function to convert time slot format to ISO datetime
const convertTimeSlotToISODate = (timeSlot: string): string => {
  // If it's already an ISO date, return as is
  if (timeSlot.includes('T') || timeSlot.match(/^\d{4}-\d{2}-\d{2}/)) {
    return timeSlot;
  }
  
  // Handle new format like "Monday, 16/08/2025 10:00-11:00"
  if (timeSlot.includes(',') && timeSlot.includes('/')) {
    const parts = timeSlot.split(' ');
    if (parts.length >= 3) {
      const datePart = parts[1]; // "16/08/2025"
      const timePart = parts[2]; // "10:00-11:00"
      const startTime = timePart.split('-')[0]; // "10:00"
      
      // Parse date from dd/mm/yyyy format
      const [day, month, year] = datePart.split('/').map(Number);
      const [hours, minutes] = startTime.split(':').map(Number);
      
      const targetDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      return targetDate.toISOString();
    }
  }
  
  // Handle legacy format like "Tuesday 09:00-17:00"
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  
  // Extract day and time from the slot
  const parts = timeSlot.split(' ');
  if (parts.length < 2) {
    // Fallback: schedule for tomorrow if format is unclear
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // Default to 10 AM
    return tomorrow.toISOString();
  }
  
  const dayName = parts[0];
  const timeRange = parts[1];
  const startTime = timeRange.split('-')[0];
  
  // Find the target day
  const targetDayIndex = daysOfWeek.indexOf(dayName);
  if (targetDayIndex === -1) {
    // Fallback: schedule for tomorrow if day is invalid
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString();
  }
  
  // Calculate how many days ahead this day is
  const currentDayIndex = today.getDay();
  let daysAhead = targetDayIndex - currentDayIndex;
  if (daysAhead <= 0) {
    daysAhead += 7; // Next week
  }
  
  // Create the target date
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysAhead);
  
  // Set the time
  const [hours, minutes] = startTime.split(':').map(Number);
  targetDate.setHours(hours, minutes, 0, 0);
  
  return targetDate.toISOString();
};

export const findMatchingInterviewer = async (candidateData: MatchingCandidate): Promise<MatchedInterviewer | null> => {
  try {
    console.log('\n🚀 === STARTING INTERVIEWER MATCHING PROCESS ===');
    console.log('👤 Candidate Data:', {
      experienceYears: candidateData.experienceYears,
      experience: candidateData.experience,
      timeSlot: candidateData.timeSlot,
      hasResume: !!candidateData.resume,
      skillCategories: candidateData.skillCategories,
      specificSkills: candidateData.specificSkills
    });
    
    // Get all eligible interviewers using secure function
    const { data: allInterviewers, error } = await supabase.rpc('get_safe_interviewer_data');

    if (error) {
      console.error('❌ Error fetching interviewers:', error);
      return null;
    }

    // Exclude previous interviewer if excludeInterviewerId is provided
    let filteredInterviewers = allInterviewers;
    if (candidateData.excludeInterviewerId) {
      filteredInterviewers = allInterviewers.filter(
        (interviewer) => interviewer.id !== candidateData.excludeInterviewerId
      );
    }

    if (!filteredInterviewers || filteredInterviewers.length === 0) {
      console.log('❌ No interviewers found in database');
      return null;
    }

    // Log all interviewers data for debugging
    console.log('\n📊 === INTERVIEWER DATABASE OVERVIEW ===');
    filteredInterviewers.forEach((interviewer, index) => {
      console.log(`\n👨‍💼 Interviewer ${index + 1}: ${interviewer.company || 'Unknown Company'}`);
      console.log(`   📋 Skill Categories: ${JSON.stringify(interviewer.skills)}`);
      console.log(`   🔧 Technologies: ${JSON.stringify(interviewer.technologies)}`);
      console.log(`   📅 Experience: ${interviewer.experience_years} years`);
      console.log(`   💼 Position: ${interviewer.job_position || 'Not specified'}`);
      console.log(`   ⏰ Time Slots: ${JSON.stringify(interviewer.current_time_slots)}`);
    });

    const candidateExperience = candidateData.experienceYears || parseExperience(candidateData.experience || '');
    console.log(`\n👤 Candidate parsed experience: ${candidateExperience} years`);

    // Score and rank interviewers using enhanced matching
    console.log('\n🎯 === EVALUATING EACH INTERVIEWER WITH ENHANCED MATCHING ===');
    const scoredInterviewers = await Promise.all(filteredInterviewers.map(async (interviewer, index) => {
      let totalScore = 0;
      const allReasons = [];
      const allDetails = [];

      console.log(`\n🔍 === EVALUATING INTERVIEWER ${index + 1}: ${interviewer.company || 'Unknown'} ===`);

      // 1. Enhanced Skills matching (60 points max) - Now primary factor
      console.log('\n📋 STEP 1: Enhanced Skills Evaluation');
      const skillsResult = checkEnhancedSkillsMatch(
        candidateData,
        interviewer.skills || [], 
        interviewer.technologies || []
      );
      
      // Enforce minimum skill threshold - block poor matches
      if (skillsResult.score < MINIMUM_SKILL_THRESHOLD) {
        console.log(`❌ Interviewer ${index + 1} BLOCKED: Skills score ${skillsResult.score} below minimum threshold ${MINIMUM_SKILL_THRESHOLD}`);
        return {
          ...interviewer,
          matchScore: 0,
          matchReasons: [],
          matchDetails: ['Insufficient skill match - blocked'],
          alternativeTimeSlots: [],
          timeMatch: false,
          hasExactTimeMatch: false,
          skillQuality: skillsResult.quality,
          blocked: true
        };
      }
      
      totalScore += skillsResult.score;
      if (skillsResult.match) {
        allReasons.push(`${skillsResult.quality.charAt(0).toUpperCase() + skillsResult.quality.slice(1)} skills match`);
      }
      allDetails.push(...skillsResult.details);
      console.log(`✅ Skills evaluation: +${skillsResult.score}/60 points (${skillsResult.quality} quality)`);

      // 2. Enhanced Experience matching (25 points max)
      console.log('\n👨‍💼 STEP 2: Enhanced Experience Evaluation');
      const experienceResult = checkEnhancedExperienceMatch(
        candidateData,
        interviewer.experience_years || 0
      );
      totalScore += experienceResult.score;
      if (experienceResult.match) {
        allReasons.push('Appropriate experience level');
      }
      allDetails.push(...experienceResult.details);
      console.log(`✅ Experience evaluation: +${experienceResult.score}/25 points`);

      // 3. Time slot availability (15 points max) - Reduced priority
      console.log('\n⏰ STEP 3: Time Availability Evaluation');
      const timeMatch = checkTimeSlotMatch(candidateData.timeSlot || '', interviewer.current_time_slots);
      if (timeMatch) {
        totalScore += 15; // Reduced from 25 to 15
        allReasons.push('Perfect time match');
        allDetails.push('Exact time slot match found');
        console.log('✅ Time available: +15 points');
      } else {
        console.log('❌ Preferred time not available: +0 points');
      }

      // Get enhanced alternative time slots with specific dates
      const availableTimeSlots = await getAvailableTimeSlotsForInterviewer(
        interviewer.id,
        interviewer.current_time_slots,
        candidateData.timeSlot // Pass candidate's preferred date
      );
      const alternativeTimeSlots = availableTimeSlots.map(slot => slot.displayText);
      
      if (alternativeTimeSlots.length > 0 && !timeMatch) {
        totalScore += 3; // Small bonus for having alternatives
        allDetails.push(`${alternativeTimeSlots.length} alternative time slots available`);
        console.log(`✅ Alternative times available: +3 points`);
      }

      console.log(`\n🎯 ENHANCED FINAL SCORE for ${interviewer.company}: ${totalScore}/100`);
      console.log(`📋 Match Reasons: ${allReasons.join(', ')}`);
      console.log(`📝 Match Details: ${allDetails.join('; ')}`);
      console.log(`⏰ Alternative Slots Available: ${alternativeTimeSlots.length}`);
      console.log(`   ${alternativeTimeSlots.slice(0, 3).join('; ')}`);
      
      return {
        ...interviewer,
        matchScore: totalScore,
        matchReasons: allReasons,
        matchDetails: allDetails,
        alternativeTimeSlots,
        timeMatch,
        hasExactTimeMatch: timeMatch,
        skillQuality: skillsResult.quality,
        blocked: false
      };
    }));

    // Filter out blocked interviewers (those below minimum skill threshold)
    const validInterviewers = scoredInterviewers.filter(i => !i.blocked);
    
    if (validInterviewers.length === 0) {
      console.log('❌ No interviewers meet minimum skill requirements');
      return null;
    }

    // First, try to find interviewers with exact time matches and good skill quality
    const excellentMatchInterviewers = validInterviewers.filter(i => 
      i.timeMatch && (i.skillQuality === 'excellent' || i.skillQuality === 'good')
    );
    excellentMatchInterviewers.sort((a, b) => b.matchScore - a.matchScore);

    if (excellentMatchInterviewers.length > 0) {
      const bestExactMatch = excellentMatchInterviewers[0];
      console.log(`\n🏆 Best exact time + skills match: ${bestExactMatch.company || 'Unknown'} - Score: ${bestExactMatch.matchScore}/100 (${bestExactMatch.skillQuality})`);
      return bestExactMatch;
    }

    // Next, try exact time matches with any skill quality above minimum
    const exactMatchInterviewers = validInterviewers.filter(i => i.timeMatch);
    exactMatchInterviewers.sort((a, b) => b.matchScore - a.matchScore);

    if (exactMatchInterviewers.length > 0) {
      const bestExactMatch = exactMatchInterviewers[0];
      console.log(`\n🏆 Best exact time match: ${bestExactMatch.company || 'Unknown'} - Score: ${bestExactMatch.matchScore}/100 (${bestExactMatch.skillQuality})`);
      return bestExactMatch;
    }

    // If no exact matches, find the best interviewer with alternative time slots
    console.log('\n⏰ No exact time matches found. Looking for best alternatives...');
    
    const interviewersWithAlternatives = validInterviewers.filter(i => 
      i.alternativeTimeSlots && i.alternativeTimeSlots.length > 0
    );

    if (interviewersWithAlternatives.length === 0) {
      console.log('❌ No suitable interviewers with any available time slots.');
      return null;
    }

    // Sort by skill quality first, then by match score, then by earliest alternative time slot
    interviewersWithAlternatives.sort((a, b) => {
      // Prioritize skill quality
      const qualityOrder = { excellent: 4, good: 3, poor: 2, none: 1 };
      const aQuality = qualityOrder[a.skillQuality] || 1;
      const bQuality = qualityOrder[b.skillQuality] || 1;
      
      if (bQuality !== aQuality) {
        return bQuality - aQuality;
      }
      
      // Then by match score
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      
      // Finally by earliest time slot
      const aEarliest = a.alternativeTimeSlots[0] || '';
      const bEarliest = b.alternativeTimeSlots[0] || '';
      return aEarliest.localeCompare(bEarliest);
    });

    const bestAlternativeMatch = interviewersWithAlternatives[0];
    console.log(`\n🏆 Best alternative match: ${bestAlternativeMatch.company || 'Unknown'} - Score: ${bestAlternativeMatch.matchScore}/100 (${bestAlternativeMatch.skillQuality})`);
    console.log(`⏰ Alternative time slots: ${bestAlternativeMatch.alternativeTimeSlots.join(', ')}`);
    
    return bestAlternativeMatch;
  } catch (error) {
    console.error('💥 Error in findMatchingInterviewer:', error);
    return null;
  }
};

// Function to check for conflicting time blocks
export const checkForConflictingTimeBlocks = async (interviewerId: string, scheduledTime: string) => {
  try {
    console.log(`🔍 Checking for conflicting time blocks for interviewer ${interviewerId} at ${scheduledTime}`);
    
    const scheduledDate = new Date(scheduledTime);
    const scheduledDateStr = scheduledDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    const startTime = scheduledDate.toTimeString().slice(0, 5); // HH:MM format
    const endTime = new Date(scheduledDate.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5); // +1 hour
    
    const { data: existingBlocks, error } = await supabase
      .from('interviewer_time_blocks')
      .select('id, start_time, end_time, block_reason')
      .eq('interviewer_id', interviewerId)
      .eq('blocked_date', scheduledDateStr)
      .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);
    
    if (error) {
      console.error('❌ Error checking for conflicting time blocks:', error);
      return false; // Allow booking if we can't check
    }
    
    if (existingBlocks && existingBlocks.length > 0) {
      console.log('⚠️ Found conflicting time blocks:', existingBlocks);
      return true; // Conflict found
    }
    
    console.log('✅ No conflicting time blocks found');
    return false; // No conflicts
  } catch (error) {
    console.error('💥 Error in checkForConflictingTimeBlocks:', error);
    return false; // Allow booking on error
  }
};

// Function to create time block for interview
export const createInterviewTimeBlock = async (
  interviewerId: string,
  scheduledTime: string,
  interviewId?: string
): Promise<void> => {
  try {
    console.log(`🔒 Creating time block for interviewer ${interviewerId} at ${scheduledTime}`);
    
    const scheduledDate = new Date(scheduledTime);
    const scheduledDateStr = format(scheduledDate, 'yyyy-MM-dd');
    const startTime = format(scheduledDate, 'HH:mm');
    const endTime = format(new Date(scheduledDate.getTime() + 60 * 60 * 1000), 'HH:mm');

    const { error } = await supabase
      .from('interviewer_time_blocks')
      .insert({
        interviewer_id: interviewerId,
        blocked_date: scheduledDateStr,
        start_time: startTime,
        end_time: endTime,
        block_reason: 'interview_scheduled',
        interview_id: interviewId
      });

    if (error) {
      console.error('❌ Error creating time block:', error);
      throw error;
    }

    console.log(`✅ Successfully created time block for ${scheduledDateStr} ${startTime}-${endTime}`);
  } catch (error) {
    console.error('💥 Error in createInterviewTimeBlock:', error);
    throw error;
  }
};

export const scheduleInterview = async (interviewer: any, candidate: any, userEmail: string, userFullName: string) => {
  try {
    console.log("Scheduling interview with:", { candidate: userFullName });
    console.log("Full interviewer object:", { interviewer: interviewer.company });
    
    // Convert time slot to proper ISO datetime format first
    // Prioritize selectedTimeSlot from candidate data (from UI selection)
    let selectedTimeSlot = candidate.selectedTimeSlot || candidate.timeSlot;
    if (interviewer.timeMatch) {
      selectedTimeSlot = candidate.selectedTimeSlot || candidate.timeSlot;
    } else if (interviewer.alternativeTimeSlots && interviewer.alternativeTimeSlots.length > 0) {
      // Use the selected time slot from UI if available, otherwise use first alternative
      selectedTimeSlot = candidate.selectedTimeSlot || interviewer.alternativeTimeSlots[0];
    }
    const scheduledDateTime = convertTimeSlotToISODate(selectedTimeSlot);

    // Check for conflicts with the SAME interviewer at the SAME time (allowing multiple interviews with different interviewers or times)
    const { data: conflictingInterview } = await supabase
      .from('interviews')
      .select('id, scheduled_time, interviewer_email')
      .eq('candidate_email', userEmail)
      .eq('interviewer_id', interviewer.id)
      .eq('scheduled_time', scheduledDateTime)
      .eq('status', 'scheduled')
      .maybeSingle();
    
    if (conflictingInterview) {
      console.log('⚠️ Exact time conflict with same interviewer:', conflictingInterview);
      throw new Error(`You already have an interview scheduled with this interviewer at ${new Date(conflictingInterview.scheduled_time).toLocaleString()}`);
    }
    
    // Get the interviewer's profile to get their email
    console.log('🔍 Looking for interviewer profile with user_id:', interviewer.user_id);
    
    // First check if we have user_id
    if (!interviewer.user_id) {
      console.error('❌ No user_id found in interviewer object');
      throw new Error('Interviewer user ID not found. Cannot schedule interview.');
    }
    
    const { data: interviewerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', interviewer.user_id)
      .maybeSingle();

    console.log('📧 Profile lookup result:', { interviewerProfile, profileError });

    if (profileError) {
      console.error('❌ Error fetching interviewer profile:', profileError);
      throw new Error('Error fetching interviewer profile.');
    }

    let interviewerEmail: string;
    let interviewerName: string;

    if (!interviewerProfile) {
      console.error('❌ No profile found for user_id:', interviewer.user_id);
      // Let's check if there are any profiles at all
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .limit(5);
      console.log('📋 Sample profiles in database:', allProfiles);
      
      throw new Error(`Interviewer profile not found for user_id: ${interviewer.user_id}. Please ensure the interviewer has a valid profile.`);
    } 
    
    if (!interviewerProfile.email) {
      console.error('❌ No email found in profile for user_id:', interviewer.user_id);
      console.log('📧 Profile data:', interviewerProfile);
      throw new Error(`Interviewer email not found in profile for user_id: ${interviewer.user_id}. Please ensure the interviewer profile has a valid email.`);
    }
    
    interviewerEmail = interviewerProfile.email;
    interviewerName = interviewerProfile.full_name || interviewer.company || 'Professional Interviewer';
    
    console.log('✅ Found interviewer details:', { 
      email: interviewerEmail, 
      name: interviewerName 
    });
    

    // Fetch the latest resume_url from interviewees table
    let latestResumeUrl = candidate.resumeUrl || candidate.resume_url || null;
    try {
      const { data: intervieweeProfile, error: intervieweeError } = await supabase
        .from('interviewees')
        .select('resume_url')
        .eq('user_id', interviewer.candidate_user_id || candidate.user_id || candidate.candidate_user_id || candidate.userId || candidate.id || null)
        .maybeSingle();
      if (!intervieweeError && intervieweeProfile && intervieweeProfile.resume_url) {
        latestResumeUrl = intervieweeProfile.resume_url;
      }
    } catch (resumeFetchError) {
      console.warn('Could not fetch latest resume_url from interviewees table:', resumeFetchError);
    }
    
    // Create interview record data
    const interviewData = {
      interviewer_id: interviewer.id,
      candidate_id: userEmail, // Use email as consistent identifier
      candidate_name: userFullName || userEmail.split('@')[0],
      candidate_email: userEmail,
      interviewer_email: interviewerEmail,
      interviewer_name: interviewerName,
      target_role: candidate.skillCategories?.join(', ') || 'Not specified',
      experience: candidate.experienceYears?.toString() || candidate.experience || 'Not specified',
      scheduled_time: scheduledDateTime,
      status: 'scheduled',
      resume_url: latestResumeUrl
    };

    console.log("📝 Sending interview data to edge function:", interviewData);

    // Check for conflicting time blocks before booking
    const hasConflict = await checkForConflictingTimeBlocks(interviewer.id, scheduledDateTime);
    if (hasConflict) {
      throw new Error('This time slot is no longer available. Please select a different time.');
    }

    // Call the edge function to handle interview scheduling
    const { data, error } = await supabase.functions.invoke('schedule-interview', {
      body: interviewData
    });

    if (error) {
      console.error('❌ Error calling schedule-interview function:', error);
      throw error;
    }

    // Create time block for the interviewer after successful booking
    if (scheduledDateTime) {
      await createInterviewTimeBlock(interviewer.id, scheduledDateTime, data.interview?.id);
      await blockInterviewerTimeSlot(interviewer.id, selectedTimeSlot); // Use original format for time slot blocking
    }

    console.log("✅ Interview scheduled successfully:", data);
    return data;
  } catch (error) {
    console.error('💥 Error in scheduleInterview:', error);
    throw error;
  }
};

// Function to block specific datetime from interviewer's availability
export const blockInterviewerTimeSlot = async (interviewerId: string, timeSlot: string) => {
  try {
    console.log(`🔒 Blocking time slot ${timeSlot} for interviewer ${interviewerId}`);
    
    // Get current time slots
    const { data: interviewer, error: fetchError } = await supabase
      .from('interviewers')
      .select('current_time_slots')
      .eq('id', interviewerId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching interviewer time slots:', fetchError);
      return;
    }

    // Parse the scheduled datetime
    const scheduledDate = new Date(timeSlot);
    const scheduledDay = scheduledDate.toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: 'Asia/Kolkata'
    });
    
    const scheduledHour = parseInt(scheduledDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      hour12: false,
      timeZone: 'Asia/Kolkata'
    }));
    
    const scheduledMinutes = parseInt(scheduledDate.toLocaleTimeString('en-US', { 
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    }));

    console.log(`📅 Blocking ${scheduledDay} at ${scheduledHour}:${scheduledMinutes.toString().padStart(2, '0')}`);

    const currentSlots = interviewer.current_time_slots || {};
    const daySlots = (currentSlots as any)?.[scheduledDay] || [];
    
    if (!Array.isArray(daySlots) || daySlots.length === 0) {
      console.log(`❌ No availability found for ${scheduledDay}`);
      return;
    }

    // Create 1-hour blocked slot
    const blockStartTime = `${scheduledHour}:${scheduledMinutes.toString().padStart(2, '0')}`;
    const blockEndHour = scheduledHour + 1;
    const blockEndTime = `${blockEndHour}:${scheduledMinutes.toString().padStart(2, '0')}`;
    
    console.log(`🚫 Blocking time range: ${blockStartTime} - ${blockEndTime}`);

    // Process each time slot for the day
    const updatedDaySlots = [];
    
    for (const slot of daySlots) {
      if (typeof slot === 'object' && slot.start && slot.end) {
        const slotStart = timeToMinutes(slot.start);
        const slotEnd = timeToMinutes(slot.end);
        const blockStart = timeToMinutes(blockStartTime);
        const blockEnd = timeToMinutes(blockEndTime);
        
        console.log(`🔍 Processing slot ${slot.start}-${slot.end} (${slotStart}-${slotEnd} mins)`);
        console.log(`🚫 Block range: ${blockStart}-${blockEnd} mins`);
        
        // Check if block overlaps with this slot
        if (blockEnd <= slotStart || blockStart >= slotEnd) {
          // No overlap, keep the slot as is
          updatedDaySlots.push(slot);
          console.log(`✅ No overlap - keeping slot ${slot.start}-${slot.end}`);
        } else {
          // Overlap detected - split the slot
          console.log(`⚠️ Overlap detected - splitting slot`);
          
          // Add slot before the block (if any)
          if (slotStart < blockStart) {
            const beforeSlot = {
              id: generateSlotId(),
              start: slot.start,
              end: minutesToTime(blockStart)
            };
            updatedDaySlots.push(beforeSlot);
            console.log(`📝 Added before-block slot: ${beforeSlot.start}-${beforeSlot.end}`);
          }
          
          // Add slot after the block (if any)
          if (slotEnd > blockEnd) {
            const afterSlot = {
              id: generateSlotId(),
              start: minutesToTime(blockEnd),
              end: slot.end
            };
            updatedDaySlots.push(afterSlot);
            console.log(`📝 Added after-block slot: ${afterSlot.start}-${afterSlot.end}`);
          }
        }
      } else {
        // Keep non-object slots as is
        updatedDaySlots.push(slot);
      }
    }

    // Update the interviewer's time slots
    const updatedSlots = currentSlots && typeof currentSlots === 'object' ? {
      ...(currentSlots as Record<string, any>),
      [scheduledDay]: updatedDaySlots
    } : {
      [scheduledDay]: updatedDaySlots
    };

    const { error: updateError } = await supabase
      .from('interviewers')
      .update({ 
        current_time_slots: updatedSlots,
        schedule_last_updated: new Date().toISOString()
      })
      .eq('id', interviewerId);

    if (updateError) {
      console.error('❌ Error updating interviewer time slots:', updateError);
    } else {
      console.log(`✅ Successfully blocked time slot ${blockStartTime}-${blockEndTime} for interviewer ${interviewerId}`);
      console.log(`📊 Updated slots for ${scheduledDay}:`, updatedDaySlots);
    }
  } catch (error) {
    console.error('💥 Error in blockInterviewerTimeSlot:', error);
  }
};

// Helper function to convert time string to minutes since midnight
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert minutes since midnight to time string
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Helper function to generate unique slot IDs
const generateSlotId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
