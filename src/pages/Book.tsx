import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppChat from "@/components/WhatsAppChat";
import CandidateRegistrationForm from "@/components/CandidateRegistrationForm";
import { useToast } from "@/hooks/use-toast";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Book = () => {
  const [currentStep, setCurrentStep] = useState<'form' | 'matching' | 'success' | 'no-match'>('form');
  const [formData, setFormData] = useState<any>(null);
  const [matchedInterviewer, setMatchedInterviewer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { syncCandidateToGoogleSheets } = useGoogleSheets();
  const { user } = useAuth();

  // Skill mapping for better matching
  const skillMapping: { [key: string]: string[] } = {
    "Frontend Developer": ["React", "JavaScript", "Vue", "Angular", "HTML", "CSS", "TypeScript", "Frontend", "Frontend Developer"],
    "Backend Developer": ["Node.js", "Python", "Java", "PHP", "Go", "Ruby", "Backend", "Backend Developer", "API"],
    "Full Stack Developer": ["React", "Node.js", "JavaScript", "Python", "Full Stack", "Full Stack Developer"],
    "Data Scientist": ["Python", "R", "Machine Learning", "Data Science", "Statistics", "Data Scientist"],
    "Data Engineer": ["Python", "SQL", "Apache Spark", "Data Engineering", "ETL", "Data Engineer"],
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "DevOps", "DevOps Engineer"],
    "Mobile Developer": ["React Native", "Flutter", "iOS", "Android", "Mobile", "Mobile Developer"],
    "Machine Learning Engineer": ["Python", "TensorFlow", "PyTorch", "Machine Learning", "ML Engineer"],
    "Product Manager": ["Product Management", "Agile", "Scrum", "Product Manager"],
    "QA Engineer": ["Testing", "Automation", "QA", "Quality Assurance", "QA Engineer"]
  };

  const parseTimeSlot = (timeSlot: string) => {
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

  const checkTimeSlotMatch = (candidateTimeSlot: string, interviewerTimeSlots: any) => {
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

  const checkSkillsMatch = (candidateRole: string, interviewerSkills: string[], interviewerTechnologies: string[]) => {
    console.log('Checking skills match:', { candidateRole, interviewerSkills, interviewerTechnologies });
    
    const relevantSkills = skillMapping[candidateRole] || [candidateRole];
    console.log('Relevant skills for matching:', relevantSkills);

    // Combine interviewer skills and technologies
    const allInterviewerSkills = [...(interviewerSkills || []), ...(interviewerTechnologies || [])];
    console.log('Interviewer all skills:', allInterviewerSkills);

    // Check for exact matches first
    const exactMatch = relevantSkills.some(skill => 
      allInterviewerSkills.some(interviewerSkill => 
        interviewerSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(interviewerSkill.toLowerCase())
      )
    );

    console.log('Skills match result:', exactMatch);
    return exactMatch;
  };

  const parseExperience = (experienceStr: string): number => {
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

  const findMatchingInterviewer = async (candidateData: any) => {
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

        // 1. Skills matching (40 points)
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
        const timeMatch = checkTimeSlotMatch(candidateData.timeSlot, interviewer.current_time_slots);
        if (timeMatch) {
          score += 30;
          reasons.push('Time available');
        }

        console.log(`Interviewer score: ${score}, reasons: ${reasons.join(', ')}`);
        
        return {
          ...interviewer,
          matchScore: score,
          matchReasons: reasons
        };
      });

      // Sort by score descending
      scoredInterviewers.sort((a, b) => b.matchScore - a.matchScore);
      
      console.log('Top 3 scored interviewers:');
      scoredInterviewers.slice(0, 3).forEach((interviewer, index) => {
        console.log(`${index + 1}. ${interviewer.company || 'Unknown'} - Score: ${interviewer.matchScore}, Reasons: ${interviewer.matchReasons.join(', ')}`);
      });

      // Return best match if score is reasonable (at least skills match)
      const bestMatch = scoredInterviewers[0];
      if (bestMatch && bestMatch.matchScore >= 40) {
        console.log('Best match found:', bestMatch.company || 'Unknown', 'Score:', bestMatch.matchScore);
        return bestMatch;
      }

      // Fallback: return any interviewer with some availability
      const fallbackMatch = scoredInterviewers.find(interviewer => 
        interviewer.current_time_slots && 
        Object.keys(interviewer.current_time_slots).length > 0
      );

      if (fallbackMatch) {
        console.log('Fallback match found:', fallbackMatch.company || 'Unknown');
        return fallbackMatch;
      }

      console.log('No suitable interviewer found');
      return null;
    } catch (error) {
      console.error('Error in findMatchingInterviewer:', error);
      return null;
    }
  };

  const scheduleInterview = async (interviewer: any, candidate: any) => {
    try {
      // Create interview record
      const interviewData = {
        interviewer_id: interviewer.id,
        candidate_id: user?.id,
        candidate_name: user?.user_metadata?.full_name || user?.email,
        candidate_email: user?.email,
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

  const handleFormSubmit = async (data: any) => {
    setFormData(data);
    setCurrentStep('matching');
    setIsLoading(true);

    try {
      console.log('Starting matching process with data:', data);
      
      // Find matching interviewer
      const interviewer = await findMatchingInterviewer(data);
      
      if (interviewer) {
        console.log('Interviewer found, scheduling interview...');
        setMatchedInterviewer(interviewer);
        
        // Schedule the interview and send emails
        await scheduleInterview(interviewer, data);
        
        // Sync to Google Sheets
        const candidateData = {
          name: user?.user_metadata?.full_name || user?.email || "Unknown",
          email: user?.email || "Unknown",
          experience: data.experience,
          noticePeriod: data.noticePeriod,
          targetRole: data.targetRole,
          timeSlot: data.timeSlot || "To be confirmed",
          resumeUploaded: data.resume ? "Yes" : "No",
          resumeFileName: data.resume?.name || "Not provided",
          matchedInterviewer: interviewer.company || "Unknown Company",
          submissionDate: new Date().toISOString()
        };

        await syncCandidateToGoogleSheets(candidateData);
        
        setCurrentStep('success');
        toast({
          title: "Interview Scheduled!",
          description: "You'll receive a Google Meet link shortly.",
        });
      } else {
        console.log('No interviewer found, showing no-match state');
        setCurrentStep('no-match');
        toast({
          title: "No Interviewer Available",
          description: "We're finding the best interviewer for you. You'll be notified soon!",
        });
      }
    } catch (error) {
      console.error("Error processing booking:", error);
      toast({
        title: "Processing Error",
        description: "There was an issue processing your request. Please try again.",
        variant: "destructive",
      });
      setCurrentStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-white mb-4">Interview Scheduled!</h1>
              <p className="text-xl text-slate-300 mb-8">
                Your interview has been scheduled with {matchedInterviewer?.company || 'an expert interviewer'}. 
                You'll receive a Google Meet link at {user?.email} shortly.
              </p>
              <div className="space-y-4 text-left bg-white/5 rounded-xl p-6 mb-8">
                <div className="flex justify-between">
                  <span className="text-slate-400">Experience:</span>
                  <span className="text-white">{formData?.experience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Role:</span>
                  <span className="text-white">{formData?.targetRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Interviewer:</span>
                  <span className="text-white">{matchedInterviewer?.company || 'Expert'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time Slot:</span>
                  <span className="text-white">{formData?.timeSlot || "To be confirmed"}</span>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <Link to="/">
                  <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                    Back to Home
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <WhatsAppChat />
        <Footer />
      </div>
    );
  }

  if (currentStep === 'no-match') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
              <Clock className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-white mb-4">Finding Your Interviewer</h1>
              <p className="text-xl text-slate-300 mb-8">
                We're currently finding the best interviewer for your {formData?.targetRole} role. 
                You'll receive an email with the interview details shortly.
              </p>
              <div className="space-y-4 text-left bg-white/5 rounded-xl p-6 mb-8">
                <div className="flex justify-between">
                  <span className="text-slate-400">Experience:</span>
                  <span className="text-white">{formData?.experience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Role:</span>
                  <span className="text-white">{formData?.targetRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-yellow-400">Finding interviewer...</span>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <Link to="/">
                  <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                    Back to Home
                  </Button>
                </Link>
                <Button 
                  onClick={() => {
                    setCurrentStep('form');
                    setFormData(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
        <WhatsAppChat />
        <Footer />
      </div>
    );
  }

  if (currentStep === 'matching') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
              <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-400 mx-auto mb-6"></div>
              <h1 className="text-4xl font-bold text-white mb-4">Matching You With An Interviewer</h1>
              <p className="text-xl text-slate-300">
                We're finding the perfect interviewer based on your skills and experience...
              </p>
            </div>
          </div>
        </div>
        <WhatsAppChat />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Book Your Mock Interview
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Fill out the form below and we'll match you with an experienced interviewer instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <CandidateRegistrationForm
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Process Overview */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">What Happens Next?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Fill Details</h4>
                      <p className="text-slate-300 text-sm">Provide your professional information</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Instant Matching</h4>
                      <p className="text-slate-300 text-sm">We find the perfect interviewer for you</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Get GMeet Link</h4>
                      <p className="text-slate-300 text-sm">Receive link and interviewer details</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Join Interview</h4>
                      <p className="text-slate-300 text-sm">60-minute live session</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/faq" className="block">
                    <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10">
                      View FAQ
                    </Button>
                  </Link>
                  <Link to="/contact" className="block">
                    <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10">
                      Contact Support
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <WhatsAppChat />
      <Footer />
    </div>
  );
};

export default Book;
