import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Users, MessageSquare, Award, Zap, DollarSign, Target } from "lucide-react";

const ComparisonSection = () => {
  const comparisonData = [
    {
      category: "Interview Format",
      otherPlatforms: "AI bots, MCQs, scripted Q&A",
      withUs: "Real live interviews with experienced engineers",
      icon: <MessageSquare className="w-5 h-5" />
    },
    {
      category: "Experience",
      otherPlatforms: "Feels like practicing questions, not interviews",
      withUs: "Simulates the real job interview environment",
      icon: <Users className="w-5 h-5" />
    },
    {
      category: "Feedback",
      otherPlatforms: "Basic \"right/wrong\" answers only",
      withUs: "Detailed feedback on communication, confidence, problem-solving & presentation",
      icon: <Award className="w-5 h-5" />
    },
    {
      category: "Human Element",
      otherPlatforms: "No real human guidance",
      withUs: "Interviewers are real engineers who take interviews in top companies",
      icon: <Users className="w-5 h-5" />
    },
    {
      category: "Matching",
      otherPlatforms: "Pay first, then get access",
      withUs: "Instantly matched with your interviewer before paying",
      icon: <Zap className="w-5 h-5" />
    },
    {
      category: "Soft Skills Prep",
      otherPlatforms: "Ignored completely",
      withUs: "Covers technical + communication + behavioral aspects",
      icon: <MessageSquare className="w-5 h-5" />
    },
    {
      category: "Pricing",
      otherPlatforms: "Often costly for low-value prep",
      withUs: "Affordable plans designed for job seekers",
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      category: "Outcome",
      otherPlatforms: "You learn questions, but don't feel ready",
      withUs: "You gain confidence to face real interviews",
      icon: <Target className="w-5 h-5" />
    }
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">
              Why Choose Us Over Other Platforms?
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto px-4">
              See how we provide a superior interview preparation experience compared to traditional platforms
            </p>
          </div>

          {/* Mobile-First Comparison Cards */}
          <div className="space-y-4 sm:hidden">
            {comparisonData.map((item, index) => (
              <div key={index} className="rounded-2xl p-6 border border-white/20 hover:opacity-90 transition-all duration-300" style={{ backgroundColor: '#16285a' }}>
                {/* Category Header */}
                <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-white/10">
                  <div className="text-blue-400 flex-shrink-0">
                    {item.icon}
                  </div>
                  <span className="font-semibold text-white text-sm">{item.category}</span>
                </div>

                {/* Other Platforms */}
                <div className="mb-4">
                  <div className="flex items-start space-x-2 mb-2">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Other Platforms</span>
                  </div>
                  <p className="text-zinc-200 text-sm leading-relaxed pl-6">{item.otherPlatforms}</p>
                </div>

                {/* With Us */}
                <div>
                  <div className="flex items-start space-x-2 mb-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-medium text-green-400 uppercase tracking-wide">With Us</span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed pl-6 font-medium">{item.withUs}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Comparison Table */}
          <div className="hidden sm:block rounded-2xl border border-white/20 overflow-hidden" style={{ backgroundColor: '#16285a' }}>
            {/* Table Header */}
            <div className="grid grid-cols-3 border-b border-white/20" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="p-6 text-center">
                <h3 className="text-lg font-semibold text-slate-300">Category</h3>
              </div>
              <div className="p-6 text-center border-l border-white/20">
                <h3 className="text-lg font-semibold text-slate-300">Other Platforms</h3>
              </div>
              <div className="p-6 text-center border-l border-white/20">
                <h3 className="text-lg font-semibold text-green-400">With Us</h3>
              </div>
            </div>

            {/* Comparison Rows */}
            <div className="divide-y divide-white/10">
              {comparisonData.map((item, index) => (
                <div key={index} className="grid grid-cols-3 hover:opacity-90 transition-all duration-300">
                  {/* Category */}
                  <div className="p-6 flex items-center space-x-3">
                    <div className="text-blue-400 flex-shrink-0">
                      {item.icon}
                    </div>
                    <span className="font-semibold text-white">{item.category}</span>
                  </div>

                  {/* Other Platforms */}
                  <div className="p-6 border-l border-white/20 flex items-start space-x-3">
                    <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-200 text-sm leading-relaxed">{item.otherPlatforms}</span>
                  </div>

                  {/* With Us */}
                  <div className="p-6 border-l border-white/20 flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-sm leading-relaxed font-medium">{item.withUs}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-12">
            <div className="inline-block p-6 rounded-xl max-w-md mx-auto border border-white/20" style={{ backgroundColor: '#16285a' }}>
              <p className="text-lg text-white font-semibold mb-2">
                Ready to experience the difference?
              </p>
              <p className="text-slate-300">
                Join thousands of job seekers who've transformed their interview skills with real practice
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
