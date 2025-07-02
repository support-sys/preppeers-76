
import { supabase } from "@/integrations/supabase/client";
import { MatchingCandidate, MatchedInterviewer, checkSkillsMatch, checkTimeSlotMatch, parseExperience, getAlternativeTimeSlots } from "@/utils/interviewerMatching";

export const findMatchingInterviewer = async (candidateData: MatchingCandidate): Promise<MatchedInterviewer | null> => {
  try {
    console.log('Finding matching interviewer for candidate:', candidateData);
    
    // Get all interviewers first
    const { data: allInterviewers, error } = await supabase
      .from('interviewers')
      .select('*');

    if (error) {
      console.error('Error fetching interviewers:', error);
      return null;
    }

    console.log('All interviewers found:', allInterviewers?.length);

    if (!allInterviewers || allInterviewers.length === 0) {
      console.log('No interviewers found in database');
      return null;
    }

    const candidateExperience = parseExperience(candidateData.experience);
    console.log('Candidate parsed experience:', candidateExperience);

    // Score and rank interviewers
    const scoredInterviewers = allInterviewers.map(interviewer => {
      let score = 0;
      const reasons = [];

      console.log(`\n--- Evaluating interviewer: ${interviewer.company || 'Unknown'} ---`);
      console.log('Interviewer skills:', interviewer.skills);
      console.log('Interviewer technologies:', interviewer.technologies);
      console.log('Interviewer time slots:', interviewer.current_time_slots);

      // 1. Skills matching (40 points) - More lenient now
      const skillsMatch = checkSkillsMatch(
        candidateData.targetRole, 
        interviewer.skills || [], 
        interviewer.technologies || []
      );
      if (skillsMatch) {
        score += 40;
        reasons.push('Skills match');
      }

      // 2. Experience matching (30 points)
      const interviewerExp = interviewer.experience_years || 0;
      if (interviewerExp >= candidateExperience) {
        const expDiff = Math.abs(interviewerExp - candidateExperience);
        if (expDiff <= 2) {
          score += 30;
          reasons.push('Experience appropriate');
        } else if (expDiff <= 5) {
          score += 20;
          reasons.push('Experience acceptable');
        }
      }

      // 3. Time slot availability (30 points)
      const timeMatch = checkTimeSlotMatch(candidateData.timeSlot || '', interviewer.current_time_slots);
      if (timeMatch) {
        score += 30;
        reasons.push('Time available');
      }

      // Get alternative time slots for this interviewer
      const alternativeTimeSlots = getAlternativeTimeSlots(interviewer.current_time_slots);

      console.log(`Interviewer score: ${score}, reasons: ${reasons.join(', ')}`);
      console.log(`Alternative slots: ${alternativeTimeSlots.join(', ')}`);
      
      return {
        ...interviewer,
        matchScore: score,
        matchReasons: reasons,
        alternativeTimeSlots
      };
    });

    // Sort by score descending
    scoredInterviewers.sort((a, b) => b.matchScore - a.matchScore);
    
    console.log('Top 3 scored interviewers:');
    scoredInterviewers.slice(0, 3).forEach((interviewer, index) => {
      console.log(`${index + 1}. ${interviewer.company || 'Unknown'} - Score: ${interviewer.matchScore}, Reasons: ${interviewer.matchReasons.join(', ')}`);
    });

    // Return best match if score is reasonable (at least skills match OR has availability)
    const bestMatch = scoredInterviewers[0];
    if (bestMatch && (bestMatch.matchScore >= 40 || bestMatch.alternativeTimeSlots.length > 0)) {
      console.log('Best match found:', bestMatch.company || 'Unknown', 'Score:', bestMatch.matchScore);
      return bestMatch;
    }

    // Fallback: return any interviewer with skills match, even without time match
    const skillsOnlyMatch = scoredInterviewers.find(interviewer => 
      interviewer.matchReasons.includes('Skills match')
    );

    if (skillsOnlyMatch) {
      console.log('Skills-only match found:', skillsOnlyMatch.company || 'Unknown');
      return skillsOnlyMatch;
    }

    console.log('No suitable interviewer found');
    return null;
  } catch (error) {
    console.error('Error in findMatchingInterviewer:', error);
    return null;
  }
};

export const scheduleInterview = async (interviewer: any, candidate: any, userEmail: string, userFullName: string) => {
  try {
    // Create interview record
    const interviewData = {
      interviewer_id: interviewer.id,
      candidate_id: candidate.user_id,
      candidate_name: userFullName || userEmail,
      candidate_email: userEmail,
      interviewer_email: interviewer.user_id, // This should be the interviewer's email
      target_role: candidate.targetRole,
      experience: candidate.experience,
      scheduled_time: candidate.timeSlot || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default to tomorrow
      status: 'scheduled',
      resume_url: candidate.resume ? 'uploaded' : null
    };

    // Send email notifications (this will be handled by an edge function)
    const { data, error } = await supabase.functions.invoke('schedule-interview', {
      body: interviewData
    });

    if (error) {
      console.error('Error scheduling interview:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in scheduleInterview:', error);
    throw error;
  }
};
