import React, { useState } from 'react';
import { AlertTriangle, Search, Target, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';

const CandidateJourney = () => {
  const [currentStage, setCurrentStage] = useState(0);
  
  const journeyStages = [
    {
      stage: 1,
      title: "The Struggle",
      icon: <AlertTriangle className="w-8 h-8" />,
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      description: "Multiple rejections, low confidence, unclear feedback",
      painPoints: [
        "Failed 4+ interviews in a row",
        "No constructive feedback from Interviewer",
        "Unclear what went wrong",
        "Lost confidence and motivation"
      ]
    },
    {
      stage: 2,
      title: "Transformation",
      icon: <Target className="w-8 h-8" />,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      description: "Mock interviews, detailed feedback, and targeted improvement",
      painPoints: [
        "Booked mock interview",
        "Practiced with real interviewers",
        "Received detailed feedback report",
        "Identified specific weak areas",
        "Built confidence through repetition"
      ]
    },
    {
      stage: 3,
      title: "Success",
      icon: <Trophy className="w-8 h-8" />,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      description: "Job offers, career growth",
      painPoints: [
        "Landed dream job at top company",
        "Increased salary by ₹7L+",
        "Built lasting confidence",
        "Became referral for others"
      ]
    }
  ];

  const nextStage = () => {
    setCurrentStage((prev) => (prev + 1) % journeyStages.length);
  };

  const prevStage = () => {
    setCurrentStage((prev) => (prev - 1 + journeyStages.length) % journeyStages.length);
  };

  return (
    <div className="relative z-10 bg-white/5 border-t border-white/10">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              The <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Candidate Journey</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              From struggle to success - see how candidates transform their careers with mock interviews
            </p>
          </div>

          {/* Journey Carousel */}
          <div className="relative">
            {/* Carousel Container */}
            <div className="overflow-hidden rounded-2xl">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentStage * 100}%)` }}
              >
                {journeyStages.map((stage, index) => (
                  <div key={index} className="w-full flex-shrink-0">
                    <div className={`${stage.bgColor} rounded-2xl p-6 md:p-8 border border-white/20`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                        {/* Stage Number & Icon */}
                        <div className="text-center md:text-left">
                          <div className={`inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 ${stage.bgColor} rounded-full border-2 border-white/20 mb-4`}>
                            <div className={`${stage.color}`}>
                              {stage.icon}
                            </div>
                          </div>
                          <div className={`text-xl md:text-2xl font-bold ${stage.color} mb-2`}>Stage {stage.stage}</div>
                          <div className="text-white font-semibold text-lg">{stage.title}</div>
                        </div>

                        {/* Description */}
                        <div>
                          <p className="text-slate-300 text-base md:text-lg mb-4">{stage.description}</p>
                          <ul className="space-y-2">
                            {stage.painPoints.map((point, pointIndex) => (
                              <li key={pointIndex} className="flex items-center text-slate-300 text-sm md:text-base">
                                <div className={`w-2 h-2 ${stage.color.replace('text-', 'bg-')} rounded-full mr-3 flex-shrink-0`}></div>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevStage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all duration-300"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={nextStage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all duration-300"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Stage Indicators */}
          <div className="flex justify-center space-x-2 mt-8">
            {journeyStages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStage(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentStage ? 'bg-blue-400' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to Start Your Transformation?</h3>
              <p className="text-slate-300 mb-6">Join thousands of candidates who've transformed their careers with mock interviews</p>
              <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                Start My Mock Interview Journey
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateJourney;
