import React from 'react';
import { TrendingUp, Users, Target, DollarSign } from 'lucide-react';

const ImpactStatistics = () => {
  const stats = [
    {
      value: "97%",
      label: "Success Rate",
      icon: <Target className="w-8 h-8" />,
      color: "text-green-400"
    },
    {
      value: "10x",
      label: "Higher Confidence",
      icon: <TrendingUp className="w-8 h-8" />,
      color: "text-blue-400"
    },
    {
      value: "89%",
      label: "Faster Hiring",
      icon: <Users className="w-8 h-8" />,
      color: "text-purple-400"
    },
    {
      value: "50%",
      label: "Average Salary Hike",
      icon: <DollarSign className="w-8 h-8" />,
      color: "text-yellow-400"
    }
  ];

  return (
    <div className="relative z-10 bg-gradient-to-r from-blue-900/50 to-slate-900/50 border-t border-white/10">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Mock Interviews <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Transform Careers</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Real data from candidates who've transformed their interview success rates
            </p>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`${stat.color} mb-2 md:mb-4 flex justify-center`}>
                  <div className="w-6 h-6 md:w-8 md:h-8">
                    {stat.icon}
                  </div>
                </div>
                <div className={`text-2xl md:text-4xl lg:text-5xl font-bold ${stat.color} mb-1 md:mb-2`}>
                  {stat.value}
                </div>
                <div className="text-white font-semibold text-sm md:text-base mb-1">{stat.label}</div>
                <div className="text-slate-400 text-xs md:text-sm leading-tight">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactStatistics;
