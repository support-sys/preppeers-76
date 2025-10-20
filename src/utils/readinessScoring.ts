// Interview Readiness Assessment Scoring Logic

import { ReadinessQuestion } from '@/config/readinessQuestions';

export interface AssessmentAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  category: string;
  weight: number;
}

export interface CategoryScore {
  earned: number;
  total: number;
  percentage: number;
}

export interface AssessmentResults {
  overallScore: number;
  categoryScores: {
    technical: number;
    behavioral: number;
    scenario: number;
  };
  correctAnswers: number;
  totalQuestions: number;
  strengths: string[];
  weaknesses: string[];
  readinessLevel: 'excellent' | 'good' | 'needs_improvement' | 'not_ready';
  detailedAnalysis: {
    technical: CategoryScore;
    behavioral: CategoryScore;
    scenario: CategoryScore;
  };
}

export interface ReadinessMessage {
  level: string;
  title: string;
  subtitle: string;
  message: string;
  cta: string;
  color: string;
}

/**
 * Calculate comprehensive assessment results
 */
export const calculateAssessmentResults = (
  questions: ReadinessQuestion[],
  userAnswers: number[]
): AssessmentResults => {
  // Build detailed answer records
  const answers: AssessmentAnswer[] = questions.map((q, index) => ({
    questionId: q.id,
    selectedAnswer: userAnswers[index],
    isCorrect: userAnswers[index] === q.correctAnswer,
    category: q.category,
    weight: q.weight
  }));

  // Calculate scores by category
  const categoryData = {
    technical: { earned: 0, total: 0 },
    behavioral: { earned: 0, total: 0 },
    scenario: { earned: 0, total: 0 }
  };

  answers.forEach((answer, index) => {
    const question = questions[index];
    const category = answer.category as keyof typeof categoryData;
    
    categoryData[category].total += question.weight;
    if (answer.isCorrect) {
      categoryData[category].earned += question.weight;
    }
  });

  // Calculate percentage scores
  const categoryScores = {
    technical: categoryData.technical.total > 0 
      ? Math.round((categoryData.technical.earned / categoryData.technical.total) * 100) 
      : 0,
    behavioral: categoryData.behavioral.total > 0 
      ? Math.round((categoryData.behavioral.earned / categoryData.behavioral.total) * 100) 
      : 0,
    scenario: categoryData.scenario.total > 0 
      ? Math.round((categoryData.scenario.earned / categoryData.scenario.total) * 100) 
      : 0
  };

  // Calculate overall weighted score
  const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
  const earnedWeight = answers.reduce((sum, a, i) => {
    return sum + (a.isCorrect ? questions[i].weight : 0);
  }, 0);

  const overallScore = Math.round((earnedWeight / totalWeight) * 100);
  
  // Count correct answers
  const correctAnswers = answers.filter(a => a.isCorrect).length;

  // Determine readiness level
  let readinessLevel: 'excellent' | 'good' | 'needs_improvement' | 'not_ready';
  if (overallScore >= 80) readinessLevel = 'excellent';
  else if (overallScore >= 65) readinessLevel = 'good';
  else if (overallScore >= 50) readinessLevel = 'needs_improvement';
  else readinessLevel = 'not_ready';

  // Analyze strengths and weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Technical analysis
  if (categoryScores.technical >= 75) {
    strengths.push('Strong technical knowledge and fundamentals');
  } else if (categoryScores.technical >= 60) {
    strengths.push('Good technical understanding with room for depth');
  } else if (categoryScores.technical < 50) {
    weaknesses.push('Need to strengthen technical fundamentals for your role');
  }

  // Behavioral analysis
  if (categoryScores.behavioral >= 75) {
    strengths.push('Excellent behavioral interview skills and STAR method');
  } else if (categoryScores.behavioral >= 60) {
    strengths.push('Good awareness of behavioral best practices');
  } else if (categoryScores.behavioral < 50) {
    weaknesses.push('Practice STAR method and behavioral question responses');
  }

  // Scenario analysis
  if (categoryScores.scenario >= 75) {
    strengths.push('Outstanding problem-solving and scenario handling');
  } else if (categoryScores.scenario >= 60) {
    strengths.push('Solid approach to handling complex situations');
  } else if (categoryScores.scenario < 50) {
    weaknesses.push('Work on structured problem-solving and communication under pressure');
  }

  // Generic analysis if no specific strengths identified
  if (strengths.length === 0) {
    if (overallScore >= 40) {
      strengths.push('Basic understanding of interview concepts');
    }
  }

  // Generic weaknesses if none identified
  if (weaknesses.length === 0 && overallScore < 80) {
    weaknesses.push('Focus on consistent performance across all question types');
  }

  // Ensure we have at least 2-3 items in each
  if (strengths.length === 0) {
    strengths.push('You showed up and completed the assessment - that\'s a start!');
  }
  
  if (weaknesses.length === 0 && readinessLevel !== 'excellent') {
    weaknesses.push('Practice more to achieve consistent excellence');
  }

  return {
    overallScore,
    categoryScores,
    correctAnswers,
    totalQuestions: questions.length,
    strengths,
    weaknesses,
    readinessLevel,
    detailedAnalysis: {
      technical: {
        earned: categoryData.technical.earned,
        total: categoryData.technical.total,
        percentage: categoryScores.technical
      },
      behavioral: {
        earned: categoryData.behavioral.earned,
        total: categoryData.behavioral.total,
        percentage: categoryScores.behavioral
      },
      scenario: {
        earned: categoryData.scenario.earned,
        total: categoryData.scenario.total,
        percentage: categoryScores.scenario
      }
    }
  };
};

/**
 * Get readiness level message and CTA
 */
export const getReadinessMessage = (score: number, readinessLevel: string): ReadinessMessage => {
  const messages: Record<string, ReadinessMessage> = {
    excellent: {
      level: 'excellent',
      title: '🎉 Excellent! You\'re Interview-Ready!',
      subtitle: 'You scored in the top tier!',
      message: 'You have a strong foundation across technical and behavioral areas. A mock interview with a real expert will help you perfect your delivery, build confidence, and ensure you land that offer.',
      cta: 'Polish Your Skills with Expert Feedback',
      color: 'green'
    },
    good: {
      level: 'good',
      title: '👍 Good Foundation!',
      subtitle: 'You\'re on the right track',
      message: 'You understand the fundamentals, but there are knowledge gaps that could cost you in real interviews. Practice with a professional interviewer to reach 90%+ readiness and avoid costly rejections.',
      cta: 'Level Up with Mock Interview',
      color: 'blue'
    },
    needs_improvement: {
      level: 'needs_improvement',
      title: '📚 Needs Improvement',
      subtitle: 'Don\'t go unprepared!',
      message: 'Your current readiness level puts you at risk of interview rejections. Don\'t let weak areas cost you your dream job. Practice with an expert to build confidence and master the skills that matter.',
      cta: 'Get Interview-Ready with Expert Help',
      color: 'yellow'
    },
    not_ready: {
      level: 'not_ready',
      title: '⚠️ Not Ready Yet',
      subtitle: 'Build your foundation first',
      message: 'Going to interviews now will likely result in rejections that could have been avoided. Invest in proper preparation with expert guidance to build strong fundamentals and interview confidence.',
      cta: 'Start Your Interview Preparation Now',
      color: 'red'
    }
  };

  return messages[readinessLevel] || messages.good;
};

/**
 * Get discount message based on readiness level
 * Note: We show existing coupons instead of generating new ones
 */
export const getDiscountMessage = (readinessLevel: string): string => {
  const messages = {
    excellent: 'Special Offer',
    good: 'Special Offer',
    needs_improvement: 'Special Offer',
    not_ready: 'Special Offer'
  };

  return messages[readinessLevel as keyof typeof messages] || 'Special Offer';
};

