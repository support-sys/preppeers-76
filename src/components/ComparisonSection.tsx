import React from 'react';
import { Check, X } from "lucide-react";

const ComparisonSection = () => {
  const comparisonData = [
    {
      feature: "Real Live Interviews",
      others: false,
      us: true
    },
    {
      feature: "AI Agent Interviews",
      others: true,
      us: false
    },
    {
      feature: "Human Expert Feedback",
      others: false,
      us: true
    },
    {
      feature: "24/7 Availability",
      others: true,
      us: false
    },
    {
      feature: "Industry Expert Interviewers",
      others: false,
      us: true
    },
    {
      feature: "Instant Matching",
      others: false,
      us: true
    },
    {
      feature: "Soft Skills Training",
      others: false,
      us: true
    },
    {
      feature: "Lower Cost",
      others: true,
      us: false
    },
    {
      feature: "Pay After Matching",
      others: false,
      us: true
    },
    {
      feature: "Confidence Building",
      others: false,
      us: true
    }
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">
              Why Choose Us Over Other Platforms?
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto px-4">
              See how we provide a superior interview preparation experience
            </p>
          </div>

          {/* Clean Comparison Table */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-3 bg-white/10 border-b border-white/10">
              <div className="p-4 md:p-6">
                <h3 className="text-sm md:text-base font-semibold text-slate-300 text-left">Features</h3>
              </div>
              <div className="p-4 md:p-6 text-center border-l border-white/10">
                <h3 className="text-sm md:text-base font-semibold text-slate-300">Other Platforms</h3>
              </div>
              <div className="p-4 md:p-6 text-center border-l border-white/10">
                <h3 className="text-sm md:text-base font-semibold text-green-400">Interviewise</h3>
              </div>
            </div>

            {/* Comparison Rows */}
            <div className="divide-y divide-white/5">
              {comparisonData.map((item, index) => (
                <div key={index} className="grid grid-cols-3 hover:bg-white/5 transition-all duration-300">
                  {/* Feature */}
                  <div className="p-4 md:p-6 flex items-center">
                    <span className="text-sm md:text-base font-medium text-white">{item.feature}</span>
                  </div>

                  {/* Other Platforms */}
                  <div className="p-4 md:p-6 border-l border-white/10 flex items-center justify-center">
                    {item.others ? (
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <X className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
                      </div>
                    )}
                  </div>

                  {/* With Us */}
                  <div className="p-4 md:p-6 border-l border-white/10 flex items-center justify-center">
                    {item.us ? (
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <X className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-2xl md:text-3xl font-bold text-blue-400 mb-2">1000+</div>
              <p className="text-sm md:text-base text-slate-300">Mock Interviews Conducted</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-2xl md:text-3xl font-bold text-green-400 mb-2">95%</div>
              <p className="text-sm md:text-base text-slate-300">Success Rate</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-2xl md:text-3xl font-bold text-yellow-400 mb-2">4.9/5</div>
              <p className="text-sm md:text-base text-slate-300">Average Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
