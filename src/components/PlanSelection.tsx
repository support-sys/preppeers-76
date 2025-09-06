import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Clock, Award, FileText, Users, Zap, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
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
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set([selectedPlan]));

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, []);

  // Auto-expand selected plan
  useEffect(() => {
    if (selectedPlan) {
      setExpandedPlans(prev => new Set([...prev, selectedPlan]));
    }
  }, [selectedPlan]);

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'essential': return <Clock className="w-6 h-6 text-green-400" />;
      case 'professional': return <FileText className="w-6 h-6 text-blue-400" />;
      case 'executive': return <Award className="w-6 h-6 text-purple-400" />;
      default: return <Clock className="w-6 h-6 text-blue-400" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'essential': return 'green';
      case 'professional': return 'blue';
      case 'executive': return 'purple';
      default: return 'blue';
    }
  };

  const togglePlanExpansion = (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPlans(prev => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) {
        newSet.delete(planId);
      } else {
        newSet.add(planId);
      }
      return newSet;
    });
  };

  const isExpanded = (planId: string) => expandedPlans.has(planId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 px-2">
            Choose Your Plan
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto px-4">
            Select the interview plan that best fits your needs
          </p>
        </div>

        {/* Plans List - Mobile Optimized */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {Object.values(INTERVIEW_PLANS).map((plan) => {
            const color = getPlanColor(plan.id);
            const expanded = isExpanded(plan.id);
            const isSelected = selectedPlan === plan.id;
            
            return (
              <Card 
                key={plan.id}
                className={`relative transition-all duration-300 ${
                  isSelected 
                    ? `ring-2 ring-${color}-500 bg-${color}-50/10 border-${color}-500 shadow-xl shadow-${color}-500/25` 
                    : 'bg-slate-800/70 border-slate-600 hover:border-slate-500 hover:shadow-lg'
                }`}
                onClick={() => onPlanSelect(plan.id)}
              >
                {/* Badges */}
                {plan.isPopular && (
                  <div className="absolute -top-2 left-4 z-10">
                    <Badge className="bg-blue-600 text-white px-3 py-1 text-xs font-bold shadow-lg">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}
                
                {plan.isRecommended && !plan.isPopular && (
                  <div className="absolute -top-2 right-4 z-10">
                    <Badge className="bg-green-600 text-white px-3 py-1 text-xs font-bold shadow-lg">
                      Recommended
                    </Badge>
                  </div>
                )}

                {/* Card Header - Always Visible */}
                <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${color}-500/20`}>
                        {getPlanIcon(plan.id)}
                      </div>
                      <div>
                        <CardTitle className="text-lg sm:text-xl font-bold text-white">
                          {plan.name}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <span className={`text-2xl sm:text-3xl font-bold text-${color}-400`}>₹{plan.price}</span>
                          <span className="text-slate-400 text-sm">/session</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-slate-400 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{plan.duration} min</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {plan.features.length} features
                        </div>
                      </div>
                      <button
                        onClick={(e) => togglePlanExpansion(plan.id, e)}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                      >
                        {expanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Short Description */}
                  <div className="mt-2">
                    <p className="text-slate-300 text-sm">
                      {plan.id === 'essential' && 'Quick practice session with basic feedback'}
                      {plan.id === 'professional' && 'Comprehensive interview with detailed feedback'}
                      {plan.id === 'executive' && 'Premium package with career guidance'}
                    </p>
                  </div>
                </CardHeader>

                {/* Expandable Content */}
                {expanded && (
                  <CardContent className="pt-0 px-4 sm:px-6 pb-4">
                    <div className="space-y-4">
                      {/* Features */}
                      <div>
                        <h4 className="font-semibold text-white mb-3 text-sm">What's Included:</h4>
                        <ul className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm text-slate-300">
                              <span className="text-green-400 mr-2 mt-1">•</span>
                              <span className="leading-relaxed">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Plan-specific highlights */}
                      {plan.id === 'professional' && (
                        <div className="bg-blue-500/10 border border-blue-400/30 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-200 font-semibold text-sm">
                              Best Value for Money
                            </span>
                          </div>
                        </div>
                      )}

                      {plan.id === 'executive' && (
                        <div className="bg-purple-500/10 border border-purple-400/30 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Zap className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-200 font-semibold text-sm">
                              Premium Career Package
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Selected Plan Summary - Sticky on Mobile */}
        {selectedPlanData && (
          <div className="sticky bottom-4 z-10 mb-4">
            <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 text-sm font-medium">Plan Selected</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedPlanData.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedPlanData.duration} minutes • {selectedPlanData.features.length} features
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      ₹{selectedPlanData.price}
                    </div>
                    <div className="text-xs text-gray-500">One-time payment</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Continue Button */}
        <div className="text-center mt-6 sm:mt-8 px-3 sm:px-0">
          <Button 
            onClick={onContinue}
            disabled={!selectedPlan}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Interviewer Match
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </Button>
        </div>

        {/* Pro Tip */}
        <div className="text-center mt-4 sm:mt-6 px-3 sm:px-0">
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
