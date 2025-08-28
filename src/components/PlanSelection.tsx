import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Clock, Award, FileText, Users, Zap, ArrowRight } from "lucide-react";
import { INTERVIEW_PLANS, InterviewPlan } from "@/utils/planConfig";

interface PlanSelectionProps {
  selectedPlan: string;
  onPlanSelect: (planId: string) => void;
  onContinue: () => void;
}

const PlanSelection: React.FC<PlanSelectionProps> = ({
  selectedPlan,
  onPlanSelect,
  onContinue
}) => {
  const selectedPlanData = INTERVIEW_PLANS[selectedPlan as keyof typeof INTERVIEW_PLANS];

  // Scroll to top when component mounts
  useEffect(() => {
    // Scroll to top with smooth behavior
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Also scroll the document body to top for mobile browsers
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, []);

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'essential': return <Clock className="w-8 h-8 text-blue-400" />;
      case 'professional': return <FileText className="w-8 h-8 text-blue-400" />;
      case 'executive': return <Award className="w-8 h-8 text-blue-400" />;
      default: return <Clock className="w-8 h-8 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 px-2">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto px-4">
            Choose the plan that fits your needs. All sessions include live feedback and improvement plans.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
          {Object.values(INTERVIEW_PLANS).map((plan) => (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-300 hover:scale-105 h-full ${
                selectedPlan === plan.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50/10 border-blue-500 shadow-xl shadow-blue-500/25' 
                  : 'bg-slate-800/70 border-slate-600 hover:border-slate-500 hover:shadow-lg'
              }`}
              onClick={() => onPlanSelect(plan.id)}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-2 text-sm font-bold shadow-lg">
                    <Star className="w-4 h-4 mr-2" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {/* Recommended Badge */}
              {plan.isRecommended && !plan.isPopular && (
                <div className="absolute -top-4 right-4">
                  <Badge className="bg-green-600 text-white px-3 py-2 text-sm font-bold shadow-lg">
                    Recommended
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4 sm:pb-6 pt-6 sm:pt-8 px-4 sm:px-6">
                {/* Plan Icon */}
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-3 sm:mb-4 bg-blue-500/20">
                  {getPlanIcon(plan.id)}
                </div>
                
                {/* Plan Name */}
                <CardTitle className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {plan.name}
                </CardTitle>
                
                {/* Key Feature */}
                <CardDescription className="text-slate-300 text-base sm:text-lg font-medium px-2">
                  {plan.id === 'essential' && 'Quick practice session with basic feedback'}
                  {plan.id === 'professional' && 'Comprehensive interview with detailed feedback'}
                  {plan.id === 'executive' && 'Premium package with career guidance'}
                </CardDescription>
                
                {/* Price */}
                <div className="mt-4 sm:mt-6">
                  <span className="text-3xl sm:text-4xl font-bold text-blue-400">₹{plan.price}</span>
                  <span className="text-slate-400 ml-2">/session</span>
                </div>
                
                {/* Duration */}
                <div className="flex items-center justify-center space-x-2 mt-3">
                  <Clock className="w-4 h-4 sm:w-5 sm:w-5 text-slate-400" />
                  <span className="text-slate-400 text-sm sm:text-base">
                    {plan.duration} minutes
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                {/* Features */}
                <div>
                  <h4 className="font-semibold text-white text-center mb-3 text-sm sm:text-base">What's Included:</h4>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-300">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-center text-xs sm:text-sm text-blue-400 pt-2">
                        +{plan.features.length - 4} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* Plan-specific highlights */}
                {plan.id === 'professional' && (
                  <div className="bg-blue-500/10 border border-blue-400/30 p-2 sm:p-3 rounded-lg">
                    <div className="flex items-center space-x-2 justify-center">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                      <span className="text-blue-200 font-semibold text-xs sm:text-sm text-center">
                        Best Value for Money
                      </span>
                    </div>
                  </div>
                )}

                {plan.id === 'executive' && (
                  <div className="bg-purple-500/10 border border-purple-400/30 p-2 sm:p-3 rounded-lg">
                    <div className="flex items-center space-x-2 justify-center">
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                      <span className="text-purple-200 font-semibold text-xs sm:text-sm text-center">
                        Premium Career Package
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Plan Summary */}
        {selectedPlanData && (
          <div className="max-w-4xl mx-auto mt-6 sm:mt-8 px-3 sm:px-0">
            <Card className="bg-white/5 border-white/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
                  {/* Plan Details */}
                  <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600/20 border border-blue-500/30 rounded-full mb-3 sm:mb-4">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 mr-2" />
                      <span className="text-blue-200 text-xs sm:text-sm font-medium">Plan Selected</span>
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
                      {selectedPlanData.name}
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                        <span className="text-slate-300 text-sm sm:text-base">{selectedPlanData.duration} minutes</span>
                      </div>
                      <div className="hidden sm:block w-1 h-1 bg-slate-500 rounded-full"></div>
                      <div className="flex items-center space-x-2">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                        <span className="text-slate-300 text-sm sm:text-base">{selectedPlanData.features.length} features</span>
                      </div>
                    </div>
                    
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-md mx-auto lg:mx-0">
                      {selectedPlanData.shortDescription}
                    </p>
                  </div>
                  
                  {/* Price Section */}
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl">
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                        ₹{selectedPlanData.price}
                      </div>
                      <div className="text-slate-300 text-xs sm:text-sm font-medium">Total Amount</div>
                      <div className="text-xs text-slate-400 mt-1">One-time payment</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Continue Button */}
        <div className="text-center mt-8 sm:mt-10 px-3 sm:px-0">
          <Button 
            onClick={onContinue}
            disabled={!selectedPlan}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Interviewer Matching
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </Button>
        </div>

        {/* Pro Tip */}
        <div className="text-center mt-6 sm:mt-8 px-3 sm:px-0">
          <div className="inline-block p-3 sm:p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-200 leading-relaxed">
              💡 <strong>Pro Tip:</strong> Most candidates choose Professional or Executive for better results and comprehensive feedback!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;
