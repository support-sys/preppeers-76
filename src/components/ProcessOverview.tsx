import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, CreditCard, Users, Calendar } from "lucide-react";
const ProcessOverview = () => {
  const steps = [{
    number: 1,
    title: "Fill Details",
    description: "Complete your profile and interview preferences",
    icon: <CheckCircle className="w-6 h-6" />
  }, {
    number: 2,
    title: "Secure Payment",
    description: "Pay ₹999 for your mock interview session",
    icon: <CreditCard className="w-6 h-6" />
  }, {
    number: 3,
    title: "Instant Matching",
    description: "Get matched with an experienced interviewer instantly",
    icon: <Users className="w-6 h-6" />
  }];
  const features = ["Experienced interviewers from top companies", "Real-time feedback and suggestions", "Flexible scheduling options", "Google Meet integration", "Recording for review (optional)", "Follow-up support available"];
  return <div className="space-y-6">
      {/* Process Steps */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{step.title}</h3>
                  <p className="text-slate-300 text-sm">{step.description}</p>
                </div>
              </div>)}
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">What You Get</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {features.map((feature, index) => <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm">{feature}</span>
              </div>)}
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-lg border-green-400/30">
        <CardContent className="p-6 text-center bg-blue-950">
          <div className="text-3xl font-bold text-white mb-2">₹999</div>
          <div className="text-green-400 font-semibold mb-1">Per Interview</div>
          <div className="text-sm text-slate-300">
            All-inclusive pricing with no hidden fees
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default ProcessOverview;