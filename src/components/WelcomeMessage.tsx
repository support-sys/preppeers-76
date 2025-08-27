import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const WelcomeMessage = () => {
  const { user, userRole, justLoggedIn, profileComplete, hasScheduledInterview } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (justLoggedIn && user && userRole) {
      const userName = user.user_metadata?.full_name || user.email;
      
      let description = '';
      let nextStep = '';

      if (userRole === 'interviewee') {
        if (!profileComplete) {
          description = "Welcome back! Let's complete your profile to get started.";
          nextStep = "Complete your profile to book your first interview.";
        } else if (hasScheduledInterview) {
          description = "Welcome back! You have scheduled interviews.";
          nextStep = "Check your dashboard to view your upcoming interviews.";
        } else {
          description = "Welcome back! Ready for your next interview?";
          nextStep = "Complete your profile to book your next interview.";
        }
      } else if (userRole === 'interviewer') {
        if (!profileComplete) {
          description = "Welcome back! Let's complete your interviewer profile.";
          nextStep = "Complete your profile to start conducting interviews.";
        } else {
          description = "Welcome back! Ready to help candidates succeed?";
          nextStep = "Check your dashboard for upcoming interviews.";
        }
      }

      toast({
        title: `Welcome back, ${userName}!`,
        description: `${description} ${nextStep}`,
        duration: 5000,
      });
    }
  }, [justLoggedIn, user, userRole, profileComplete, hasScheduledInterview, toast]);

  return null; // This component only shows toasts, no UI
};

export default WelcomeMessage;
