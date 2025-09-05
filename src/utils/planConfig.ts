export interface InterviewPlan {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  features: string[];
  limitations: string[];
  isPopular?: boolean;
  isRecommended?: boolean;
  description: string;
  shortDescription: string;
}

export const INTERVIEW_PLANS: { [key: string]: InterviewPlan } = {
  essential: {
    id: 'essential',
    name: "Essential",
    price: 499,
    duration: 30,
    description: "Perfect for quick interview practice and basic feedback",
    shortDescription: "Quick practice session with basic feedback",
    features: [
      "30-minute focused mock interview session",
      "Basic verbal feedback during the interview"
    ],
    limitations: [
      "No detailed written feedback report",
      "No comprehensive action plan",
      "Limited post-interview support",
      "No resume review included"
    ]
  },
  professional: {
    id: 'professional',
    name: "Professional",
    price: 999,
    duration: 60,
    description: "Comprehensive interview preparation with detailed feedback",
    shortDescription: "Complete interview prep with detailed feedback",
    isPopular: true,
    isRecommended: true,
    features: [
      "60-minute comprehensive mock interview",
      "Comprehensive feedback report (PDF) - technical skills, communication, behavior & presentation analysis",
      "Personalized action plan for improvement",
      "Interview performance analysis",
      "Follow-up support and guidance",
      "Interview recording (optional)",
      "Most popular choice for serious candidates",
      "Priority customer support"
    ],
    limitations: [
      "No resume review included",
      "No career coaching session"
    ]
  },
  executive: {
    id: 'executive',
    name: "Executive",
    price: 1299,
    duration: 60,
    description: "Premium career development package with complete support",
    shortDescription: "Premium package with resume review & career coaching",
    features: [
      "60-minute comprehensive mock interview",
      "Professional Resume Feedback (not during mock interview)",
      "Comprehensive feedback report (PDF) - technical skills, communication, behavior & presentation analysis",
      "Personalized action plan for improvement",
      "Interview performance analysis",
      "Follow-up support and guidance",
      "Interview recording (optional)",
      "Priority customer support"
    ],
    limitations: [
      "Premium pricing for comprehensive service"
    ]
  }
};

export const getPlanById = (planId: string): InterviewPlan | null => {
  return INTERVIEW_PLANS[planId] || null;
};

export const getDefaultPlan = (): InterviewPlan => {
  return INTERVIEW_PLANS.essential;
};

export const getPlanFeatures = (planId: string): string[] => {
  const plan = getPlanById(planId);
  return plan?.features || [];
};

export const getPlanLimitations = (planId: string): string[] => {
  const plan = getPlanById(planId);
  return plan?.limitations || [];
};

export const getPlanPrice = (planId: string): number => {
  const plan = getPlanById(planId);
  return plan?.price || 999;
};

export const getPlanDuration = (planId: string): number => {
  const plan = getPlanById(planId);
  return plan?.duration || 60;
};
