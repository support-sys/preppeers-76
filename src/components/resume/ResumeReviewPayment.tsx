import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getResumeReviewPrice } from '@/utils/planConfig';
import { calculateDiscount, validateCoupon } from '@/utils/couponUtils';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Loader2, Tag, XCircle, ArrowLeftCircle } from 'lucide-react';

const CASHFREE_SCRIPT = 'https://sdk.cashfree.com/js/v3/cashfree.js';

const loadCashfreeSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Cashfree) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src="${CASHFREE_SCRIPT}"]`);
    if (existing) {
      const checkInterval = setInterval(() => {
        if ((window as any).Cashfree) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = CASHFREE_SCRIPT;
    script.async = true;
    script.onload = () => {
      setTimeout(() => {
        if ((window as any).Cashfree) {
          resolve();
        } else {
          reject(new Error('Cashfree SDK failed to initialize'));
        }
      }, 300);
    };
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.head.appendChild(script);
  });
};

interface ResumeReviewPaymentProps {
  resumeReviewId: string;
  userId: string;
  userEmail: string;
  userName: string;
  onPaymentCompleted: () => void;
  onBackToForm?: () => void;
}

export const ResumeReviewPayment = ({
  resumeReviewId,
  userId,
  userEmail,
  userName,
  onPaymentCompleted,
  onBackToForm
}: ResumeReviewPaymentProps) => {
  const basePrice = getResumeReviewPrice();
  const { toast } = useToast();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(basePrice);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [cashfreeReady, setCashfreeReady] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const paymentContainerRef = useRef<HTMLDivElement>(null);
  const verifyingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    loadCashfreeSDK()
      .then(() => {
        if (isMounted) setCashfreeReady(true);
      })
      .catch((sdkError) => {
        console.error('Failed to load Cashfree SDK', sdkError);
        if (isMounted) {
          setCashfreeReady(false);
          setError('Payment service is currently unavailable. Please refresh the page and try again.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const checkExistingPayment = async () => {
      const { data, error: reviewError } = await (supabase as any)
        .from('resume_reviews')
        .select('payment_status')
        .eq('id', resumeReviewId)
        .single();

      if (reviewError) {
        console.error('Failed to fetch resume review payment status', reviewError);
        return;
      }

      if (data?.payment_status === 'paid') {
        onPaymentCompleted();
      }
    };

    checkExistingPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeReviewId]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: 'Enter coupon code',
        description: 'Please enter a coupon code to apply the discount.',
        variant: 'destructive'
      });
      return;
    }

    setIsValidatingCoupon(true);
    setError(null);

    try {
      const validation = await validateCoupon(couponCode.trim(), 'resume_review', userId);

      if (!validation) {
        throw new Error('Unable to validate coupon. Please try again.');
      }

      if (!validation.is_valid) {
        toast({
          title: 'Coupon not valid',
          description: validation.message,
          variant: 'destructive'
        });
        return;
      }

      const discount = calculateDiscount(
        basePrice,
        validation.discount_type as 'percentage' | 'fixed',
        Number(validation.discount_value)
      );

      setAppliedCouponCode(couponCode.trim().toUpperCase());
      setDiscountAmount(discount.discount_amount);
      setFinalAmount(discount.final_price);

      toast({
        title: 'Coupon applied',
        description: `You saved ₹${discount.discount_amount}.`
      });
    } catch (couponError) {
      console.error('Coupon validation error:', couponError);
      toast({
        title: 'Coupon error',
        description:
          couponError instanceof Error ? couponError.message : 'Failed to validate coupon.',
        variant: 'destructive'
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCouponCode(null);
    setDiscountAmount(0);
    setFinalAmount(basePrice);
    toast({
      title: 'Coupon removed',
      description: 'The discount has been removed.'
    });
  };

  const pollForPayment = async (attempts = 8) => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    try {
      for (let i = 0; i < attempts; i += 1) {
        const { data, error: fetchError } = await (supabase as any)
          .from('resume_reviews')
          .select('payment_status')
          .eq('id', resumeReviewId)
          .single();

        if (fetchError) {
          console.warn('Failed to poll payment status', fetchError);
        } else if (data?.payment_status === 'paid') {
          onPaymentCompleted();
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      toast({
        title: 'Payment processing',
        description:
          'We are still finalising your payment. You will receive a confirmation email shortly.',
      });
    } finally {
      verifyingRef.current = false;
    }
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    setError(null);
    setStatusMessage(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'resume-review-create-payment',
        {
          body: {
            resumeReviewId,
            couponCode: appliedCouponCode ?? (couponCode.trim() || undefined)
          }
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message || 'Unable to start payment');
      }

      if (!data) {
        throw new Error('Invalid response from payment service');
      }

      if (typeof data.amount === 'number') {
        setFinalAmount(data.amount);
      }
      if (typeof data.discountAmount === 'number') {
        setDiscountAmount(data.discountAmount);
      }

      if (!data.paymentRequired) {
        toast({
          title: 'Payment complete',
          description: 'Coupon covered the full amount.'
        });
        await pollForPayment(3);
        onPaymentCompleted();
        return;
      }

      if (!cashfreeReady) {
        throw new Error('Payment service is not ready. Please refresh the page and try again.');
      }

      if (!data.paymentSessionId) {
        throw new Error('Missing payment session ID from Cashfree');
      }

      setPaymentSessionId(data.paymentSessionId);
      setOrderId(data.orderId ?? null);
      setCheckoutVisible(true);

      const isDevelopment =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.endsWith('.local');

      const cashfree = new (window as any).Cashfree({
        mode: isDevelopment ? 'sandbox' : 'production'
      });

      setStatusMessage('Secure checkout opened. Complete the payment to continue.');

      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        container: paymentContainerRef.current,
        onSuccess: async () => {
          toast({
            title: 'Payment successful',
            description: 'Verifying your payment. This may take a few seconds.'
          });
          setStatusMessage('Payment successful. Verifying...');
          await pollForPayment();
        },
        onFailure: () => {
          setError('Payment was cancelled or failed. Please try again.');
          setCheckoutVisible(false);
        }
      });
    } catch (paymentError) {
      console.error('Payment error:', paymentError);
      setError(paymentError instanceof Error ? paymentError.message : String(paymentError));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl max-w-2xl mx-auto">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl font-semibold text-white">Complete Payment</CardTitle>
        <p className="text-slate-300">
          Pay a one-time fee to initiate your expert resume review.
        </p>
        <p className="text-xs text-slate-400">
          Logged in as <span className="text-slate-200 font-medium">{userEmail}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-slate-200">
            <span>Resume Review Fee</span>
            <span>₹{basePrice}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <span>Coupon Discount</span>
            <span>-₹{discountAmount}</span>
          </div>
          <div className="flex items-center justify-between text-lg font-semibold text-white border-t border-slate-700 pt-3">
            <span>Amount Payable</span>
            <span>₹{finalAmount}</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Have a coupon?
          </label>
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="Enter coupon code"
              disabled={!!appliedCouponCode || isValidatingCoupon || isProcessingPayment}
              className="bg-slate-800 border-slate-700 text-slate-100"
            />
            {!appliedCouponCode ? (
              <Button
                type="button"
                variant="outline"
                disabled={isValidatingCoupon || isProcessingPayment}
                onClick={handleApplyCoupon}
                className="border-blue-400 text-blue-300 hover:bg-blue-500/10"
              >
                {isValidatingCoupon ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  'Apply'
                )}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={isProcessingPayment}
                onClick={handleRemoveCoupon}
                className="border-red-400 text-red-300 hover:bg-red-500/10"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
          {appliedCouponCode && (
            <div className="flex items-center gap-2 text-emerald-300 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Coupon {appliedCouponCode} applied successfully.
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-200 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {statusMessage && (
          <div className="bg-blue-500/10 border border-blue-500/40 text-blue-200 text-sm rounded-lg p-3">
            {statusMessage}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {onBackToForm && (
            <Button
              type="button"
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-slate-800/60"
              onClick={onBackToForm}
              disabled={isProcessingPayment}
            >
              <ArrowLeftCircle className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            type="button"
            onClick={handlePayment}
            disabled={isProcessingPayment}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3"
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              `Pay ₹${finalAmount}`
            )}
          </Button>
        </div>

        {checkoutVisible && (
          <div className="border border-slate-700 rounded-lg p-4 bg-slate-900/60">
            <p className="text-sm text-slate-300 mb-3">
              Complete the secure payment below. Payment Session: {paymentSessionId}
              {orderId ? ` · Order: ${orderId}` : ''}
            </p>
            <div ref={paymentContainerRef} className="w-full min-h-[420px]" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumeReviewPayment;


