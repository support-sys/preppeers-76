// LinkedIn Share Configuration
// Easy to modify share messages and settings

export const LINKEDIN_SHARE_CONFIG = {
  // Main share message
  shareMessage: `🎯 Just booked a mock interview on Interviewise to sharpen my interview skills! 

If you're preparing for interviews too, this platform is amazing - real industry professionals giving detailed feedback.

Check it out: https://interviewise.com

#interviewprep #techjobs #careergrowth #interviewpreparation #softwareengineering #mockinterview`,
  
  // App URLs
  appUrl: 'https://interviewise.com',
  shareUrl: 'https://www.linkedin.com/sharing/share-offsite/?url=',
  // LinkedIn direct post creation URL with prefilled text
  postUrl: 'https://www.linkedin.com/feed/?shareActive=true&text=',
  
  // Incentive system
  incentive: {
    title: 'Claim Your Free Resource!',
    description: 'Here is our "Top 10 Mistakes to Avoid in Technical Interviews" guide instantly.',
    buttonText: 'Access Free Guide',
    successTitle: 'Thank you for sharing!',
    successMessage: 'Your interview guide is ready to access!',
    resourceUrl: 'https://sand-tray-c9b.notion.site/Top-10-Mistakes-to-Avoid-in-Technical-Interviews-2025-Edition-1e162faa621c807d81bddc4032b3dcc4?source=copy_link',
    resourceTitle: 'Top 10 Mistakes to Avoid in Technical Interviews - 2025 Edition'
  },
  
  // UI text
  ui: {
    shareTitle: 'Share & Get Exclusive Resource!',
    shareDescription: ' "Top 10 Mistakes to Avoid in Technical Interviews" guide',
    shareButtonText: 'Share & Get Exclusive Guide',
    confirmationText: 'I confirm I posted this message on LinkedIn',
    errorMessage: 'Please confirm you posted the message on LinkedIn',
    errorClaimMessage: 'Error downloading resource. Please try again.'
  },
  
  // LinkedIn share dialog settings
  dialog: {
    width: 600,
    height: 400
  }
} as const;

export default LINKEDIN_SHARE_CONFIG;
