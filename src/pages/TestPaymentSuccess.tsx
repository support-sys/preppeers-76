import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import LinkedInShare from '@/components/LinkedInShare';

const TestPaymentSuccess = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Tech Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent">
          <div 
            className="w-full h-full"
            style={{
              background: 'radial-gradient(circle at 25% 25%, rgba(156, 146, 172, 0.1) 2px, transparent 2px)',
              backgroundSize: '60px 60px'
            }}
          />
        </div>
      </div>
      
      <Navigation />
      <div className="relative z-10 flex items-center justify-center min-h-[80vh] px-4 py-8">
        <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white/20 w-full max-w-md mx-auto">
          {/* Success Icon */}
          <div className="text-green-400 mb-6">
            <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          {/* Success Message */}
          <h2 className="text-2xl sm:text-3xl font-bold text-green-400 mb-3">🎉 Payment Successful!</h2>
          <p className="text-slate-300 text-sm sm:text-base mb-8 leading-relaxed">
            Your interview has been automatically scheduled! Check your email for confirmation details.
          </p>
          
          {/* LinkedIn Share Component */}
          <div className="mb-8">
            <LinkedInShare 
              target_role="Frontend Developer"
              userEmail="test@example.com"
              onShareComplete={() => {
                console.log('User shared interview booking on LinkedIn');
              }}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-slate-600 hover:bg-slate-700 active:bg-slate-800 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TestPaymentSuccess;
