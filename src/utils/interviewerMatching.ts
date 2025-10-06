
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
  selectedPlan?: string; // Add selected plan for duration calculation
}

export interface MatchedInterviewer {
  id: string;
  company?: string;
  position?: string;
  bio?: string;
  linkedin_url?: string;
  github_url?: string;
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
  "Frontend Developer": [
    "HTML", "CSS", "JavaScript", "TypeScript",
    "React", "Vue.js", "Angular", "Svelte", "Next.js",
    "State Management (Redux, Vuex, Pinia)",
    "Responsive Design", "API Integration", "Jest", "Cypress"
  ],
  "Java Backend Developer": [
    "Java", "Spring Boot", "Hibernate/JPA",
    "REST APIs", "Microservices", "SQL", "NoSQL",
    "Kafka", "RabbitMQ", "Redis", "Docker", "Kubernetes",
    "CI/CD (Jenkins, GitHub Actions)", "JUnit", "Mockito"
  ],
  "Python Backend Developer": [
    "Python", "Django", "Flask", "FastAPI",
    "REST APIs", "SQLAlchemy", "PostgreSQL", "MySQL",
    "Celery", "Redis", "Microservices", "Docker",
    "Kubernetes", "CI/CD", "Pytest"
  ],
  ".NET Backend Developer": [
    "C#", ".NET Core", "ASP.NET", "Entity Framework",
    "SQL Server", "REST APIs", "Microservices",
    "Docker", "Kubernetes", "CI/CD", "Redis", "xUnit"
  ],
  "Full Stack Developer": [
    "Angular", "React", "Node.js", "Express.js", "Java", "Spring Boot", "MongoDB",
    "JavaScript", "TypeScript", "REST APIs", "GraphQL", "Microservices",
    "JWT/Auth", "State Management", "Docker", "CI/CD"
  ],
  "Mobile Developer (Android)": [
    "Java", "Kotlin", "Android SDK", "Jetpack Compose",
    "XML Layouts", "SQLite", "Room", "REST APIs", "Firebase",
    "Unit Testing (JUnit, Espresso)"
  ],
  "Mobile Developer (iOS)": [
    "Swift", "SwiftUI", "Objective-C",
    "iOS SDK", "CoreData", "SQLite",
    "REST APIs", "Firebase", "Unit Testing (XCTest)"
  ],
  "Mobile Developer (Cross-Platform)": [
    "React Native", "Flutter", "Dart",
    "JavaScript", "TypeScript", "REST APIs",
    "Firebase", "SQLite", "CI/CD"
  ],
  "DevOps Engineer": [
    "Linux", "Shell Scripting", "CI/CD Pipelines",
    "Docker", "Kubernetes", "Terraform", "Ansible",
    "AWS", "GCP", "Azure", "Monitoring (Prometheus, Grafana)",
    "Logging (ELK Stack)", "Git", "Networking Basics"
  ]
};

// Skill match quality thresholds - UPDATED for domain-first matching
export const SKILL_MATCH_THRESHOLDS = {
  EXCELLENT: 50, // Same domain + strong tech overlap
  GOOD: 35,      // Same domain + moderate tech overlap
  POOR: 25,      // Same domain + minimal tech overlap
  CROSS_DOMAIN: 40, // Different domains - require high threshold
  NONE: 0        // No overlap - block matching
};

// Domain-first matching thresholds - EXACT DOMAIN ONLY
export const MINIMUM_SKILL_THRESHOLD = 30; // Minimum for exact domain matches only

// NO DOMAIN COMPATIBILITY - Only exact matches allowed
// This means:
// - .NET Backend Developer can ONLY match with .NET Backend Developer
// - Full Stack Developer can ONLY match with Full Stack Developer  
// - Mobile Developer (Cross-Platform) can ONLY match with Mobile Developer (Cross-Platform)
// etc.

// Generic technologies that should have lower weight in cross-domain matching
export const GENERIC_TECHNOLOGIES = [
  "REST APIs", "CI/CD", "Docker", "Kubernetes", "Git", "Linux", "Shell Scripting",
  "Microservices", "SQL", "NoSQL", "Redis", "Monitoring", "Logging", "Testing",
  "Unit Testing", "Integration Testing", "API Integration", "Responsive Design"
];

// Domain-specific technologies that should have higher weight
export const DOMAIN_SPECIFIC_TECHNOLOGIES = {
  "Frontend Developer": ["React", "Vue.js", "Angular", "Svelte", "Next.js", "HTML", "CSS", "JavaScript", "TypeScript"],
  "Java Backend Developer": ["Java", "Spring Boot", "Hibernate", "JPA", "Kafka", "RabbitMQ"],
  "Python Backend Developer": ["Python", "Django", "Flask", "FastAPI", "SQLAlchemy", "Celery"],
  ".NET Backend Developer": ["C#", ".NET Core", "ASP.NET", "Entity Framework", "SQL Server", "xUnit"],
  "Mobile Developer (Android)": ["Java", "Kotlin", "Android SDK", "Jetpack Compose", "XML Layouts"],
  "Mobile Developer (iOS)": ["Swift", "SwiftUI", "Objective-C", "iOS SDK", "CoreData"],
  "Mobile Developer (Cross-Platform)": ["React Native", "Flutter", "Dart"],
  "DevOps Engineer": ["Terraform", "Ansible", "AWS", "GCP", "Azure", "Prometheus", "Grafana"],
  "Full Stack Developer": ["React", "Angular", "Node.js", "Express.js", "MongoDB"]
};

// Enhanced experience requirements
export const EXPERIENCE_REQUIREMENTS = {
  MINIMUM_MENTOR_GAP: 1,  // Minimum 1 year gap for mentorship
  IDEAL_MENTOR_GAP: 3,    // Ideal 2-5 years gap
  MAXIMUM_MENTOR_GAP: 5  // Maximum useful gap
};

/*
"Mobile Development": ["React Native", "Flutter", "iOS", "Android", "Swift", "Kotlin", "Ionic", "Xamarin"],
  "DevOps & Cloud": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible"],
  "Data Science & AI": ["Python", "R", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "SQL"],
*/

export const parseTimeSlot = (timeSlot: string) => {
  if (!timeSlot) return null;
  
  try {
    // Parse the ISO string and work with local time to get correct day
    const date = new Date(timeSlot);
    
    // Get the actual local date components to determine correct day of week
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hour = date.getHours();
    const minutes = date.getMinutes();
    
    // Get day of week from the actual parsed date
    const dayOfWeek = date.toLocaleDateString('en-US', { 
      weekday: 'long'
    });
    
    console.log('🕐 Parsed candidate time slot:', { 
      dayOfWeek, 
      hour, 
      minutes, 
      timeString: `${hour}:${minutes.toString().padStart(2, '0')}`,
      originalTimeSlot: timeSlot,
      parsedDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      fullDateDebug: date.toString()
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

  // Parse the JSON string if it's a string
  let parsedTimeSlots = interviewerTimeSlots;
  if (typeof interviewerTimeSlots === 'string') {
    try {
      parsedTimeSlots = JSON.parse(interviewerTimeSlots);
      console.log('🔍 Parsed time slots from JSON string:', parsedTimeSlots);
    } catch (error) {
      console.error('❌ Error parsing time slots JSON:', error);
      return false;
    }
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
  const daySlots = parsedTimeSlots[dayOfWeek];
  if (!daySlots || !Array.isArray(daySlots)) {
    console.log(`❌ No slots found for ${dayOfWeek}`);
    console.log(`Available days: ${Object.keys(parsedTimeSlots).join(', ')}`);
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

// Domain-first skills matching with strict domain compatibility
export const checkEnhancedSkillsMatch = (
  candidate: MatchingCandidate, 
  interviewerSkills: string[], 
  interviewerTechnologies: string[]
): { match: boolean; score: number; details: string[]; quality: string } => {
  console.log('\n🎯 === DOMAIN-FIRST SKILLS MATCHING DEBUG ===');
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

  // STEP 1: EXACT DOMAIN CHECK ONLY (Critical - only exact domain matches allowed)
  let isExactDomain = false;
  let candidateDomain = '';
  let interviewerDomain = '';
  
  if (candidate.skillCategories && candidate.skillCategories.length > 0 && skillsArray.length > 0) {
    candidateDomain = candidate.skillCategories[0]; // Use primary category
    interviewerDomain = skillsArray[0]; // Use primary category
    
    // Check for EXACT domain match ONLY
    if (candidateDomain === interviewerDomain) {
      isExactDomain = true;
      matchDetails.push(`🎯 EXACT DOMAIN MATCH: ${candidateDomain}`);
      console.log(`✅ EXACT DOMAIN MATCH: ${candidateDomain}`);
    } else {
      // DIFFERENT DOMAINS - Give 0 points and move to next interviewer
      console.log(`❌ DIFFERENT DOMAINS: ${candidateDomain} ↔ ${interviewerDomain} - 0 POINTS (move to next interviewer)`);
      matchDetails.push(`❌ DIFFERENT DOMAINS: ${candidateDomain} ↔ ${interviewerDomain}`);
      return {
        match: false,
        score: 0,
        details: matchDetails,
        quality: 'none'
      };
    }
  }

  // STEP 2: EXACT DOMAIN SCORING (40 points max) - Only exact domains get points
  let domainScore = 0;
  if (isExactDomain) {
    // Exact domain match gets maximum domain score
    domainScore = 40;
    matchDetails.push(`🎯 Exact domain match: +40 points`);
    console.log(`🎯 Exact domain match: +40 points`);
  }
  totalScore += domainScore;

  // STEP 3: TECHNOLOGY MATCHING (20 points max) - Only for exact domain matches
  let techScore = 0;
  if (candidate.specificSkills && candidate.specificSkills.length > 0) {
    const domainSpecificMatches = [];
    const genericMatches = [];
    
    for (const skill of candidate.specificSkills) {
      const exactMatch = allInterviewerSkills.find(iSkill => 
        skill.toLowerCase() === iSkill.toLowerCase()
      );
      
      if (exactMatch) {
        // Check if it's a domain-specific technology
        const candidateDomainSpecific = DOMAIN_SPECIFIC_TECHNOLOGIES[candidateDomain] || [];
        const isDomainSpecific = candidateDomainSpecific.some(tech => 
          tech.toLowerCase() === skill.toLowerCase()
        );
        const isGeneric = GENERIC_TECHNOLOGIES.some(tech => 
          tech.toLowerCase() === skill.toLowerCase()
        );
        
        if (isDomainSpecific) {
          // Domain-specific technology gets high points
          techScore += 8;
          domainSpecificMatches.push(skill);
          console.log(`✅ Domain-specific match: ${skill} (+8 points)`);
        } else if (isGeneric) {
          // Generic technology gets low points
          techScore += 2;
          genericMatches.push(skill);
          console.log(`🔧 Generic match: ${skill} (+2 points)`);
        } else {
          // Other technology gets medium points
          techScore += 5;
          console.log(`🔍 Other match: ${skill} (+5 points)`);
        }
      }
    }
    
    techScore = Math.min(20, techScore);
    if (domainSpecificMatches.length > 0) {
      matchDetails.push(`✅ Domain-specific tech matches: ${domainSpecificMatches.join(', ')}`);
    }
    if (genericMatches.length > 0) {
      matchDetails.push(`🔧 Generic tech matches: ${genericMatches.join(', ')}`);
    }
    totalScore += techScore;
  }

  // STEP 4: DETERMINE FINAL MATCH QUALITY (Only exact domains can match)
  let quality = 'none';
  let finalMatch = false;
  
  if (isExactDomain) {
    // Only exact domain matches can proceed
    if (totalScore >= SKILL_MATCH_THRESHOLDS.EXCELLENT) {
      quality = 'excellent';
      finalMatch = true;
    } else if (totalScore >= SKILL_MATCH_THRESHOLDS.GOOD) {
      quality = 'good';
      finalMatch = true;
    } else if (totalScore >= SKILL_MATCH_THRESHOLDS.POOR) {
      quality = 'poor';
      finalMatch = true;
    } else {
      quality = 'none';
      finalMatch = false;
    }
  } else {
    // Different domains always get 0 points
    quality = 'none';
    finalMatch = false;
  }

  console.log(`📊 Exact-domain matching result: ${totalScore}/60 points, Quality: ${quality}, Match: ${finalMatch}`);
  console.log(`🎯 Domain: ${isExactDomain ? 'EXACT MATCH' : 'DIFFERENT (0 points)'}`);
  console.log(`📋 Required threshold: ${MINIMUM_SKILL_THRESHOLD}, Achieved: ${totalScore}`);
  console.log('🎯 Match details:', matchDetails);
  console.log('=== END DOMAIN-FIRST SKILLS MATCHING DEBUG ===\n');

  return {
    match: finalMatch,
    score: totalScore,
    details: matchDetails,
    quality
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

  // Intelligent scoring based on candidate vs interviewer experience levels
  if (expDifference > 0) {
    // Junior candidate interviewing with senior interviewer (mentorship scenario)
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
    }
  } else if (expDifference === 0) {
    // Peer level: same experience
    score = 25;
    details.push(`Peer level: same experience level - optimal for mutual learning`);
  } else if (expDifference < 0) {
    // Senior candidate interviewing with junior interviewer (peer collaboration scenario)
    const absExpDifference = Math.abs(expDifference);
    if (absExpDifference === 1) {
      // Minimal gap: excellent for peer collaboration
      score = 25;
      details.push(`Excellent peer collaboration: minimal 1 year difference (senior candidate)`);
    } else if (absExpDifference === 2) {
      // Small gap: good for peer collaboration
      score = 20;
      details.push(`Good peer collaboration: small 2 year difference (senior candidate)`);
    } else if (absExpDifference === 3) {
      // Medium gap: acceptable for peer collaboration
      score = 15;
      details.push(`Acceptable peer collaboration: medium 3 year difference (senior candidate)`);
    } else if (absExpDifference >= 4) {
      // Large gap: not ideal for senior candidates
      score = 10;
      details.push(`Limited peer collaboration: large ${absExpDifference} year difference (senior candidate)`);
    }
  }

  const match = score >= 10;
  console.log(`📊 Experience matching result: ${score}/25 points, Match: ${match}`);
  console.log('=== END ENHANCED EXPERIENCE MATCHING DEBUG ===\n');

  return { match, score, details };
};

