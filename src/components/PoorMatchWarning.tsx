import { AlertTriangle, Clock, Users, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PoorMatchWarningProps {
  matchQuality: string;
  matchScore: number;
  skillCategories: string[];
  onAcceptMatch: () => void;
  onWaitForBetter: () => void;
  onModifyRequirements: () => void;
}

const PoorMatchWarning = ({ 
  matchQuality,
  matchScore,
  skillCategories,
  onAcceptMatch,
  onWaitForBetter,
  onModifyRequirements
}: PoorMatchWarningProps) => {
  return (
    <Card className="shadow-2xl backdrop-blur-lg border-2 bg-white/10 border-orange-400/30">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-orange-500/20 backdrop-blur-sm">
          <AlertTriangle className="w-8 h-8 text-orange-400" />
        </div>
        <CardTitle className="text-2xl font-bold text-orange-400">
          Limited Skill Match Found
        </CardTitle>
        <CardDescription className="text-orange-200">
          The interviewer has minimal overlap with your requested skills ({skillCategories.join(', ')})
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-white/5 backdrop-blur-sm border border-orange-400/30 p-4 rounded-xl">
          <h4 className="font-semibold text-orange-400 mb-3">What this means:</h4>
          <ul className="text-sm text-orange-200 space-y-2">
            <li>• Match score: {matchScore}/100 (below ideal threshold)</li>
            <li>• Focus will be on general interview skills and soft skills</li>
            <li>• Limited technical depth in your specific technology stack</li>
            <li>• Still valuable for interview practice and experience</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={onAcceptMatch}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-4 rounded-xl transition-all duration-300"
          >
            <Lightbulb className="w-5 h-5 mr-2" />
            Accept General Interview (₹999)
          </Button>
          
          <Button 
            onClick={onWaitForBetter}
            variant="outline"
            className="w-full border-2 border-blue-400/50 text-blue-400 hover:bg-blue-400/10 font-semibold py-4 rounded-xl transition-all duration-300"
          >
            <Clock className="w-5 h-5 mr-2" />
            Wait for Better Match
          </Button>
          
          <Button 
            onClick={onModifyRequirements}
            variant="outline" 
            className="w-full border-2 border-slate-400/50 text-slate-400 hover:bg-slate-400/10 font-semibold py-4 rounded-xl transition-all duration-300"
          >
            <Users className="w-5 h-5 mr-2" />
            Modify Requirements
          </Button>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-blue-400/30 p-4 rounded-xl">
          <h4 className="font-semibold text-blue-400 mb-2">💡 Better Match Options:</h4>
          <p className="text-sm text-blue-200">
            We'll notify you when an interviewer with stronger {skillCategories.join(' or ')} skills becomes available. 
            You can also try adjusting your preferred time slot for more options.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PoorMatchWarning;