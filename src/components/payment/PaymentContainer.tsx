
import { forwardRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentContainerProps {
  showPaymentForm: boolean;
  paymentContainerRef?: React.RefObject<HTMLDivElement>;
}

const PaymentContainer = forwardRef<HTMLDivElement, PaymentContainerProps>(
  ({ showPaymentForm, paymentContainerRef }, ref) => {
    if (!showPaymentForm) return null;

    return (
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-white text-xl">Complete Your Payment</CardTitle>
          <CardDescription className="text-slate-300">
            Choose your preferred payment method below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            ref={paymentContainerRef || ref}
            className="min-h-[400px] bg-white rounded-lg"
            style={{ width: '100%' }}
          />
        </CardContent>
      </Card>
    );
  }
);

PaymentContainer.displayName = "PaymentContainer";

export default PaymentContainer;
