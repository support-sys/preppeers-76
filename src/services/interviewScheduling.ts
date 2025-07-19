import { supabase } from "@/integrations/supabase/client";
import { 
  MatchingCandidate, 
  MatchedInterviewer, 
  checkSkillsMatch, 
  checkTimeSlotMatch, 
  parseExperience, 
  getAlternativeTimeSlots,
  checkEnhancedSkillsMatch,
  checkEnhancedExperienceMatch
} from "@/utils/interviewerMatching";

export const findMatchingInterviewer = async (candidateData: MatchingCandidate): Promise<MatchedInterviewer | null> => {
  try {
    console.log('\n🚀 === STARTING INTERVIEWER MATCHING PROCESS ===');
    console.log('👤 Candidate Data:', {
      targetRole: candidateData.targetRole,
      experienceYears: candidateData.experienceYears,
      experience: candidateData.experience,
      timeSlot: candidateData.timeSlot,
      hasResume: !!candidateData.resume,
      skillCategories: candidateData.skillCategories,
      specificSkills: candidateData.specificSkills
    });
    
    // Get all interviewers first
    const { data: allInterviewers, error } = await supabase
      .from('interviewers')
      .select('*');

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
      console.log(`   ⏰ Time Slots: ${JSON.stringify(interviewer.current_time_slots)}`);
    });

    const candidateExperience = candidateData.experienceYears || parseExperience(candidateData.experience || '');
    console.log(`\n👤 Candidate parsed experience: ${candidateExperience} years`);

    // Score and rank interviewers using enhanced matching
    console.log('\n🎯 === EVALUATING EACH INTERVIEWER WITH ENHANCED MATCHING ===');
    const scoredInterviewers = filteredInterviewers.map((interviewer, index) => {
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

      // 3. Time slot availability (25 points max)
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
        timeMatch
      };
    });

    // First, try to find interviewers with exact time matches
    const exactMatchInterviewers = scoredInterviewers.filter(i => i.timeMatch);
    exactMatchInterviewers.sort((a, b) => b.matchScore - a.matchScore);

    if (exactMatchInterviewers.length > 0) {
      const bestExactMatch = exactMatchInterviewers[0];
      console.log(`\n🏆 Best exact time match: ${bestExactMatch.company || 'Unknown'} - Score: ${bestExactMatch.matchScore}/100`);
      return bestExactMatch;
    }

    // If no exact matches, find the best interviewer with alternative time slots
    console.log('\n⏰ No exact time matches found. Looking for best alternative...');
    
    const interviewersWithAlternatives = scoredInterviewers.filter(i => 
      i.alternativeTimeSlots && i.alternativeTimeSlots.length > 0
    );

    if (interviewersWithAlternatives.length === 0) {
      console.log('❌ No suitable interviewers with any available time slots.');
      return null;
    }

    // Sort by match score first, then by earliest alternative time slot
    interviewersWithAlternatives.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      // If scores are equal, prefer the one with earlier time slots
      const aEarliest = a.alternativeTimeSlots[0] || '';
      const bEarliest = b.alternativeTimeSlots[0] || '';
      return aEarliest.localeCompare(bEarliest);
    });

    const bestAlternativeMatch = interviewersWithAlternatives[0];
    console.log(`\n🏆 Best alternative match: ${bestAlternativeMatch.company || 'Unknown'} - Score: ${bestAlternativeMatch.matchScore}/100`);
    console.log(`⏰ Alternative time slots: ${bestAlternativeMatch.alternativeTimeSlots.join(', ')}`);
    
    return bestAlternativeMatch;
  } catch (error) {
    console.error('💥 Error in findMatchingInterviewer:', error);
    return null;
  }
};

export const scheduleInterview = async (interviewer: any, candidate: any, userEmail: string, userFullName: string) => {
  try {
    console.log("Scheduling interview with:", { candidate: userFullName });
    console.log("Full interviewer object:", { interviewer: interviewer.company });
    
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
    
    // Select the best available time slot
    let selectedTimeSlot = candidate.timeSlot;
    if (!selectedTimeSlot && interviewer.alternativeTimeSlots && interviewer.alternativeTimeSlots.length > 0) {
      selectedTimeSlot = interviewer.alternativeTimeSlots[0];
    }

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
      target_role: candidate.targetRole,
      experience: candidate.experienceYears?.toString() || candidate.experience || 'Not specified',
      scheduled_time: selectedTimeSlot || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default to tomorrow
      status: 'scheduled',
      resume_url: latestResumeUrl
    };

    console.log("📝 Sending interview data to edge function:", interviewData);

    // Call the edge function to handle interview scheduling
    const { data, error } = await supabase.functions.invoke('schedule-interview', {
      body: interviewData
    });

    if (error) {
      console.error('❌ Error calling schedule-interview function:', error);
      throw error;
    }

    // Block the time slot for the interviewer after successful booking
    if (selectedTimeSlot) {
      await blockInterviewerTimeSlot(interviewer.id, selectedTimeSlot);
    }

    console.log("✅ Interview scheduled successfully:", data);
    return data;
  } catch (error) {
    console.error('💥 Error in scheduleInterview:', error);
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
