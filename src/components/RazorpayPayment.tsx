
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RazorpayPaymentProps {
  amount: number;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
  disabled?: boolean;
}

const RazorpayPayment = ({ amount, onSuccess, onError, disabled = false }: RazorpayPaymentProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setIsLoading(true);

      // Check if Razorpay is loaded
      if (!(window as any).Razorpay) {
        toast({
          title: "Payment Error",
          description: "Payment service is not available. Please try again later.",
          variant: "destructive",
        });
        return;
      }

      const options = {
        key: "rzp_test_your_key_here", // You'll need to replace this with your actual Razorpay key
        amount: amount * 100, // Razorpay expects amount in paise
        currency: "INR",
        name: "Mock Interview Platform",
        description: "Mock Interview Session",
        handler: function (response: any) {
          console.log("Payment successful:", response);
          onSuccess(response);
          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully!",
          });
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      
      razorpay.on('payment.failed', function (response: any) {
        console.error("Payment failed:", response);
        onError(response.error);
        toast({
          title: "Payment Failed",
          description: response.error.description || "Payment could not be processed.",
          variant: "destructive",
        });
        setIsLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      onError(error);
      toast({
        title: "Payment Error",
        description: "Unable to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      size="lg"
      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5 mr-2" />
          Pay ₹{amount}
        </>
      )}
    </Button>
  );
};

export default RazorpayPayment;
