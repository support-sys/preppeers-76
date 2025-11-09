import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface SmartCTAButtonsProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export const IntervieweeButton = ({ className = "", size = "lg" }: SmartCTAButtonsProps) => {
  const { user, userRole, profileComplete, hasScheduledInterview } = useAuth();

  // Don't show if user is logged in as interviewer
  if (user && userRole === 'interviewer') return null;

  const getButtonProps = () => {
    if (!user) {
      return {
        text: "Start My Mock Interview",
        to: "/auth?role=interviewee&from=/book"
      };
    }


    if (hasScheduledInterview) {
      return {
        text: "View Your Interviews",
        to: "/dashboard"
      };
    }

    // Default fallback - should rarely hit this
    return {
      text: "Start My Mock Interview",
      to: "/book"
    };
  };

  const { text, to } = getButtonProps();

  return (
    <Link to={to}>
      <Button 
        size={size} 
        className={`bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-blue-500/25 group ${className}`}
      >
        {text}
        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
      </Button>
    </Link>
  );
};

export const InterviewerButton = ({ className = "", size = "lg" }: SmartCTAButtonsProps) => {
  const { user, userRole, profileComplete } = useAuth();

  // Don't show if user is logged in as interviewee
  if (user && userRole === 'interviewee') return null;

  const getButtonProps = () => {
    if (!user) {
      return {
        text: "Already an Interviewer? Register here.",
        to: "/become-interviewer",
        isLink: true
      };
    }

    if (!profileComplete) {
      return {
        text: "Complete Your Profile",
        to: "/interviewers",
        isLink: false
      };
    }

    return {
      text: "Go to Dashboard",
      to: "/dashboard",
      isLink: false
    };
  };

  const { text, to, isLink } = getButtonProps();

  if (isLink) {
    return (
      <Link to={to} className={className}>
        <span className="text-white/80 hover:text-white transition-colors duration-300 text-lg font-medium underline decoration-white/40 hover:decoration-white/80 underline-offset-4">
          {text}
        </span>
      </Link>
    );
  }

  return (
    <Link to={to}>
      <Button 
        size={size} 
        className={`bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-blue-500/25 group ${className}`}
      >
        {text}
        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
      </Button>
    </Link>
  );
};

// Combined component that shows both buttons with proper logic
export const SmartCTAButtons = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex flex-col gap-4 justify-center items-center ${className}`}>
      {/* Group for the two main CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
        {/* Free Resume Review Button */}
        <Link to="/resume-review">
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-blue-500/25 px-8 py-4 text-lg font-semibold rounded-xl"
          >
            Expert Resume Review Free
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </Link>
        
        <IntervieweeButton className="px-8 py-4 text-lg font-semibold rounded-xl" />
      </div>
      
      <InterviewerCTAWrapper />
    </div>
  );
};

const InterviewerCTAWrapper = () => {
  const { user, userRole } = useAuth();

  if (user && userRole === 'interviewee') {
    return null;
  }

  return <InterviewerButton className="px-8 py-4 text-lg font-semibold rounded-xl" />;
};
