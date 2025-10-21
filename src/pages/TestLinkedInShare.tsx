import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import LinkedInShare from '@/components/LinkedInShare';

const TestLinkedInShare = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
            <h1 className="text-4xl font-bold text-white mb-4">🧪 Test LinkedIn Share</h1>
            <p className="text-xl text-slate-300 mb-8">
              This is a test page to preview the LinkedIn share component
            </p>
            
            {/* Mock Success Message */}
            <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-6 mb-8">
              <div className="text-green-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-400 mb-4">🎉 Payment Successful!</h2>
              <p className="text-slate-300 mb-6">
                Your interview has been automatically scheduled! Check your email for confirmation details.
              </p>
            </div>

            {/* LinkedIn Share Component */}
            <LinkedInShare 
              target_role="Frontend Developer"
              userEmail="test@example.com"
              onShareComplete={() => {
                console.log('User shared interview booking on LinkedIn');
              }}
            />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default TestLinkedInShare;
