import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import LinkedInShare from '@/components/LinkedInShare';

const PaymentProcessing = () => {
  const { paymentSession, isLoading, hasSuccessfulPayment } = usePaymentStatus();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);

  // Scroll to top when route changes
  useScrollToTop();

  useEffect(() => {
    
    // If no user, redirect to auth
    if (!user) {
      navigate('/auth');
      return;
    }

    // Debug: Log current payment session state
    console.log('🔄 Payment Processing - Current state:', {
      isLoading,
      hasPaymentSession: !!paymentSession,
      paymentStatus: paymentSession?.payment_status,
      interviewMatched: paymentSession?.interview_matched,
      paymentSessionId: paymentSession?.id,
      hasSuccessfulPayment,
      showSuccess,
      showFailure,
      isCompleted: paymentSession?.payment_status === 'completed',
      shouldShowSuccess: showSuccess || hasSuccessfulPayment || paymentSession?.payment_status === 'completed'
    });

    // If no payment session, redirect to home
    if (!isLoading && !paymentSession) {
      console.log('🔄 Redirecting to home - no payment session');
      navigate('/');
      return;
    }

    // Don't redirect if payment is successful - show success state instead
    if (!isLoading && paymentSession?.interview_matched && !hasSuccessfulPayment) {
      console.log('🔄 Redirecting to home - interview already matched but not from current payment');
      navigate('/');
      return;
    }

    // Show success message immediately after payment success
    if (hasSuccessfulPayment && !showSuccess) {
      console.log('🎉 Payment successful, showing success state!');
      console.log('🔄 Current payment session:', {
        id: paymentSession?.id,
        status: paymentSession?.payment_status,
        interviewMatched: paymentSession?.interview_matched,
        hasSuccessfulPayment
      });
      setShowSuccess(true);
      toast({
        title: "🎉 Payment Successful!",
        description: "Your interview has been automatically scheduled. Check your email for details!",
      });
    }

    // Also show success for completed payments
    if (paymentSession?.payment_status === 'completed' && !showSuccess) {
      console.log('🎉 Payment completed, showing success state!');
      setShowSuccess(true);
      toast({
        title: "🎉 Payment Successful!",
        description: "Your interview has been automatically scheduled. Check your email for details!",
      });
    }

    // Also show success if interview was matched from this payment session
    if (paymentSession?.interview_matched && hasSuccessfulPayment && !showSuccess) {
      console.log('🎉 Interview matched from successful payment, showing success state!');
      setShowSuccess(true);
      toast({
        title: "🎉 Interview Scheduled!",
        description: "Your interview has been automatically scheduled. Check your email for details!",
      });
    }

    // Show failure message if payment failed
    if (paymentSession?.payment_status === 'failed' && !showFailure) {
      console.log('❌ Payment failed, showing failure state!');
      setShowFailure(true);
      toast({
        title: "❌ Payment Failed",
        description: "Your payment could not be processed. Please try booking again.",
        variant: "destructive",
      });
    }

    // Show processing message if payment is still processing
    if (paymentSession?.payment_status === 'processing' && !showSuccess && !showFailure) {
      console.log('⏳ Payment processing, showing processing state!');
    }

    // Handle other payment statuses (pending, etc.)
    if (paymentSession?.payment_status && 
        !['completed', 'failed', 'processing'].includes(paymentSession.payment_status) && 
        !showSuccess && !showFailure) {
      console.log('⏳ Payment status:', paymentSession.payment_status, 'showing processing state!');
    }

    // Check if payment failed from webhook (status might be 'failed' or 'cancelled')
    if (paymentSession?.payment_status && 
        ['failed', 'cancelled', 'declined'].includes(paymentSession.payment_status) && 
        !showFailure) {
      console.log('❌ Payment failed from webhook, showing failure state!');
      setShowFailure(true);
      toast({
        title: "❌ Payment Failed",
        description: "Your payment could not be processed. Please try booking again.",
        variant: "destructive",
      });
    }
  }, [user, paymentSession, isLoading, navigate, hasSuccessfulPayment]);

  // No complex polling or real-time subscriptions needed

  // Handle edge cases and errors
  useEffect(() => {
    // If payment session exists but has no status after 30 seconds, show error
    if (paymentSession && !paymentSession.payment_status && !showSuccess) {
      const timeout = setTimeout(() => {
        if (!paymentSession.payment_status && !showSuccess) {
          console.log('⏰ Payment session timeout, showing error state');
          setShowFailure(true);
          toast({
            title: "⏰ Payment Timeout",
            description: "Payment processing is taking longer than expected. Please try booking again.",
            variant: "destructive",
          });
        }
      }, 30000); // 30 seconds timeout

      return () => clearTimeout(timeout);
    }

    // If payment session is in an invalid state, show error
    if (paymentSession && paymentSession.payment_status === 'invalid' && !showSuccess) {
      console.log('❌ Payment session invalid, showing error state');
      setShowFailure(true);
      toast({
        title: "❌ Invalid Payment Session",
        description: "Your payment session is invalid. Please try booking again.",
        variant: "destructive",
      });
    }
  }, [paymentSession, toast, showSuccess]);

  // Auto-booking is handled by the webhook, no manual matching needed

  // No matching loader needed - auto-booking is instant

  // Show loading state while checking payment status
  if (isLoading || !paymentSession?.payment_status) {
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
        <div className="relative z-10 flex items-center justify-center min-h-[80vh]">
          <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-slate-300 text-lg">Loading payment status...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Handle payment failure
  if (paymentSession && paymentSession.payment_status === 'failed') {
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
        <div className="relative z-10 flex items-center justify-center min-h-[80vh]">
          <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-md">
            <div className="text-red-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-400 mb-4">Payment Failed</h2>
            <p className="text-slate-300 mb-6">
              We couldn't process your payment. This could be due to insufficient funds, card restrictions, or a temporary issue.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/booking')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (showFailure) {
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
        <div className="relative z-10 flex items-center justify-center min-h-[80vh]">
          <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-md">
            <div className="text-red-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-400 mb-4">❌ Payment Failed</h2>
            <p className="text-slate-300 mb-6">
              Your payment could not be processed. This could be due to insufficient funds, card issues, or other payment problems.
            </p>
            
            <div className="text-center bg-red-500/20 rounded-lg border border-red-500/30 p-4 mb-6">
              <p className="text-red-300 text-sm">
                💡 Tip: Make sure your card has sufficient funds and try using a different payment method if the issue persists.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/book')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Try Booking Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show success state if payment was successful or interview was matched
  if (showSuccess || hasSuccessfulPayment || paymentSession?.payment_status === 'completed') {
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
        <div className="relative z-10 flex items-center justify-center min-h-[80vh]">
          <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-md">
            <div className="text-green-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-400 mb-4">🎉 Payment Successful!</h2>
            <p className="text-slate-300 mb-6">
              Your interview has been automatically scheduled! Check your email for confirmation details.
            </p>
                        {/* LinkedIn Share Section */}
                        <LinkedInShare 
              target_role={paymentSession?.candidate_data?.target_role || 'Software Developer'}
              userEmail={user?.email}
              onShareComplete={() => {
                console.log('User shared interview booking on LinkedIn');
                toast({
                  title: "Thank you for sharing!",
                  description: "Your interview guide is ready for download.",
                });
              }}
            />
            <div className="space-y-3 mb-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Payment <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Processing</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Please wait while we process your payment and prepare your interview matching.
            </p>
            <div className="mt-6 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30 max-w-md mx-auto">
              <p className="text-blue-300 text-sm">
                💡 Your interview will be automatically scheduled after payment confirmation
              </p>
            </div>
          </div>
          
          <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-md">
            <div className="text-blue-400 mb-4">
              <Loader2 className="w-16 h-16 mx-auto animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-blue-400 mb-4">🎯 Processing Payment</h2>
            <p className="text-slate-300 mb-6">
              Your payment is being processed and interview will be scheduled automatically...
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-blue-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-blue-300 text-sm">This may take a few moments...</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentProcessing;