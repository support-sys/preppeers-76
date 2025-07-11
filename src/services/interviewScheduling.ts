
import { supabase } from "@/integrations/supabase/client";
import { 
  MatchingCandidate, 
  MatchedInterviewer, 
  checkSkillsMatch, 
  checkTimeSlotMatch, 
  parseExperience, 
  getAlternativeTimeSlots,
  checkEnhancedSkillsMatch,
  checkEnhancedExperienceMatch,
  checkCompanyMatch
} from "@/utils/interviewerMatching";

export const findMatchingInterviewer = async (candidateData: MatchingCandidate): Promise<MatchedInterviewer | null> => {
  try {
    console.log('\n🚀 === STARTING INTERVIEWER MATCHING PROCESS ===');
    console.log('👤 Candidate Data:', {
      targetRole: candidateData.targetRole,
      experience: candidateData.experience,
      timeSlot: candidateData.timeSlot,
      hasResume: !!candidateData.resume
    });
    
    // Get all interviewers first
    const { data: allInterviewers, error } = await supabase
      .from('interviewers')
      .select('*');

    if (error) {
      console.error('❌ Error fetching interviewers:', error);
      return null;
    }

    console.log(`\n📋 Found ${allInterviewers?.length || 0} interviewers in database`);

    if (!allInterviewers || allInterviewers.length === 0) {
      console.log('❌ No interviewers found in database');
      return null;
    }

    // Log all interviewers data for debugging
    console.log('\n📊 === INTERVIEWER DATABASE OVERVIEW ===');
    allInterviewers.forEach((interviewer, index) => {
      console.log(`\n👨‍💼 Interviewer ${index + 1}: ${interviewer.company || 'Unknown Company'}`);
      console.log(`   📋 Skill Categories: ${JSON.stringify(interviewer.skills)}`);
      console.log(`   🔧 Technologies: ${JSON.stringify(interviewer.technologies)}`);
      console.log(`   📅 Experience: ${interviewer.experience_years} years`);
      console.log(`   ⏰ Time Slots: ${JSON.stringify(interviewer.current_time_slots)}`);
    });

    const candidateExperience = parseExperience(candidateData.experience);
    console.log(`\n👤 Candidate parsed experience: ${candidateExperience} years`);

    // Score and rank interviewers using enhanced matching
    console.log('\n🎯 === EVALUATING EACH INTERVIEWER WITH ENHANCED MATCHING ===');
    const scoredInterviewers = allInterviewers.map((interviewer, index) => {
      let totalScore = 0;
      const allReasons = [];
      const allDetails = [];

      console.log(`\n🔍 === EVALUATING INTERVIEWER ${index + 1}: ${interviewer.company || 'Unknown'} ===`);

      // 1. Enhanced Skills matching (50 points max)
      console.log('\n📋 STEP 1: Enhanced Skills Evaluation');
      const skillsResult = checkEnhancedSkillsMatch(
        candidateData,
        interviewer.skills || [], 
        interviewer.technologies || []
      );
      totalScore += skillsResult.score;
      if (skillsResult.match) {
        allReasons.push('Advanced skills match');
      }
      allDetails.push(...skillsResult.details);
      console.log(`✅ Skills evaluation: +${skillsResult.score}/50 points`);

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

      // 3. Company preference matching (5 points max)
      console.log('\n🏢 STEP 3: Company Preference Evaluation');
      const companyResult = checkCompanyMatch(candidateData, interviewer.company || '');
      totalScore += companyResult.score;
      if (companyResult.match) {
        allReasons.push('Target company match');
      }
      allDetails.push(...companyResult.details);
      console.log(`✅ Company evaluation: +${companyResult.score}/5 points`);

      // 4. Time slot availability (25 points max)
      console.log('\n⏰ STEP 4: Time Availability Evaluation');
      const timeMatch = checkTimeSlotMatch(candidateData.timeSlot || '', interviewer.current_time_slots);
      if (timeMatch) {
        totalScore += 25;
        allReasons.push('Time available');
        allDetails.push('Exact time slot match found');
        console.log('✅ Time available: +25 points');
      } else {
        console.log('❌ Time not available: +0 points');
      }

      // Get alternative time slots for this interviewer
      const alternativeTimeSlots = getAlternativeTimeSlots(interviewer.current_time_slots);
      if (alternativeTimeSlots.length > 0 && !timeMatch) {
        totalScore += 5; // Small bonus for having alternatives
        allDetails.push(`${alternativeTimeSlots.length} alternative time slots available`);
      }

      console.log(`\n🎯 ENHANCED FINAL SCORE for ${interviewer.company}: ${totalScore}/105`);
      console.log(`📋 Match Reasons: ${allReasons.join(', ')}`);
      console.log(`📝 Match Details: ${allDetails.join('; ')}`);
      console.log(`⏰ Alternative Slots Available: ${alternativeTimeSlots.length}`);
      console.log(`   ${alternativeTimeSlots.slice(0, 3).join('; ')}`);
      
      return {
        ...interviewer,
        matchScore: totalScore,
        matchReasons: allReasons,
        matchDetails: allDetails,
        alternativeTimeSlots
      };
    });

    // Sort by score descending
    scoredInterviewers.sort((a, b) => b.matchScore - a.matchScore);
    
    console.log('\n🏆 === FINAL RANKING ===');
    scoredInterviewers.forEach((interviewer, index) => {
      console.log(`${index + 1}. ${interviewer.company || 'Unknown'} - Score: ${interviewer.matchScore}/105`);
      console.log(`   Reasons: ${interviewer.matchReasons.join(', ')}`);
      console.log(`   Details: ${interviewer.matchDetails?.slice(0, 2).join('; ') || 'No details'}`);
      console.log(`   Alt Slots: ${interviewer.alternativeTimeSlots.length} available`);
    });

    // Return best match if score is reasonable with enhanced criteria
    const bestMatch = scoredInterviewers[0];
    
    // Enhanced matching criteria
    const hasAdvancedSkillsMatch = bestMatch && bestMatch.matchReasons.includes('Advanced skills match');
    const hasTimeMatch = bestMatch && bestMatch.matchReasons.includes('Time available');
    const hasExperienceMatch = bestMatch && bestMatch.matchReasons.includes('Appropriate experience level');
    const hasCompanyMatch = bestMatch && bestMatch.matchReasons.includes('Target company match');
    const hasAlternatives = bestMatch && bestMatch.alternativeTimeSlots.length > 0;
    const hasGoodScore = bestMatch && bestMatch.matchScore >= 40; // Increased threshold for quality
    const hasMinimumScore = bestMatch && bestMatch.matchScore >= 25; // Minimum acceptable score

    console.log('\n🎯 === ENHANCED FINAL DECISION ===');
    console.log(`Best candidate: ${bestMatch?.company || 'None'}`);
    console.log(`Has advanced skills match: ${hasAdvancedSkillsMatch}`);
    console.log(`Has time match: ${hasTimeMatch}`);
    console.log(`Has experience match: ${hasExperienceMatch}`);
    console.log(`Has company match: ${hasCompanyMatch}`);
    console.log(`Has alternatives: ${hasAlternatives}`);
    console.log(`Has good score (>=40): ${hasGoodScore}`);
    console.log(`Has minimum score (>=25): ${hasMinimumScore}`);

    // Prioritize quality matches first
    if (bestMatch && (hasAdvancedSkillsMatch || hasGoodScore) && hasMinimumScore) {
      console.log(`✅ HIGH-QUALITY MATCH SELECTED: ${bestMatch.company || 'Unknown'} with score ${bestMatch.matchScore}/105`);
      console.log(`   Primary reasons: ${bestMatch.matchReasons.join(', ')}`);
      return bestMatch;
    }

    // Fallback: return interviewer with minimum acceptable criteria
    const acceptableMatch = scoredInterviewers.find(interviewer => 
      interviewer.matchScore >= 25 && (
        interviewer.matchReasons.includes('Advanced skills match') ||
        interviewer.matchReasons.includes('Appropriate experience level') ||
        interviewer.alternativeTimeSlots.length > 0
      )
    );

    if (acceptableMatch) {
      console.log(`⚠️ ACCEPTABLE MATCH: ${acceptableMatch.company || 'Unknown'} with score ${acceptableMatch.matchScore}/105`);
      return acceptableMatch;
    }

    console.log('❌ NO SUITABLE INTERVIEWER FOUND');
    console.log('=== END MATCHING PROCESS ===\n');
    return null;
  } catch (error) {
    console.error('💥 Error in findMatchingInterviewer:', error);
    return null;
  }
};

export const scheduleInterview = async (interviewer: any, candidate: any, userEmail: string, userFullName: string) => {
  try {
    console.log("Scheduling interview with:", { interviewer: interviewer.company, candidate: userFullName });
    
    // Get the interviewer's profile to get their email
    const { data: interviewerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', interviewer.user_id)
      .single();

    if (profileError || !interviewerProfile?.email) {
      console.error('Error fetching interviewer profile or email not found:', profileError);
      throw new Error('Interviewer email not found. Cannot schedule interview.');
    }

    const interviewerEmail = interviewerProfile.email;
    const interviewerName = interviewerProfile.full_name || interviewer.company || 'Professional Interviewer';
    
    // Select the best available time slot
    let selectedTimeSlot = candidate.timeSlot;
    if (!selectedTimeSlot && interviewer.alternativeTimeSlots && interviewer.alternativeTimeSlots.length > 0) {
      selectedTimeSlot = interviewer.alternativeTimeSlots[0];
    }
    
    // Create interview record data
    const interviewData = {
      interviewer_id: interviewer.id,
      candidate_id: userEmail, // Use email as consistent identifier
      candidate_name: userFullName || userEmail.split('@')[0],
      candidate_email: userEmail,
      interviewer_email: interviewerEmail,
      interviewer_name: interviewerName,
      target_role: candidate.targetRole,
      experience: candidate.experience,
      scheduled_time: selectedTimeSlot || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default to tomorrow
      status: 'scheduled',
      resume_url: candidate.resume ? 'uploaded' : null
    };

    console.log("Sending interview data to edge function:", interviewData);

    // Call the edge function to handle interview scheduling
    const { data, error } = await supabase.functions.invoke('schedule-interview', {
      body: interviewData
    });

    if (error) {
      console.error('Error calling schedule-interview function:', error);
      throw error;
    }

    // Block the time slot for the interviewer after successful booking
    if (selectedTimeSlot) {
      await blockInterviewerTimeSlot(interviewer.id, selectedTimeSlot);
    }

    console.log("Interview scheduled successfully:", data);
    return data;
  } catch (error) {
    console.error('Error in scheduleInterview:', error);
    throw error;
  }
};

// New function to block interviewer time slots
export const blockInterviewerTimeSlot = async (interviewerId: string, timeSlot: string) => {
  try {
    console.log(`Blocking time slot ${timeSlot} for interviewer ${interviewerId}`);
    
    // Get current time slots
    const { data: interviewer, error: fetchError } = await supabase
      .from('interviewers')
      .select('current_time_slots')
      .eq('id', interviewerId)
      .single();

    if (fetchError) {
      console.error('Error fetching interviewer time slots:', fetchError);
      return;
    }

    // Remove the booked time slot from available slots
    const currentSlots = interviewer.current_time_slots || [];
    const updatedSlots = Array.isArray(currentSlots) 
      ? currentSlots.filter(slot => slot !== timeSlot)
      : [];

    // Update the interviewer's available time slots
    const { error: updateError } = await supabase
      .from('interviewers')
      .update({ 
        current_time_slots: updatedSlots,
        schedule_last_updated: new Date().toISOString()
      })
      .eq('id', interviewerId);

    if (updateError) {
      console.error('Error updating interviewer time slots:', updateError);
    } else {
      console.log(`Successfully blocked time slot ${timeSlot} for interviewer ${interviewerId}`);
    }
  } catch (error) {
    console.error('Error in blockInterviewerTimeSlot:', error);
  }
};
