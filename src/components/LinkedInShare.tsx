import React, { useState } from 'react';
import { Linkedin, Share2, Download, Check } from 'lucide-react';
import { LINKEDIN_SHARE_CONFIG } from '@/config/linkedinShareConfig';

interface LinkedInShareProps {
  target_role: string;
  userEmail?: string;
  onShareComplete?: () => void;
}

export const LinkedInShare: React.FC<LinkedInShareProps> = ({
  target_role,
  userEmail,
  onShareComplete
}) => {
  const [hasShared, setHasShared] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [userConfirmedShare, setUserConfirmedShare] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { shareMessage, appUrl, shareUrl, postUrl, incentive, ui, dialog } = LINKEDIN_SHARE_CONFIG;

  const handleShare = () => {
    try {
      // Create LinkedIn post URL with prefilled message
      const linkedInPostUrl = `${postUrl}${encodeURIComponent(shareMessage)}`;
      
      console.log('🔗 LinkedIn Post URL with prefilled text:', linkedInPostUrl);
      console.log('📝 Prefilled message:', shareMessage);
      console.log('🌐 App URL:', appUrl);
      
      // Open LinkedIn with prefilled post
      window.open(linkedInPostUrl, '_blank', `width=${dialog.width},height=${dialog.height}`);
      
      // Show claim form after sharing
      setShowClaimForm(true);
    } catch (error) {
      console.error('Error sharing to LinkedIn:', error);
      // Fallback: just open LinkedIn feed
      window.open('https://www.linkedin.com/feed/', '_blank');
    }
  };

  const handleAccessResource = () => {
    if (!userConfirmedShare) {
      alert(ui.errorMessage);
      return;
    }

    setIsLoading(true);

    try {
      // Open the resource link in a new tab
      window.open(incentive.resourceUrl, '_blank');
      
      setHasShared(true);
      
      if (onShareComplete) {
        onShareComplete();
      }
    } catch (error) {
      console.error('Error accessing resource:', error);
      alert(ui.errorClaimMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50/10 to-indigo-100/10 rounded-xl p-4 sm:p-6 border border-blue-400/30">
      <div className="flex items-start space-x-3 mb-4">
        <div className="bg-blue-500 p-2 rounded-full flex-shrink-0">
          <Linkedin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm sm:text-base mb-1">{ui.shareTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-300 mb-2">{ui.shareDescription}</p>

        </div>
      </div>

      {!hasShared ? (
        <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-slate-300 mb-2">This message will be prefilled on LinkedIn:</p>
                    <div className="bg-white/5 p-3 rounded text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {shareMessage}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      💡 LinkedIn will open with this message ready - just click "Post"! After sharing, you'll get instant access to our free guide.
                    </p>
                  </div>

          <button
            onClick={handleShare}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 font-semibold transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm sm:text-base">{ui.shareButtonText}</span>
          </button>

          {showClaimForm && (
            <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Download className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                <h4 className="font-medium text-green-400 text-sm sm:text-base">{incentive.title}</h4>
              </div>
              <p className="text-xs sm:text-sm text-green-300 mb-3 leading-relaxed">
                {incentive.description}
              </p>
              
              <div className="flex items-start space-x-2 mb-3">
                <input 
                  type="checkbox" 
                  id="shared-confirmation"
                  checked={userConfirmedShare}
                  onChange={(e) => setUserConfirmedShare(e.target.checked)}
                  className="rounded mt-1 flex-shrink-0"
                />
                <label htmlFor="shared-confirmation" className="text-xs sm:text-sm text-green-300 leading-relaxed">
                  {ui.confirmationText}
                </label>
              </div>
              
              <button
                onClick={handleAccessResource}
                disabled={!userConfirmedShare || isLoading}
                className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-600 text-white px-4 py-3 rounded-xl text-sm sm:text-base transition-all duration-200 flex items-center justify-center space-x-2 font-semibold transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Opening...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{incentive.buttonText}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4 sm:p-6 text-center">
          <Check className="w-12 h-12 sm:w-16 sm:h-16 text-green-400 mx-auto mb-3" />
          <h4 className="font-medium text-green-400 mb-2 text-sm sm:text-base">{incentive.successTitle}</h4>
          <p className="text-xs sm:text-sm text-green-300 leading-relaxed">
            {incentive.successMessage}
          </p>
        </div>
      )}
    </div>
  );
};

export default LinkedInShare;
