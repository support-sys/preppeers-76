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
      title: "Select Plan",
      description: "Choose your plan"
    },
    {
      id: 3,
      title: "Find Interviewer",
      description: "Get matched"
    },
    {
      id: 4,
      title: "Select Slot",
      description: "Pick time"
    },
    {
      id: 5,
      title: "Pay",
      description: "Secure payment"
    },
    {
      id: 6,
      title: "Attend",
      description: "Join interview"
    }
  ];

  return (
    <div className="mb-8">
                  <Card className="bg-white/5 border-white/20">
        <CardContent className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              How It Works
            </h2>
            <p className="text-slate-300 text-sm">
              6 simple steps to book your interview
            </p>
          </div>

          {/* Steps Timeline */}
          <div className="relative">
            {/* Desktop: Horizontal Timeline */}
            <div className="hidden md:block">
              <div className="grid grid-cols-6 gap-4 items-start">
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

            {/* Mobile: Vertical Timeline */}
            <div className="md:hidden space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start space-x-4 relative">
                  {/* Step Number */}
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                    {step.id}
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm mb-1">
                      {step.title}
                    </h3>
                    <p className="text-slate-400 text-xs">
                      {step.description}
                    </p>
                  </div>

                  {/* Connecting Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-7 left-3.5 w-0.5 h-6 bg-slate-600 transform -translate-x-1/2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-4 pt-3 border-t border-white/10">
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
