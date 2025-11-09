// LinkedIn Share Configuration
// Easy to modify share messages and settings

type ShareVariant = 'mockInterview' | 'resumeReview';

interface LinkedInShareVariantConfig {
  shareMessage: string;
  postUrl: string;
  ui: {
    shareTitle: string;
    shareDescription: string;
    shareButtonText: string;
    confirmationText: string;
    confirmButtonText: string;
    confirmButtonLoadingText: string;
    errorMessage: string;
    errorClaimMessage: string;
    successTitle: string;
    successMessage: string;
  };
  postShare?: {
    title: string;
    description: string;
    buttonText: string;
    resourceUrl?: string;
  } | null;
}

interface LinkedInShareConfig {
  appUrl: string;
  shareUrl: string;
  dialog: {
    width: number;
    height: number;
  };
  variants: Record<ShareVariant, LinkedInShareVariantConfig>;
}

export const LINKEDIN_SHARE_CONFIG: LinkedInShareConfig = {
  appUrl: 'https://interviewise.com',
  shareUrl: 'https://www.linkedin.com/sharing/share-offsite/?url=',
  dialog: {
    width: 600,
    height: 400,
  },
  variants: {
    mockInterview: {
      shareMessage: `🎯 Just booked a mock interview on Interviewise to sharpen my interview skills! 

If you're preparing for interviews too, this platform is amazing - real industry professionals giving detailed feedback.

Check it out: https://interviewise.com

#interviewprep #techjobs #careergrowth #interviewpreparation #softwareengineering #mockinterview`,
      postUrl: 'https://www.linkedin.com/feed/?shareActive=true&text=',
      ui: {
        shareTitle: 'Share & Get Exclusive Resource!',
        shareDescription: '"Top 10 Mistakes to Avoid in Technical Interviews" guide',
        shareButtonText: 'Share & Get Exclusive Guide',
        confirmationText: 'I confirm I posted this message on LinkedIn',
        confirmButtonText: 'Access Free Guide',
        confirmButtonLoadingText: 'Opening...',
        errorMessage: 'Please confirm you posted the message on LinkedIn',
        errorClaimMessage: 'Error downloading resource. Please try again.',
        successTitle: 'Thank you for sharing!',
        successMessage: 'Your interview guide is ready to access!',
      },
      postShare: {
        title: 'Claim Your Free Resource!',
        description: 'Here is our "Top 10 Mistakes to Avoid in Technical Interviews" guide instantly.',
        buttonText: 'Access Free Guide',
        resourceUrl: 'https://sand-tray-c9b.notion.site/Top-10-Mistakes-to-Avoid-in-Technical-Interviews-2025-Edition-1e162faa621c807d81bddc4032b3dcc4?source=copy_link',
      },
    },
    resumeReview: {
      shareMessage: `✅ Just received a free expert resume review from Interviewise

If you're gearing up for interviews, this is a game-changer – fast feedback, tailored suggestions, and zero fluff.

Experience it yourself: https://interviewise.com/resume-review

#resumereview #careergrowth #jobsearch #interviewprep`,
      postUrl: 'https://www.linkedin.com/feed/?shareActive=true&text=',
      ui: {
        shareTitle: 'Share & Unlock Your Resume Review',
        shareDescription: 'Help other candidates discover this free resume review service.',
        shareButtonText: 'Share & Unlock My Review',
        confirmationText: 'I confirm I posted this message on LinkedIn',
        confirmButtonText: 'Unlock My Resume Review',
        confirmButtonLoadingText: 'Unlocking...',
        errorMessage: 'Please confirm you posted the message on LinkedIn',
        errorClaimMessage: 'Please try again after confirming your share.',
        successTitle: 'Thank you for sharing!',
        successMessage: 'Your resume review is now unlocked.',
      },
      postShare: {
        title: 'Confirm Your Share',
        description: 'Check the box below to confirm that you posted on LinkedIn. We\'ll unlock your resume review immediately.',
        buttonText: 'Unlock My Resume Review',
      },
    },
  },
};

export type { ShareVariant, LinkedInShareVariantConfig };
export default LINKEDIN_SHARE_CONFIG;
