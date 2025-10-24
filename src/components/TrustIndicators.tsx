import React from 'react';
import { Shield, Users, Award, CheckCircle, Building2, Globe } from 'lucide-react';

const TrustIndicators = () => {
  const trustMetrics = [
    {
      icon: <Users className="w-8 h-8" />,
      value: "2,500+",
      label: "Successful Candidates",
      description: "Placed in top companies",
      color: "text-blue-400"
    },
    {
      icon: <Award className="w-8 h-8" />,
      value: "4.8/5",
      label: "Average Rating",
      description: "From verified candidates",
      color: "text-yellow-400"
    },
    {
      icon: <Building2 className="w-8 h-8" />,
      value: "150+",
      label: "Partner Companies",
      description: "Where our candidates work",
      color: "text-green-400"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      value: "25+",
      label: "Cities Covered",
      description: "Across India",
      color: "text-purple-400"
    }
  ];

  const companyLogos = [
    "Capgemini", "Deloitte", 
    "Mars", "L&T Infotech", "Wipro", "HCL"
  ];

  const certifications = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "100% Secure",
      description: "Your data is protected with enterprise-grade security"
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Verified Interviewers",
      description: "All interviewers are verified professionals from top companies"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Industry Recognition",
      description: "Featured in leading tech publications and job portals"
    }
  ];

  return (
    <div className="relative z-10 bg-gradient-to-r from-slate-900/50 to-blue-900/50 border-t border-white/10">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
  
          {/* Company Logos - Moving Carousel */}
          <div className="bg-white/10 rounded-2xl p-8 border border-white/20 mb-16">
            <h3 className="text-2xl font-bold text-white text-center mb-8">
              Our Interviewers Work At
            </h3>
            <div className="overflow-hidden">
              <div className="flex animate-scroll">
                {/* First set of companies */}
                {companyLogos.map((company, index) => (
                  <div key={`first-${index}`} className="flex-shrink-0 mx-4">
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 whitespace-nowrap">
                      <div className="text-white font-semibold text-sm">{company}</div>
                    </div>
                  </div>
                ))}
                {/* Duplicate set for seamless loop */}
                {companyLogos.map((company, index) => (
                  <div key={`second-${index}`} className="flex-shrink-0 mx-4">
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 whitespace-nowrap">
                      <div className="text-white font-semibold text-sm">{company}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustIndicators;
