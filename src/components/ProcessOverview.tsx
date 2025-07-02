
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ProcessOverview = () => {
  return (
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
  );
};

export default ProcessOverview;
