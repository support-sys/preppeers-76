
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Clock, CheckCircle } from "lucide-react";

interface InstantMatchingButtonProps {
  onStartMatching: () => void;
  isLoading?: boolean;
}

const InstantMatchingButton = ({ onStartMatching, isLoading = false }: InstantMatchingButtonProps) => {
  return (
    <Card className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-lg border-blue-400/30 animate-pulse-slow">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
          <Zap className="w-6 h-6 text-blue-400" />
        </div>
        <CardTitle className="text-white text-xl">Payment Confirmed!</CardTitle>
        <CardDescription className="text-slate-300">
          Your interview session is ready to be matched
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span>Payment Done</span>
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
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 text-lg font-semibold"
        >
          {isLoading ? (
            <>
              <Clock className="w-5 h-5 mr-2 animate-spin" />
              Finding Your Interviewer...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Start Instant Matching
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default InstantMatchingButton;
