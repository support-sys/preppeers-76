import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const BookingStepsGuide = () => {
  const steps = [
    {
      id: 1,
      title: "Fill Form",
      description: "Complete your profile"
    },
    {
      id: 2,
      title: "Get Matched",
      description: "Find your interviewer"
    },
    {
      id: 3,
      title: "Book & Pay",
      description: "Select plan and pay"
    },
    {
      id: 4,
      title: "Attend",
      description: "Join interview"
    }
  ];

  return (
    <div className="mb-6">
                  <Card className="bg-white/5 border-white/20">
        <CardContent className="p-4 sm:p-6">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
              How It Works
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              4 simple steps to book your interview
            </p>
          </div>

          {/* Steps Timeline */}
          <div className="relative">
            {/* Desktop: Horizontal Timeline */}
            <div className="hidden md:block">
              <div className="grid grid-cols-4 gap-4 items-start">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center relative">
                    {/* Step Number */}
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mb-3 text-white font-bold text-sm">
                      {step.id}
                    </div>
                    
                    {/* Step Content */}
                    <div className="text-center">
                      <h3 className="text-white font-semibold text-sm mb-1">
                        {step.title}
                      </h3>
                      <p className="text-slate-400 text-xs leading-tight">
                        {step.description}
                      </p>
                    </div>

                    {/* Connecting Line */}
                    {index < steps.length - 1 && (
                      <div className="absolute top-5 left-full w-full h-0.5 bg-slate-600 transform -translate-y-1/2" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: Compact Grid */}
            <div className="md:hidden">
              <div className="grid grid-cols-2 gap-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                    {/* Step Number */}
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                      {step.id}
                    </div>
                    
                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-xs mb-0.5 truncate">
                        {step.title}
                      </h3>
                      <p className="text-slate-400 text-xs truncate">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-3 pt-2 border-t border-white/10">
            <p className="text-slate-300 text-xs">
              Ready to start? Fill the form below
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingStepsGuide;
