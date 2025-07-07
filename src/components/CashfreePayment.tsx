
import { useState } from "react";
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
  const { toast } = useToast();

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

      console.log('Creating payment session...');

      // Store form data before payment
      console.log('Storing candidate data before payment:', candidateData);
      sessionStorage.setItem('candidateFormData', JSON.stringify(candidateData));
      sessionStorage.setItem('paymentAmount', amount.toString());
      sessionStorage.setItem('userEmail', userEmail);
      sessionStorage.setItem('userName', userName);

      // Get the current origin for return URL
      const currentOrigin = window.location.origin;
      const returnUrl = `${currentOrigin}/book?payment=success`;
      
      console.log('Using return URL:', returnUrl);

      // Create payment session using Supabase edge function
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-payment-session', {
        body: {
          amount: amount,
          currency: 'INR',
          customer_id: userEmail,
          customer_name: userName,
          customer_email: userEmail,
          order_id: `ORDER_${Date.now()}`,
          return_url: returnUrl,
          notify_url: `${currentOrigin}/supabase/functions/v1/payment-webhook`,
          metadata: {
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

      if (sessionError) {
        console.error('Error creating payment session:', sessionError);
        const errorMsg = sessionError.message || 'Failed to create payment session';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      console.log('Payment session created:', sessionData);

      if (!sessionData.payment_session_id) {
        console.error('No payment session ID received');
        const errorMsg = 'Invalid payment session response';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      // Initialize Cashfree payment
      const cashfree = new (window as any).Cashfree({
        mode: "sandbox" // Change to "production" for live environment
      });

      const checkoutOptions = {
        paymentSessionId: sessionData.payment_session_id,
        returnUrl: returnUrl
      };

      console.log('Initializing Cashfree checkout with options:', checkoutOptions);

      const result = await cashfree.checkout(checkoutOptions);
      console.log('Cashfree checkout result:', result);
      
      if (result.error) {
        console.error("Payment failed:", result.error);
        const errorMsg = result.error.message || "Payment could not be processed.";
        setError(errorMsg);
        // Clean up session storage on error
        sessionStorage.removeItem('candidateFormData');
        sessionStorage.removeItem('paymentAmount');
        sessionStorage.removeItem('userEmail');
        sessionStorage.removeItem('userName');
        onError(result.error);
        toast({
          title: "Payment Failed",
          description: errorMsg,
          variant: "destructive",
        });
      } else {
        console.log("Payment processing initiated");
        // Don't call onSuccess here - let the redirect handle it
        toast({
          title: "Payment Processing",
          description: "You will be redirected to complete the payment process.",
        });
      }

    } catch (error: any) {
      console.error("Payment initialization error:", error);
      const errorMsg = error.message || "Unable to initialize payment. Please try again.";
      setError(errorMsg);
      // Clean up session storage on error
      sessionStorage.removeItem('candidateFormData');
      sessionStorage.removeItem('paymentAmount');
      sessionStorage.removeItem('userEmail');
      sessionStorage.removeItem('userName');
      onError(error);
      toast({
        title: "Payment Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        <Button
          onClick={handlePayment}
          disabled={isLoading}
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Pay ₹{amount} & Book Interview
            </>
          )}
        </Button>

        {/* Payment Methods Info */}
        <div className="text-center text-sm text-slate-400">
          <p>We accept all major credit cards, debit cards, UPI, and net banking</p>
          <p className="mt-1">Powered by Cashfree - Secure & Reliable</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashfreePayment;
