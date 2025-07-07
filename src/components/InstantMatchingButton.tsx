
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Clock, CheckCircle, Sparkles } from "lucide-react";

interface InstantMatchingButtonProps {
  onStartMatching: () => void;
  isLoading?: boolean;
}

const InstantMatchingButton = ({ onStartMatching, isLoading = false }: InstantMatchingButtonProps) => {
  return (
    <Card className="bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-lg border-green-400/30 animate-pulse-slow">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
          <Sparkles className="w-6 h-6 text-green-400" />
        </div>
        <CardTitle className="text-white text-xl">Payment Confirmed!</CardTitle>
        <CardDescription className="text-slate-300">
          Your interview session is ready to be matched with the perfect interviewer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span>Payment Confirmed</span>
          </div>
          <div className="flex items-center space-x-2 text-blue-400">
            <Clock className="w-4 h-4" />
            <span>Ready to Match</span>
          </div>
        </div>
        
        <Button
          onClick={onStartMatching}
          disabled={isLoading}
          size="lg"
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 text-lg font-semibold"
        >
          {isLoading ? (
            <>
              <Search className="w-5 h-5 mr-2 animate-spin" />
              Finding Your Perfect Interviewer...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Find My Interviewer
            </>
          )}
        </Button>
        
        <div className="text-center text-xs text-slate-400">
          <p>This button will disappear once your interview is scheduled</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstantMatchingButton;
