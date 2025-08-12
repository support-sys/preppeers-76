
export interface MatchingCandidate {
  experienceYears?: number;
  experience?: string;
  timeSlot?: string;
  resume?: File | undefined;
  // Enhanced candidate data
  currentPosition?: string;
  company?: string;
  bio?: string;
  skillCategories: string[]; // Make required for matching
  specificSkills?: string[];
  noticePeriod?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  excludeInterviewerId?: string;
}

export interface MatchedInterviewer {
  id: string;
  company?: string;
  skills?: string[];
  technologies?: string[];
  experience_years?: number;
  current_time_slots?: any;
  matchScore?: number;
  matchReasons?: string[];
  alternativeTimeSlots?: string[];
}

// Enhanced skill category mapping with technologies
export const skillCategoryMapping: { [key: string]: string[] } = {
  "Frontend Development": ["React", "Vue.js", "Angular", "JavaScript", "TypeScript", "HTML/CSS", "Next.js", "Svelte"],
  "Backend Development": ["Node.js", "Python", "Java", "Go", "Ruby", "PHP", "C#", ".NET", "Spring Boot"],
  "Full Stack Development": ["MERN Stack", "MEAN Stack", "Django", "Rails", "Laravel", "Express.js"],
  "System Design": ["Microservices", "Database Design", "Scalability", "Load Balancing", "Caching", "API Design"]
};

/*
"Mobile Development": ["React Native", "Flutter", "iOS", "Android", "Swift", "Kotlin", "Ionic", "Xamarin"],
  "DevOps & Cloud": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible"],
  "Data Science & AI": ["Python", "R", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "SQL"],
*/

export const parseTimeSlot = (timeSlot: string) => {
  if (!timeSlot) return null;
  
  try {
    // Parse the ISO string directly to get the correct date
    const date = new Date(timeSlot);
    
    // Use UTC parsing to avoid timezone confusion for the date part
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    
    // Create a proper date for day calculation in Asia/Kolkata
    const localDate = new Date(year, month, day);
    const dayOfWeek = localDate.toLocaleDateString('en-US', { 
      weekday: 'long'
    });
    
    console.log('🕐 Parsed candidate time slot:', { 
      dayOfWeek, 
      hour, 
      minutes, 
      timeString: `${hour}:${minutes.toString().padStart(2, '0')}`,
      originalTimeSlot: timeSlot,
      parsedDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    });
    
    return { dayOfWeek, hour, minutes, date };
  } catch (error) {
    console.error('❌ Error parsing time slot:', error);
    return null;
  }
};

export const checkTimeSlotMatch = (candidateTimeSlot: string, interviewerTimeSlots: any) => {
  console.log('\n🔍 === TIME SLOT MATCHING DEBUG ===');
  console.log('📅 Candidate time slot:', candidateTimeSlot);
  console.log('📅 Interviewer time slots:', JSON.stringify(interviewerTimeSlots, null, 2));
  
  if (!candidateTimeSlot || !interviewerTimeSlots) {
    console.log('❌ Missing time slot data');
    return false;
  }

  const parsedCandidateTime = parseTimeSlot(candidateTimeSlot);
  if (!parsedCandidateTime) {
    console.log('❌ Could not parse candidate time slot');
    return false;
  }

  const { dayOfWeek, hour, minutes } = parsedCandidateTime;
  const candidateTimeInMinutes = hour * 60 + minutes;

  console.log(`🎯 Looking for availability on ${dayOfWeek} at ${hour}:${minutes.toString().padStart(2, '0')} (${candidateTimeInMinutes} minutes from midnight)`);

  // Check if interviewer has slots for this day
  const daySlots = interviewerTimeSlots[dayOfWeek];
  if (!daySlots || !Array.isArray(daySlots)) {
    console.log(`❌ No slots found for ${dayOfWeek}`);
    console.log(`Available days: ${Object.keys(interviewerTimeSlots).join(', ')}`);
    return false;
  }

  console.log(`📋 Found ${daySlots.length} time slots for ${dayOfWeek}:`, daySlots);

  // Check each time slot to see if candidate's time falls within any range
  for (let i = 0; i < daySlots.length; i++) {
    const slot = daySlots[i];
    console.log(`\n🔍 Checking slot ${i + 1}:`, slot);

    // Handle different slot formats
    let startTime, endTime;
    
    if (typeof slot === 'object' && slot.start && slot.end) {
      // Object format: {start: "11:00", end: "17:00"}
      startTime = slot.start;
      endTime = slot.end;
      console.log(`📊 Object format slot - Start: ${startTime}, End: ${endTime}`);
    } else if (typeof slot === 'string') {
      // String format: "11:00" (treat as 1-hour slot)
      startTime = slot;
      const [startHour, startMin] = slot.split(':').map(Number);
      endTime = `${startHour + 1}:${startMin.toString().padStart(2, '0')}`;
      console.log(`📊 String format slot - Start: ${startTime}, End: ${endTime} (assumed 1-hour duration)`);
    } else {
      console.log('❌ Unknown slot format, skipping');
      continue;
    }

    // Parse start and end times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startTimeInMinutes = startHour * 60 + startMin;
    const endTimeInMinutes = endHour * 60 + endMin;

    console.log(`⏰ Time range: ${startHour}:${startMin.toString().padStart(2, '0')} - ${endHour}:${endMin.toString().padStart(2, '0')}`);
    console.log(`🔢 Minutes range: ${startTimeInMinutes} - ${endTimeInMinutes}`);
    console.log(`🎯 Candidate time: ${candidateTimeInMinutes} minutes`);

    // Check if candidate's time falls within this slot
    if (candidateTimeInMinutes >= startTimeInMinutes && candidateTimeInMinutes <= endTimeInMinutes) {
      console.log(`✅ MATCH FOUND! Candidate time ${hour}:${minutes.toString().padStart(2, '0')} falls within slot ${startTime}-${endTime}`);
      return true;
    } else {
      console.log(`❌ No match - candidate time ${candidateTimeInMinutes} is outside range ${startTimeInMinutes}-${endTimeInMinutes}`);
    }
  }

  console.log(`❌ No matching time slots found for ${dayOfWeek}`);
  console.log('=== END TIME SLOT MATCHING DEBUG ===\n');
  return false;
};

export const getAlternativeTimeSlots = (interviewerTimeSlots: any): string[] => {
  if (!interviewerTimeSlots) return [];
  
  const alternatives: string[] = [];
  
  Object.entries(interviewerTimeSlots).forEach(([day, slots]) => {
    if (Array.isArray(slots)) {
      slots.forEach((slot: any) => {
        if (typeof slot === 'object' && slot.start && slot.end) {
          alternatives.push(`${day} ${slot.start}-${slot.end}`);
        } else if (typeof slot === 'string') {
          alternatives.push(`${day} ${slot}`);
        }
      });
    }
  });
  
  return alternatives.slice(0, 5); // Return top 5 alternatives
};

export const checkSkillsMatch = (candidateSkillCategories: string[], candidateSpecificSkills: string[], interviewerSkills: string[], interviewerTechnologies: string[]) => {
  console.log('\n🎯 === SKILLS MATCHING DEBUG ===');
  console.log('👤 Candidate skill categories:', candidateSkillCategories);
  console.log('👤 Candidate specific skills:', candidateSpecificSkills);
  console.log('📋 Interviewer skill categories:', interviewerSkills);
  console.log('🔧 Interviewer technologies:', interviewerTechnologies);
  
  // Combine interviewer skills and technologies, ensuring we have arrays
  const skillsArray = Array.isArray(interviewerSkills) ? interviewerSkills : [];
  const technologiesArray = Array.isArray(interviewerTechnologies) ? interviewerTechnologies : [];
  const allInterviewerSkills = [...skillsArray, ...technologiesArray];
  
  console.log('🔍 All interviewer skills combined:', allInterviewerSkills);

  if (allInterviewerSkills.length === 0) {
    console.log('❌ No skills found for interviewer');
    return false;
  }

  // Combine candidate skills from categories and specific skills
  const candidateSkillsFromCategories = candidateSkillCategories.flatMap(category => 
    skillCategoryMapping[category] || [category]
  );
  const allCandidateSkills = [...candidateSkillCategories, ...candidateSkillsFromCategories, ...(candidateSpecificSkills || [])];
  
  console.log('🎯 All candidate skills to match:', allCandidateSkills);

  // Check for matches (case-insensitive and partial matches)
  let matchFound = false;
  const matches = [];

  for (const candidateSkill of allCandidateSkills) {
    for (const interviewerSkill of allInterviewerSkills) {
      const candidateSkillLower = candidateSkill.toLowerCase();
      const interviewerSkillLower = interviewerSkill.toLowerCase();
      
      // More flexible matching: exact match, contains match, or word match
      const isExactMatch = candidateSkillLower === interviewerSkillLower;
      const isPartialMatch = candidateSkillLower.includes(interviewerSkillLower) || interviewerSkillLower.includes(candidateSkillLower);
      const isWordMatch = candidateSkillLower.split(' ').some(word => 
        interviewerSkillLower.split(' ').some(interviewerWord => 
          word === interviewerWord && word.length > 2 // Avoid matching short words like "js"
        )
      );
      
      if (isExactMatch || isPartialMatch || isWordMatch) {
        matchFound = true;
        matches.push(`"${candidateSkill}" ↔ "${interviewerSkill}"`);
        console.log(`✅ SKILL MATCH: "${candidateSkill}" ↔ "${interviewerSkill}"`);
        break; // Move to next candidate skill
      }
    }
  }

  console.log(`📊 Total matches found: ${matches.length}`);
  console.log('🎯 Match details:', matches);
  console.log('✅ Final skills match result:', matchFound);
  console.log('=== END SKILLS MATCHING DEBUG ===\n');
  
  return matchFound;
};

export const parseExperience = (experienceStr: string): number => {
  if (!experienceStr) return 0;
  
  // Extract numbers from experience string
  const numbers = experienceStr.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    return parseInt(numbers[0]);
  }
  
  // Handle text-based experience
  if (experienceStr.toLowerCase().includes('0-1') || experienceStr.toLowerCase().includes('entry')) {
    return 1;
  }
  if (experienceStr.toLowerCase().includes('5+') || experienceStr.toLowerCase().includes('5 +')) {
    return 5;
  }
  
  return 2; // Default to 2 years
};

// Enhanced skills matching using candidate's specific skills
export const checkEnhancedSkillsMatch = (
  candidate: MatchingCandidate, 
  interviewerSkills: string[], 
  interviewerTechnologies: string[]
): { match: boolean; score: number; details: string[] } => {
  console.log('\n🎯 === ENHANCED SKILLS MATCHING DEBUG ===');
  console.log('👤 Candidate data:', {
    skillCategories: candidate.skillCategories,
    specificSkills: candidate.specificSkills
  });
  console.log('📋 Interviewer skill categories:', interviewerSkills);
  console.log('🔧 Interviewer technologies:', interviewerTechnologies);
  
  let totalScore = 0;
  const matchDetails: string[] = [];
  const skillsArray = Array.isArray(interviewerSkills) ? interviewerSkills : [];
  const technologiesArray = Array.isArray(interviewerTechnologies) ? interviewerTechnologies : [];
  const allInterviewerSkills = [...skillsArray, ...technologiesArray];

  // 1. Skill Categories Matching (30 points max)
  if (candidate.skillCategories && candidate.skillCategories.length > 0) {
    const categoryMatches = candidate.skillCategories.filter(category => 
      skillsArray.includes(category)
    );
    if (categoryMatches.length > 0) {
      const categoryScore = Math.min(30, categoryMatches.length * 10);
      totalScore += categoryScore;
      matchDetails.push(`${categoryMatches.length} skill categories match: ${categoryMatches.join(', ')}`);
    }
  }

  // 2. Specific Skills Matching (20 points max)
  if (candidate.specificSkills && candidate.specificSkills.length > 0) {
    const skillMatches = candidate.specificSkills.filter(skill => 
      allInterviewerSkills.some(interviewerSkill => 
        skill.toLowerCase() === interviewerSkill.toLowerCase() ||
        skill.toLowerCase().includes(interviewerSkill.toLowerCase()) ||
        interviewerSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    if (skillMatches.length > 0) {
      const skillScore = Math.min(20, skillMatches.length * 5);
      totalScore += skillScore;
      matchDetails.push(`${skillMatches.length} specific skills match: ${skillMatches.join(', ')}`);
    }
  }

  const finalMatch = totalScore >= 15; // Require at least 15 points for a match
  console.log(`📊 Enhanced skills matching result: ${totalScore}/50 points, Match: ${finalMatch}`);
  console.log('🎯 Match details:', matchDetails);
  console.log('=== END ENHANCED SKILLS MATCHING DEBUG ===\n');

  return {
    match: finalMatch,
    score: totalScore,
    details: matchDetails
  };
};

// Enhanced experience matching
export const checkEnhancedExperienceMatch = (
  candidate: MatchingCandidate, 
  interviewerExperience: number
): { match: boolean; score: number; details: string[] } => {
  console.log('\n💼 === ENHANCED EXPERIENCE MATCHING DEBUG ===');
  
  const candidateExp = candidate.experienceYears || parseExperience(candidate.experience);
  console.log(`👤 Candidate experience: ${candidateExp} years`);
  console.log(`👨‍💼 Interviewer experience: ${interviewerExperience} years`);
  
  let score = 0;
  const details: string[] = [];
  
  if (!interviewerExperience || interviewerExperience <= 0) {
    console.log('❌ No interviewer experience data');
    return { match: false, score: 0, details: ['No experience data available'] };
  }

  const expDifference = interviewerExperience - candidateExp;
  console.log(`📊 Experience difference: ${expDifference} years`);

  // Scoring based on experience gap
  if (expDifference >= 2 && expDifference <= 8) {
    // Ideal mentorship gap: 2-8 years
    score = 25;
    details.push(`Ideal mentorship gap: ${expDifference} years difference`);
  } else if (expDifference >= 1 && expDifference < 2) {
    // Good gap: 1-2 years
    score = 20;
    details.push(`Good experience gap: ${expDifference} years difference`);
  } else if (expDifference > 8) {
    // Large gap but still valuable
    score = 15;
    details.push(`Senior mentor: ${expDifference} years more experience`);
  } else if (expDifference >= 0) {
    // Peer level
    score = 10;
    details.push(`Peer level: similar experience levels`);
  } else {
    // Candidate has more experience
    score = 5;
    details.push(`Reverse mentorship opportunity`);
  }

  const match = score >= 10;
  console.log(`📊 Experience matching result: ${score}/25 points, Match: ${match}`);
  console.log('=== END ENHANCED EXPERIENCE MATCHING DEBUG ===\n');

  return { match, score, details };
};

