export interface MatchingCandidate {
  targetRole: string;
  experience: string;
  timeSlot?: string;
  resume?: File;
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

// Enhanced skill mapping for better matching
export const skillMapping: { [key: string]: string[] } = {
  "Frontend Developer": ["Frontend Development", "React", "JavaScript", "Vue", "Angular", "HTML", "CSS", "TypeScript", "Frontend", "Frontend Developer", "Next.js", "React.js", "Vue.js"],
  "Backend Developer": ["Backend Development", "Node.js", "Python", "Java", "PHP", "Go", "Ruby", "Backend", "Backend Developer", "API", "Express.js", "Django", "Spring"],
  "Full Stack Developer": ["Full Stack Development", "React", "Node.js", "JavaScript", "Python", "Full Stack", "Full Stack Developer", "MERN Stack", "MEAN Stack"],
  "Data Scientist": ["Data Science & AI", "Python", "R", "Machine Learning", "Data Science", "Statistics", "Data Scientist"],
  "Data Engineer": ["Data Science & AI", "Python", "SQL", "Apache Spark", "Data Engineering", "ETL", "Data Engineer"],
  "DevOps Engineer": ["DevOps & Cloud", "Docker", "Kubernetes", "AWS", "CI/CD", "DevOps", "DevOps Engineer"],
  "Mobile Developer": ["Mobile Development", "React Native", "Flutter", "iOS", "Android", "Mobile", "Mobile Developer"],
  "Machine Learning Engineer": ["Data Science & AI", "Python", "TensorFlow", "PyTorch", "Machine Learning", "ML Engineer"],
  "Product Manager": ["Product Management", "Agile", "Scrum", "Product Manager"],
  "QA Engineer": ["Testing", "Automation", "QA", "Quality Assurance", "QA Engineer"]
};

export const parseTimeSlot = (timeSlot: string) => {
  if (!timeSlot) return null;
  
  try {
    const date = new Date(timeSlot);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const hour = date.getHours();
    
    console.log('Parsed candidate time slot:', { dayOfWeek, hour, originalTimeSlot: timeSlot });
    return { dayOfWeek, hour, date };
  } catch (error) {
    console.error('Error parsing time slot:', error);
    return null;
  }
};

export const checkTimeSlotMatch = (candidateTimeSlot: string, interviewerTimeSlots: any) => {
  console.log('Checking time slot match:', { candidateTimeSlot, interviewerTimeSlots });
  
  if (!candidateTimeSlot || !interviewerTimeSlots) {
    console.log('Missing time slot data');
    return false;
  }

  const parsedCandidateTime = parseTimeSlot(candidateTimeSlot);
  if (!parsedCandidateTime) {
    console.log('Could not parse candidate time slot');
    return false;
  }

  const { dayOfWeek, hour } = parsedCandidateTime;

  // Check if interviewer has slots for this day
  const daySlots = interviewerTimeSlots[dayOfWeek];
  if (!daySlots || !Array.isArray(daySlots)) {
    console.log(`No slots found for ${dayOfWeek}`);
    return false;
  }

  // Check if any slot matches the candidate's preferred hour
  const hasMatchingSlot = daySlots.some((slot: string) => {
    const slotHour = parseInt(slot.split(':')[0]);
    const isMatch = Math.abs(slotHour - hour) <= 1; // Allow 1 hour flexibility
    console.log(`Checking slot ${slot} (hour ${slotHour}) against candidate hour ${hour}: ${isMatch}`);
    return isMatch;
  });

  console.log(`Time slot match result: ${hasMatchingSlot}`);
  return hasMatchingSlot;
};

export const getAlternativeTimeSlots = (interviewerTimeSlots: any): string[] => {
  if (!interviewerTimeSlots) return [];
  
  const alternatives: string[] = [];
  
  Object.entries(interviewerTimeSlots).forEach(([day, slots]) => {
    if (Array.isArray(slots)) {
      slots.forEach((slot: string) => {
        alternatives.push(`${day} ${slot}`);
      });
    }
  });
  
  return alternatives.slice(0, 3); // Return top 3 alternatives
};

export const checkSkillsMatch = (candidateRole: string, interviewerSkills: string[], interviewerTechnologies: string[]) => {
  console.log('=== SKILLS MATCHING DEBUG ===');
  console.log('Candidate role:', candidateRole);
  console.log('Interviewer skills field (categories):', interviewerSkills);
  console.log('Interviewer technologies field (individual skills):', interviewerTechnologies);
  
  const relevantSkills = skillMapping[candidateRole] || [candidateRole];
  console.log('Relevant skills for matching:', relevantSkills);

  // Combine interviewer skills and technologies, ensuring we have arrays
  const skillsArray = Array.isArray(interviewerSkills) ? interviewerSkills : [];
  const technologiesArray = Array.isArray(interviewerTechnologies) ? interviewerTechnologies : [];
  const allInterviewerSkills = [...skillsArray, ...technologiesArray];
  
  console.log('All interviewer skills combined:', allInterviewerSkills);

  if (allInterviewerSkills.length === 0) {
    console.log('❌ No skills found for interviewer');
    return false;
  }

  // Check for matches (case-insensitive and partial matches)
  const hasMatch = relevantSkills.some(skill => 
    allInterviewerSkills.some(interviewerSkill => {
      const skillLower = skill.toLowerCase();
      const interviewerSkillLower = interviewerSkill.toLowerCase();
      
      // Exact match or contains match
      const isMatch = skillLower === interviewerSkillLower || 
                     skillLower.includes(interviewerSkillLower) || 
                     interviewerSkillLower.includes(skillLower);
      
      if (isMatch) {
        console.log(`✅ Skill match found: "${skill}" <-> "${interviewerSkill}"`);
      }
      
      return isMatch;
    })
  );

  console.log('Final skills match result:', hasMatch);
  console.log('=== END SKILLS MATCHING DEBUG ===');
  return hasMatch;
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
