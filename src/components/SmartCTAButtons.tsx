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
        text: "Book a Mock Interview",
        to: "/auth?role=interviewee"
      };
    }

    if (!profileComplete) {
      return {
        text: "Complete Your Profile",
        to: "/book"
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
      text: "Book a Mock Interview",
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
        text: "Become an Interviewer",
        to: "/auth?role=interviewer"
      };
    }

    if (!profileComplete) {
      return {
        text: "Complete Your Profile",
        to: "/interviewers"
      };
    }

    return {
      text: "Go to Dashboard",
      to: "/dashboard"
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

// Combined component that shows both buttons with proper logic
export const SmartCTAButtons = ({ className = "" }: { className?: string }) => {
  const { user, userRole } = useAuth();

  return (
    <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center ${className}`}>
      <IntervieweeButton className="px-8 py-4 text-lg font-semibold rounded-xl" />
      <InterviewerButton className="px-8 py-4 text-lg font-semibold rounded-xl" />
    </div>
  );
};
