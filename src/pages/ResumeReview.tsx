import { useState, useEffect, useRef } from 'react';
import { ResumeReviewForm, ResumeReviewData } from '@/components/resume/ResumeReviewForm';
import { ResumeReportViewer } from '@/components/resume/ResumeReportViewer';
import { ResumeReviewPayment } from '@/components/resume/ResumeReviewPayment';
import { LinkedInShare } from '@/components/LinkedInShare';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import WhatsAppChat from '@/components/WhatsAppChat';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';

interface ResumeReviewStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  report_url: string | null;
  user_email: string;
  target_role: string;
  user_name?: string | null;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
}

const ResumeReview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [stage, setStage] = useState<'form' | 'payment' | 'waiting'>('form');
  const [submittedEmail, setSubmittedEmail] = useState<string>('');
  const [submittedReviewId, setSubmittedReviewId] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<ResumeReviewStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [hasConfirmedShare, setHasConfirmedShare] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed' | 'refunded' | null>(null);
  const [paymentSuccessPending, setPaymentSuccessPending] = useState(false);
  const [pendingReviewInfo, setPendingReviewInfo] = useState<{ email: string; name: string } | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    const reviewIdParam = searchParams.get('reviewId');
    const emailParam = searchParams.get('email');
    const paymentParam = searchParams.get('payment');

    if (reviewIdParam) {
      setSubmittedReviewId(reviewIdParam);
      setStage('waiting');
      setIsSubmitted(true);
      setHasConfirmedShare(false);

      if (emailParam) {
        setSubmittedEmail(emailParam);
        setPendingReviewInfo((prev) => prev ?? { email: emailParam, name: '' });
      }

      if (paymentParam === 'success') {
        setPaymentSuccessPending(true);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!reviewData || reviewData.status !== 'completed') {
      setHasConfirmedShare(false);
    }
  }, [reviewData]);

  // Check review status periodically or via realtime
  useEffect(() => {
    if (!submittedReviewId) return;

    // Check status immediately
    checkReviewStatus();

    // Set up polling (fallback if realtime doesn't work)
    pollingIntervalRef.current = setInterval(() => {
      checkReviewStatus();
    }, 10000); // Check every 10 seconds

    // Set up realtime subscription for status updates
    const channel = supabase
      .channel(`resume-review-${submittedReviewId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'resume_reviews',
          filter: `id=eq.${submittedReviewId}`,
        },
        (payload) => {
          console.log('📊 Realtime update received:', payload);
          const updatedReview = payload.new as ResumeReviewStatus;
          setReviewData(updatedReview);
          
          if (updatedReview.status === 'completed' && updatedReview.report_url) {
            // Report is ready, stop polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [submittedReviewId]);

  const checkReviewStatus = async () => {
    if (!submittedReviewId) return;

    try {
      setIsCheckingStatus(true);
      const { data, error } = await (supabase as any)
        .from('resume_reviews')
        .select('id, status, report_url, user_email, user_name, target_role, payment_status, payment_amount')
        .eq('id', submittedReviewId)
        .single();

      if (error) {
        console.error('Error checking review status:', error);
        return;
      }

      if (data) {
        const typedData = data as unknown as ResumeReviewStatus;
        setReviewData(typedData);
        setSubmittedEmail(typedData.user_email);
        setPendingReviewInfo((prev) => prev ?? { email: typedData.user_email, name: typedData.user_name || '' });

        const paymentState = typedData.payment_status ?? null;
        setPaymentStatus(paymentState);

        if (paymentState === 'paid') {
          if (paymentSuccessPending) {
            setPaymentSuccessPending(false);
          }
          if (stage !== 'waiting') {
            setStage('waiting');
          }
          if (!isSubmitted) {
            setIsSubmitted(true);
          }
        } else if (stage === 'waiting') {
          if (paymentSuccessPending) {
            console.log('Payment confirmation pending—holding waiting state');
          } else {
          setStage('payment');
          setIsSubmitted(false);
          }
        }
        
        if (typedData.status === 'completed' && typedData.report_url) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          toast({
            title: "Report Ready!",
            description: "Your resume review report is now available.",
          });
        }
      }
    } catch (error) {
      console.error('Error in checkReviewStatus:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSubmit = async (data: ResumeReviewData) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need an account to request a resume review.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    console.log('📋 Resume review submission:', data);

    try {
      setHasConfirmedShare(false);

      // Prepare resume review data for database
      const reviewData = {
        user_id: user.id,
        user_email: data.email || user.email,
        user_name: data.name,
        target_role: data.targetRole,
        experience_years: data.experienceYears,
        resume_url: data.resumeUrl,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        utm_source: new URLSearchParams(window.location.search).get('utm_source'),
        referrer: document.referrer
      };

      console.log('💾 Saving resume review to database...');
      console.log('📊 Review data to save:', reviewData);

      // Save to database - use anonymous client to avoid auth issues
      const { data: savedReview, error } = await (supabase as any)
        .from('resume_reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving resume review:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast({
          title: "Submission Error",
          description: `Failed to submit resume review: ${error.message}`,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Resume review saved successfully:', savedReview.id);

      // Show success and move to payment step
      const emailToUse = data.email || user.email || '';

      setSubmittedEmail(emailToUse);
      setSubmittedReviewId(savedReview.id);
      setReviewData({
        id: savedReview.id,
        status: savedReview.status || 'pending',
        report_url: savedReview.report_url || null,
        user_email: emailToUse,
        target_role: data.targetRole,
        user_name: data.name || user.user_metadata?.full_name || '',
        payment_status: savedReview.payment_status || 'pending'
      });
      setPendingReviewInfo({
        email: emailToUse,
        name: data.name || user.user_metadata?.full_name || ''
      });
      setPaymentStatus(
        (savedReview.payment_status as 'pending' | 'paid' | 'failed' | 'refunded' | undefined) ?? 'pending'
      );
      setStage('payment');
      setIsSubmitted(false);
      setIsSubmitting(false);

      toast({
        title: "Resume Submitted!",
        description: "Complete the payment below to start your expert resume review.",
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('❌ Error processing resume review:', error);
      toast({
        title: "Error",
        description: "Failed to submit resume review. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  const isReportReady = !!(reviewData && reviewData.status === 'completed' && reviewData.report_url);

  const handlePaymentCompleted = () => {
    setStage('waiting');
    setIsSubmitted(true);
    setPaymentStatus('paid');
    setHasConfirmedShare(false);
    checkReviewStatus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      {/* Tech Background Pattern - Consistent with main site */}
      <div className="absolute inset-0 opacity-10 hidden md:block">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent">
          <div className="w-full h-full" style={{
            background: 'radial-gradient(circle at 25% 25%, rgba(156, 146, 172, 0.1) 2px, transparent 2px)',
            backgroundSize: '60px 60px'
          }} />
        </div>
      </div>

      <div className="relative z-10 pt-16 sm:pt-24 md:pt-32 pb-16 sm:pb-20">
        {/* Report Viewer Gate - Show share prompt before displaying report */}
        {stage === 'waiting' && isReportReady && (
          <div className="container mx-auto px-4 sm:px-6 mb-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {!hasConfirmedShare ? (
                <div className="bg-white/10 border border-white/20 rounded-2xl p-6 sm:p-7 md:p-8 shadow-xl">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 text-center leading-tight">
                    🎉 Your Resume Review Is Ready!
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg text-slate-300 text-center mb-6">
                    Before you access your detailed expert review, help other job seekers discover this free service!
                  </p>
                  <LinkedInShare
                    target_role={reviewData?.target_role || ''}
                    userEmail={reviewData?.user_email}
                    variant="resumeReview"
                    onShareComplete={() => {
                      setHasConfirmedShare(true);
                      toast({
                        title: 'Thank you for sharing!',
                        description: 'Your resume review is now unlocked.',
                      });
                    }}
                  />
                </div>
              ) : (
                <ResumeReportViewer
                  reportUrl={reviewData.report_url}
                  status={reviewData.status}
                  userEmail={reviewData.user_email}
                  targetRole={reviewData.target_role}
                />
              )}
            </div>
          </div>
        )}

        {/* Processing/Waiting State - Show when report is not ready yet */}
        {stage === 'waiting' && reviewData && !isReportReady && (
          <div className="container mx-auto px-4 sm:px-6 mb-8">
            <div className="max-w-2xl mx-auto">
              <ResumeReportViewer
                reportUrl={reviewData.report_url || ''}
                status={reviewData.status}
                userEmail={reviewData.user_email}
                targetRole={reviewData.target_role}
              />
            </div>
          </div>
        )}

        {/* Initial Success State - Show immediately after submission */}
        {stage === 'waiting' && !reviewData && (
          <div className="container mx-auto px-4 sm:px-6 mb-8">
            <div className="max-w-2xl mx-auto">
              <Card className="bg-green-900/20 border-green-500/30 shadow-2xl">
                <CardContent className="p-6 sm:p-8 md:p-10 text-center space-y-4">
                  <CheckCircle className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-green-400 mx-auto animate-pulse" />
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    Resume Submitted Successfully! 🎉
                  </h2>
                  <p className="text-base sm:text-lg text-slate-300">
                    Thank you for submitting your resume for review.
                  </p>
                  <p className="text-sm sm:text-base text-slate-400">
                    We've sent a confirmation to <span className="text-white font-semibold">{submittedEmail}</span>
                  </p>
                  <p className="text-sm text-slate-300">
                    Our reviewers are getting started. You'll see your detailed report here once it's ready!
                  </p>
                  
                  {/* Conversion CTA Section */}
                  <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-500/30 rounded-lg p-5 sm:p-6 mt-6 space-y-5">
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      🎯 Ready to Ace Your Interview?
                    </h3>
                    <p className="text-sm sm:text-base text-slate-300">
                      While you wait for your resume review, why not practice with a <strong className="text-white">real mock interview</strong> and get personalized feedback from industry experts!
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-200 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span>Real-time interview practice</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-200 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span>Expert feedback & tips</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-200 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span>Boost confidence</span>
                      </div>
                    </div>
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-base sm:text-lg py-4 sm:py-5"
                    >
                      <Link to={`/book?source=resume-review&email=${encodeURIComponent(submittedEmail)}`}>
                        Book Your Mock Interview Now
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Link>
                    </Button>
                    <p className="text-xs text-slate-400 text-center">
                      Special offer: Resume review users get priority matching! 🚀
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      asChild
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Link to="/">Back to Home</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Link to="/pricing">View Pricing Plans</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isSubmitting && stage === 'form' && (
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <Card className="bg-white/10 border-white/20 p-8 md:p-12">
                <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-blue-400 animate-spin mx-auto mb-4" />
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Submitting Your Resume...
                </h3>
                <p className="text-slate-300 text-sm md:text-base">
                  Please wait while we process your submission
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* Form */}
        {stage === 'form' && (
          <div className="container mx-auto px-4 sm:px-6">
            <ResumeReviewForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              initialEmail={user?.email ?? undefined}
              initialName={user?.user_metadata?.full_name ?? undefined}
            />
          </div>
        )}

        {stage === 'payment' && submittedReviewId && pendingReviewInfo && user && (
          <div className="container mx-auto px-4 sm:px-6">
            <ResumeReviewPayment
              resumeReviewId={submittedReviewId}
              userId={user.id}
              userEmail={pendingReviewInfo.email}
              userName={pendingReviewInfo.name || user.user_metadata?.full_name || user.email || ''}
              onPaymentCompleted={handlePaymentCompleted}
            />
          </div>
        )}
      </div>

      <WhatsAppChat />
      <Footer />
    </div>
  );
};

export default ResumeReview;

