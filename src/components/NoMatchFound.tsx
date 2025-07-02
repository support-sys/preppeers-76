
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppChat from "@/components/WhatsAppChat";

interface NoMatchFoundProps {
  formData: any;
  onTryAgain: () => void;
}

const NoMatchFound = ({ formData, onTryAgain }: NoMatchFoundProps) => {
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
                onClick={onTryAgain}
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
};

export default NoMatchFound;
