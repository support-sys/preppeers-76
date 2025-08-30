
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePaymentStatusPolling } from "@/hooks/usePaymentStatusPolling";
import PaymentErrorDisplay from "./payment/PaymentErrorDisplay";
import PaymentDetails from "./payment/PaymentDetails";
import PaymentSecurityFeatures from "./payment/PaymentSecurityFeatures";
import PaymentButton from "./payment/PaymentButton";
import PaymentMethodsInfo from "./payment/PaymentMethodsInfo";
import PaymentContainer from "./payment/PaymentContainer";
import { AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import { InterviewPlan } from "@/utils/planConfig";

interface CashfreePaymentProps {
  amount: number;
  candidateData: any;
  userEmail: string;
  userName: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
  selectedPlan?: InterviewPlan;
}

// Cashfree SDK loading utility
const loadCashfreeSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).Cashfree) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="cashfree.js"]')) {
      const checkLoaded = setInterval(() => {
        if ((window as any).Cashfree) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => {
      // Wait a bit more for initialization
      setTimeout(() => {
        if ((window as any).Cashfree) {
          resolve();
        } else {
          reject(new Error('Cashfree SDK failed to initialize'));
        }
      }, 500);
    };
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.head.appendChild(script);
  });
};

const CashfreePayment = ({ 
  amount, 
  candidateData, 
  userEmail, 
  userName, 
  onSuccess, 
  onError,
  selectedPlan 
}: CashfreePaymentProps) => {
  // Helper function to parse human-readable time slot to date
  const parseTimeSlotToDate = (timeSlot: string): string | null => {
    try {
      // Handle format: "Monday, 08/09/2025 17:00-17:30"
      const match = timeSlot.match(/(\w+), (\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
      if (match) {
        const [, day, date, month, year, hour, minute] = match;
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(date), parseInt(hour), parseInt(minute));
        return dateObj.toISOString().split('T')[0];
      }
      return null;
    } catch (error) {
      console.error('Error parsing time slot:', error);
      return null;
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const paymentContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Use the polling hook for payment status
  const { isPolling, startPolling, manualStatusCheck } = usePaymentStatusPolling(paymentSessionId);

  // Load Cashfree SDK on component mount
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        await loadCashfreeSDK();
        setSdkLoaded(true);
        console.log('Cashfree SDK loaded successfully');
      } catch (error) {
        console.error('Failed to load Cashfree SDK:', error);
        setError('Payment service is not available. Please refresh the page and try again.');
      }
    };

    initializeSDK();
  }, []);

  const createPaymentSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user's mobile number from metadata or candidate data
      let userMobile = user.user_metadata?.mobile_number || candidateData?.mobileNumber || candidateData?.mobile_number;
      
      // Validate and format phone number for Cashfree
      if (userMobile) {
        // Remove any non-numeric characters
        userMobile = userMobile.replace(/\D/g, '');
        
        // Ensure it's a valid Indian mobile number format
        if (userMobile.length === 10) {
          userMobile = '+91' + userMobile; // Add India country code
        } else if (userMobile.length === 12 && userMobile.startsWith('91')) {
          userMobile = '+' + userMobile; // Add + prefix
        } else if (userMobile.length === 13 && userMobile.startsWith('+91')) {
          // Already in correct format
        } else {
          // Invalid format, use a default placeholder
          userMobile = '+919999999999'; // Default placeholder
        }
      } else {
        // No phone number available, use default
        userMobile = '+919999999999';
      }

      // Create payment session in database
      console.log('selectedPlan object:', selectedPlan);
      console.log('selectedPlan.id:', selectedPlan?.id);
      console.log('selectedPlan.duration:', selectedPlan?.duration);
      
      const paymentSessionData = {
        user_id: user.id,
        candidate_data: candidateData,
        amount: amount,
        selected_plan: selectedPlan?.id || 'professional',
        interview_duration: selectedPlan?.duration || 60,
        plan_details: selectedPlan as any,
        payment_status: 'pending',
        matched_interviewer: candidateData.matchedInterviewer || null,
        interviewer_id: candidateData.matchedInterviewer?.id || null,
        selected_time_slot: candidateData.timeSlot || null,
        selected_date: candidateData.timeSlot ? parseTimeSlotToDate(candidateData.timeSlot) : null,
        plan_duration: candidateData.interviewDuration || 60,
        match_score: candidateData.matchedInterviewer?.matchScore || null
      };
      
      console.log('Creating payment session with data:', paymentSessionData);
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('payment_sessions')
        .insert(paymentSessionData)
        .select()
        .single();

      if (sessionError) {
        console.error('Database session creation error:', sessionError);
        throw new Error(`Failed to create payment session: ${sessionError.message}`);
      }

      console.log('Payment session created in database:', sessionData);
      console.log('User mobile number:', userMobile);
      
      setPaymentSessionId(sessionData.id);
      return { ...sessionData, userMobile };
    } catch (error: any) {
      console.error('Error creating payment session:', error);
      throw error;
    }
  };

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Starting payment process...');

      // Check if we have a matched interviewer
      if (!candidateData.matchedInterviewer) {
        const errorMsg = "No interviewer selected. Please go back and select an interviewer first.";
        setError(errorMsg);
        toast({
          title: "No Interviewer Selected",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      // Check if Cashfree SDK is loaded
      if (!sdkLoaded) {
        console.error('Cashfree SDK not loaded');
        const errorMsg = "Payment service is not available. Please refresh the page and try again.";
        setError(errorMsg);
        toast({
          title: "Payment Service Unavailable",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      // Create payment session in database first
      const dbSession = await createPaymentSession();

      console.log('Creating Cashfree payment session...');

      // Create payment session using Supabase edge function
      const { data: cashfreeData, error: cashfreeError } = await supabase.functions.invoke('create-payment-session', {
        body: {
          amount: amount,
          currency: 'INR',
          customer_id: userEmail,
          customer_name: userName,
          customer_email: userEmail,
          customer_phone: dbSession.userMobile,
          order_id: `ORDER_${dbSession.id}`,
          return_url: `${window.location.origin}/book?payment=success&session_id=${dbSession.id}`,
          notify_url: `https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/payment-webhook`,
          selected_plan: selectedPlan?.id || 'professional',
          plan_details: selectedPlan,
          metadata: {
            payment_session_id: dbSession.id,
            candidate_data: {
              target_role: candidateData?.targetRole || candidateData?.target_role || '',
              experience: candidateData?.experience || '',
              noticePeriod: candidateData?.noticePeriod || candidateData?.notice_period || ''
            },
            user_email: userEmail,
            user_name: userName
          }
        }
      });

      if (cashfreeError) {
        console.error('Error creating Cashfree session:', cashfreeError);
        
        // Update payment session status to failed
        await supabase
          .from('payment_sessions')
          .update({ payment_status: 'failed' })
          .eq('id', dbSession.id);
        
        const errorMsg = cashfreeError.message || 'Failed to create payment session. Please check your internet connection and try again.';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      console.log('Cashfree session created:', cashfreeData);

      if (!cashfreeData?.payment_session_id) {
        console.error('No payment session ID received from Cashfree');
        await supabase
          .from('payment_sessions')
          .update({ payment_status: 'failed' })
          .eq('id', dbSession.id);
        
        const errorMsg = 'Invalid payment session response. Please try again.';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      // Update database with Cashfree order ID
      await supabase
        .from('payment_sessions')
        .update({ 
          cashfree_order_id: cashfreeData.order_id,
          payment_status: 'processing'
        })
        .eq('id', dbSession.id);

      // Start polling for payment status updates
      startPolling();

      // Initialize Cashfree payment with embedded checkout
      const cashfree = new (window as any).Cashfree({
        // mode: "production"
          mode: "sandbox"
      });

      // Show payment form container
      setShowPaymentForm(true);

      const checkoutOptions = {
        paymentSessionId: cashfreeData.payment_session_id,
        container: paymentContainerRef.current,
        onSuccess: async (data: any) => {
          console.log("Payment successful:", data);
          
          try {
            // First try to update the status directly
            await supabase
              .from('payment_sessions')
              .update({ 
                payment_status: 'successful',
                cashfree_payment_id: data.payment_id || data.order_id
              })
              .eq('id', dbSession.id);
            
            // Also check status manually after a short delay
            setTimeout(async () => {
              const updatedSession = await manualStatusCheck();
              if (updatedSession?.payment_status === 'successful') {
                onSuccess(data);
                toast({
                  title: "Payment Successful!",
                  description: "Your payment has been processed successfully.",
                });
              }
            }, 2000);
            
          } catch (updateError) {
            console.error('Error updating payment status:', updateError);
            // Still call onSuccess as payment was successful
            onSuccess(data);
          }
        },
        onFailure: async (error: any) => {
          console.error("Payment failed:", error);
          
          try {
            // Update payment status to failed
            await supabase
              .from('payment_sessions')
              .update({ payment_status: 'failed' })
              .eq('id', dbSession.id);
          } catch (updateError) {
            console.error('Error updating payment status:', updateError);
          }
          
          const errorMsg = error.message || "Payment could not be processed. Please try again.";
          setError(errorMsg);
          
          onError(error);
          toast({
            title: "Payment Failed",
            description: errorMsg,
            variant: "destructive",
          });
          
          setShowPaymentForm(false);
        }
      };

      console.log('Initializing embedded Cashfree checkout...');
      await cashfree.checkout(checkoutOptions);

    } catch (error: any) {
      console.error("Payment initialization error:", error);
      const errorMsg = error.message || "Unable to initialize payment. Please try again.";
      setError(errorMsg);
      
      onError(error);
      toast({
        title: "Payment Error",
        description: errorMsg,
        variant: "destructive",
      });
      
      setShowPaymentForm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
    handlePayment();
  };

  const handleRefreshSDK = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await loadCashfreeSDK();
      setSdkLoaded(true);
      toast({
        title: "SDK Reloaded",
        description: "Payment service is now available.",
      });
    } catch (error) {
      setError('Failed to reload payment service. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-white text-2xl">Interview Payment</CardTitle>
          <CardDescription className="text-slate-300">
            Secure payment for your mock interview session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SDK Status */}
          {!sdkLoaded && !error && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-yellow-400 animate-spin" />
              <p className="text-yellow-400 text-sm">
                Loading payment service...
              </p>
            </div>
          )}

          {sdkLoaded && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-400 text-sm">
                Payment service ready
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="text-red-400 font-semibold">Payment Error</h3>
              </div>
              <p className="text-red-300 text-sm mb-4">{error}</p>
              <div className="flex gap-2">
                <Button 
                  onClick={handleRetry} 
                  disabled={isLoading}
                  variant="outline" 
                  size="sm"
                  className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                >
                  {isLoading ? 'Retrying...' : 'Try Again'}
                </Button>
                <Button 
                  onClick={handleRefreshSDK} 
                  disabled={isLoading}
                  variant="outline" 
                  size="sm"
                  className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
                >
                  Reload Payment Service
                </Button>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <PaymentDetails amount={amount} candidateData={candidateData} />

          {/* Security Features */}
          <PaymentSecurityFeatures />

          {/* Payment Button */}
          {!showPaymentForm && sdkLoaded && !error && (
            <PaymentButton
              isLoading={isLoading || isPolling}
              amount={amount}
              onPayment={handlePayment}
            />
          )}

          {/* Polling Status */}
          {isPolling && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
              <p className="text-blue-400 text-sm">
                Checking payment status... Please wait.
              </p>
            </div>
          )}

          {/* Payment Methods Info */}
          <PaymentMethodsInfo />
        </CardContent>
      </Card>

      {/* Embedded Payment Container */}
      <PaymentContainer 
        showPaymentForm={showPaymentForm} 
        paymentContainerRef={paymentContainerRef}
      />
    </div>
  );
};

export default CashfreePayment;
