
import { supabase } from "@/integrations/supabase/client";
import { MatchingCandidate, MatchedInterviewer, checkSkillsMatch, checkTimeSlotMatch, parseExperience, getAlternativeTimeSlots } from "@/utils/interviewerMatching";

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

    // Score and rank interviewers
    console.log('\n🎯 === EVALUATING EACH INTERVIEWER ===');
    const scoredInterviewers = allInterviewers.map((interviewer, index) => {
      let score = 0;
      const reasons = [];

      console.log(`\n🔍 === EVALUATING INTERVIEWER ${index + 1}: ${interviewer.company || 'Unknown'} ===`);

      // 1. Skills matching (40 points) - More comprehensive now
      console.log('\n📋 STEP 1: Skills Evaluation');
      const skillsMatch = checkSkillsMatch(
        candidateData.targetRole, 
        interviewer.skills || [], 
        interviewer.technologies || []
      );
      if (skillsMatch) {
        score += 40;
        reasons.push('Skills match');
        console.log('✅ Skills match: +40 points');
      } else {
        console.log('❌ No skills match: +0 points');
      }

      // 2. Experience matching (30 points)
      console.log('\n👨‍💼 STEP 2: Experience Evaluation');
      const interviewerExp = interviewer.experience_years || 0;
      console.log(`Experience comparison: Interviewer ${interviewerExp} years vs Candidate ${candidateExperience} years`);
      
      if (interviewerExp >= candidateExperience) {
        const expDiff = Math.abs(interviewerExp - candidateExperience);
        if (expDiff <= 2) {
          score += 30;
          reasons.push('Experience appropriate');
          console.log('✅ Experience appropriate: +30 points');
        } else if (expDiff <= 5) {
          score += 20;
          reasons.push('Experience acceptable');
          console.log('✅ Experience acceptable: +20 points');
        } else {
          console.log('⚠️ Experience gap too large: +0 points');
        }
      } else {
        console.log('❌ Insufficient experience: +0 points');
      }

      // 3. Time slot availability (30 points)
      console.log('\n⏰ STEP 3: Time Availability Evaluation');
      const timeMatch = checkTimeSlotMatch(candidateData.timeSlot || '', interviewer.current_time_slots);
      if (timeMatch) {
        score += 30;
        reasons.push('Time available');
        console.log('✅ Time available: +30 points');
      } else {
        console.log('❌ Time not available: +0 points');
      }

      // Get alternative time slots for this interviewer
      const alternativeTimeSlots = getAlternativeTimeSlots(interviewer.current_time_slots);

      console.log(`\n🎯 FINAL SCORE for ${interviewer.company}: ${score}/100`);
      console.log(`📋 Match Reasons: ${reasons.join(', ')}`);
      console.log(`⏰ Alternative Slots Available: ${alternativeTimeSlots.length}`);
      console.log(`   ${alternativeTimeSlots.slice(0, 3).join('; ')}`);
      
      return {
        ...interviewer,
        matchScore: score,
        matchReasons: reasons,
        alternativeTimeSlots
      };
    });

    // Sort by score descending
    scoredInterviewers.sort((a, b) => b.matchScore - a.matchScore);
    
    console.log('\n🏆 === FINAL RANKING ===');
    scoredInterviewers.forEach((interviewer, index) => {
      console.log(`${index + 1}. ${interviewer.company || 'Unknown'} - Score: ${interviewer.matchScore}/100`);
      console.log(`   Reasons: ${interviewer.matchReasons.join(', ')}`);
      console.log(`   Alt Slots: ${interviewer.alternativeTimeSlots.length} available`);
    });

    // Return best match if score is reasonable (at least skills match OR has good availability)
    const bestMatch = scoredInterviewers[0];
    
    // More flexible matching criteria
    const hasSkillsMatch = bestMatch && bestMatch.matchReasons.includes('Skills match');
    const hasTimeMatch = bestMatch && bestMatch.matchReasons.includes('Time available');
    const hasAlternatives = bestMatch && bestMatch.alternativeTimeSlots.length > 0;
    const hasGoodScore = bestMatch && bestMatch.matchScore >= 30; // Lowered threshold

    console.log('\n🎯 === FINAL DECISION ===');
    console.log(`Best candidate: ${bestMatch?.company || 'None'}`);
    console.log(`Has skills match: ${hasSkillsMatch}`);
    console.log(`Has time match: ${hasTimeMatch}`);
    console.log(`Has alternatives: ${hasAlternatives}`);
    console.log(`Has good score (>=30): ${hasGoodScore}`);

    if (bestMatch && (hasSkillsMatch || hasGoodScore || hasAlternatives)) {
      console.log(`✅ MATCH SELECTED: ${bestMatch.company || 'Unknown'} with score ${bestMatch.matchScore}/100`);
      console.log(`   Primary reason: ${bestMatch.matchReasons[0] || 'Available'}`);
      return bestMatch;
    }

    // Fallback: return any interviewer with skills match, even with lower score
    const skillsOnlyMatch = scoredInterviewers.find(interviewer => 
      interviewer.matchReasons.includes('Skills match')
    );

    if (skillsOnlyMatch) {
      console.log(`⚠️ FALLBACK MATCH (skills only): ${skillsOnlyMatch.company || 'Unknown'}`);
      return skillsOnlyMatch;
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
    
    // Create interview record data
    const interviewData = {
      interviewer_id: interviewer.id,
      candidate_id: candidate.user_id || userEmail, // Use email as fallback if user_id not available
      candidate_name: userFullName || userEmail,
      candidate_email: userEmail,
      interviewer_email: interviewer.user_id, // This should be the interviewer's email
      target_role: candidate.targetRole,
      experience: candidate.experience,
      scheduled_time: candidate.timeSlot || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default to tomorrow
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

    console.log("Interview scheduled successfully:", data);
    return data;
  } catch (error) {
    console.error('Error in scheduleInterview:', error);
    throw error;
  }
};
