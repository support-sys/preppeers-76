
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2, Shield, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setIsLoading(true);

      // Check if Cashfree SDK is loaded
      if (!(window as any).Cashfree) {
        toast({
          title: "Payment Service Unavailable",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }

      // Create payment session
      const response = await fetch('/api/create-payment-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'INR',
          customer_id: userEmail,
          customer_name: userName,
          customer_email: userEmail,
          order_id: `ORDER_${Date.now()}`,
          return_url: `${window.location.origin}/book`,
          notify_url: `${window.location.origin}/api/payment-webhook`,
          metadata: {
            candidate_data: candidateData,
            user_email: userEmail,
            user_name: userName
          }
        }),
      });

      const sessionData = await response.json();

      if (!response.ok) {
        throw new Error(sessionData.message || 'Failed to create payment session');
      }

      // Initialize Cashfree payment
      const cashfree = new (window as any).Cashfree({
        mode: "sandbox" // Change to "production" for live environment
      });

      const checkoutOptions = {
        paymentSessionId: sessionData.payment_session_id,
        returnUrl: `${window.location.origin}/book`,
      };

      cashfree.checkout(checkoutOptions).then((result: any) => {
        if (result.error) {
          console.error("Payment failed:", result.error);
          onError(result.error);
          toast({
            title: "Payment Failed",
            description: result.error.message || "Payment could not be processed.",
            variant: "destructive",
          });
        } else if (result.redirect) {
          console.log("Payment requires redirect");
          // Handle redirect if needed
        } else {
          console.log("Payment successful:", result.paymentDetails);
          onSuccess(result.paymentDetails);
          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully!",
          });
        }
      }).catch((error: any) => {
        console.error("Payment error:", error);
        onError(error);
        toast({
          title: "Payment Error",
          description: "Unable to process payment. Please try again.",
          variant: "destructive",
        });
      }).finally(() => {
        setIsLoading(false);
      });

    } catch (error) {
      console.error("Payment initialization error:", error);
      onError(error);
      toast({
        title: "Payment Error",
        description: "Unable to initialize payment. Please try again.",
        variant: "destructive",
      });
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
        {/* Payment Details */}
        <div className="bg-white/5 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Mock Interview Session</span>
            <span className="text-white font-semibold">₹{amount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Target Role</span>
            <span className="text-white">{candidateData?.targetRole}</span>
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
