
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2, Shield, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
          notify_url: `${window.location.origin}/supabase/functions/v1/payment-webhook`,
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

      if (!cashfreeData.payment_session_id) {
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
            // Update payment session status to successful
            await supabase
              .from('payment_sessions')
              .update({ 
                payment_status: 'successful',
                cashfree_payment_id: data.payment_id || data.order_id
              })
              .eq('id', dbSession.id);
            
            onSuccess(data);
            
            toast({
              title: "Payment Successful!",
              description: "Your payment has been processed successfully.",
            });
          } catch (updateError) {
            console.error('Error updating payment status:', updateError);
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
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-red-400 font-medium">Payment Error</h4>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Mock Interview Session</span>
              <span className="text-white font-semibold">₹{amount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Target Role</span>
              <span className="text-white">{candidateData?.targetRole || candidateData?.target_role}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Experience Level</span>
              <span className="text-white">{candidateData?.experience}</span>
            </div>
            <hr className="border-white/20" />
            <div className="flex justify-between items-center text-lg font-semibold">
              <span className="text-white">Total Amount</span>
              <span className="text-green-400">₹{amount}</span>
            </div>
          </div>

          {/* Security Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 text-slate-300">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-sm">Secure Payment</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-sm">Instant Matching</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm">Guaranteed Session</span>
            </div>
          </div>

          {/* Payment Button */}
          {!showPaymentForm && (
            <Button
              onClick={handlePayment}
              disabled={isLoading}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Payment Session...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay ₹{amount} & Book Interview
                </>
              )}
            </Button>
          )}

          {/* Payment Methods Info */}
          <div className="text-center text-sm text-slate-400">
            <p>We accept all major credit cards, debit cards, UPI, and net banking</p>
            <p className="mt-1">Powered by Cashfree - Secure & Reliable</p>
          </div>
        </CardContent>
      </Card>

      {/* Embedded Payment Container */}
      {showPaymentForm && (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-xl">Complete Your Payment</CardTitle>
            <CardDescription className="text-slate-300">
              Choose your preferred payment method below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={paymentContainerRef}
              className="min-h-[400px] bg-white rounded-lg"
              style={{ width: '100%' }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CashfreePayment;
