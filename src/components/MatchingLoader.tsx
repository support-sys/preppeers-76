
import React from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppChat from "@/components/WhatsAppChat";

interface MatchingLoaderProps {
  embedded?: boolean;
}

const MatchingLoader = ({ embedded = false }: MatchingLoaderProps) => {
  // Full page version (for standalone use)
  if (!embedded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
              <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-400 mx-auto mb-6"></div>
              <h1 className="text-4xl font-bold text-white mb-4">Matching You With An Interviewer</h1>
              <p className="text-xl text-slate-300">
                We're finding the perfect interviewer based on your skills and experience...
              </p>
            </div>
          </div>
        </div>
        <WhatsAppChat />
        <Footer />
      </div>
    );
  }

  // Embedded version (for use within existing page layout)
  return (
    <div className="w-full">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 sm:p-12 border border-white/20 shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-b-2 border-blue-400 mx-auto mb-6"></div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">Matching You With An Interviewer</h1>
          <p className="text-lg sm:text-xl text-slate-300">
            We're finding the perfect interviewer based on your skills and experience...
          </p>
        </div>
      </div>
    </div>
  );
};

export default MatchingLoader;
