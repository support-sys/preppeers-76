
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";

interface PaymentButtonProps {
  isLoading: boolean;
  amount: number;
  onPayment: () => void;
}

const PaymentButton = ({ isLoading, amount, onPayment }: PaymentButtonProps) => {
  return (
    <Button
      onClick={onPayment}
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
  );
};

export default PaymentButton;
