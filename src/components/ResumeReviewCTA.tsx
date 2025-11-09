import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, FileText, Users, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ResumeReviewCTAProps {
  userEmail?: string;
  targetRole?: string;
}

export const ResumeReviewCTA = ({ userEmail, targetRole }: ResumeReviewCTAProps) => {
  return (
    <Card className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-blue-500/30 mb-6">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-600/20 p-3 rounded-lg">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">
              🎉 Great! You've reviewed your resume. Now ace the interview!
            </h3>
            <p className="text-slate-300 text-sm mb-4">
              You've identified areas to improve in your resume. Now practice with a <strong className="text-white">real mock interview</strong> and get expert feedback to boost your confidence!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>Practice real interview questions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>Get expert feedback</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>Build confidence</span>
              </div>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Link to={userEmail ? `/book?source=resume-review&email=${encodeURIComponent(userEmail)}` : '/book'}>
                Book Mock Interview
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


