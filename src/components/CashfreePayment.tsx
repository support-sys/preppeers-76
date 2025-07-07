
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePaymentStatusPolling } from "@/hooks/usePaymentStatusPolling";
import PaymentErrorDisplay from "./payment/PaymentErrorDisplay";
import PaymentDetails from "./payment/PaymentDetails";
import PaymentSecurityFeatures from "./payment/PaymentSecurityFeatures";
import PaymentButton from "./payment/PaymentButton";
import PaymentMethodsInfo from "./payment/PaymentMethodsInfo";
import PaymentContainer from "./payment/PaymentContainer";

interface CashfreePaymentProps {
  amount: number;
  candidateData: any;
  userEmail: string;
  userName: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
}

const CashfreePayment = ({ 
  amount, 
  candidateData, 
  userEmail, 
  userName, 
  onSuccess, 
  onError 
}: CashfreePaymentProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const paymentContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Use the polling hook for payment status
  const { isPolling, startPolling, manualStatusCheck } = usePaymentStatusPolling(paymentSessionId);

  const createPaymentSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create payment session in database
      const { data: sessionData, error: sessionError } = await supabase
        .from('payment_sessions')
        .insert({
          user_id: user.id,
          candidate_data: candidateData,
          amount: amount,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      console.log('Payment session created in database:', sessionData);
      setPaymentSessionId(sessionData.id);
      return sessionData;
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

      // Check if Cashfree SDK is loaded
      if (!(window as any).Cashfree) {
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
          order_id: `ORDER_${dbSession.id}`,
          return_url: `${window.location.origin}/book?payment=success&session_id=${dbSession.id}`,
          notify_url: `https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/payment-webhook`,
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
        
        const errorMsg = cashfreeError.message || 'Failed to create payment session';
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
        
        const errorMsg = 'Invalid payment session response';
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
        mode: "sandbox" // Change to "production" for live environment
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
          
          const errorMsg = error.message || "Payment could not be processed.";
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
          {/* Error Display */}
          {error && <PaymentErrorDisplay error={error} />}

          {/* Payment Details */}
          <PaymentDetails amount={amount} candidateData={candidateData} />

          {/* Security Features */}
          <PaymentSecurityFeatures />

          {/* Payment Button */}
          {!showPaymentForm && (
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
