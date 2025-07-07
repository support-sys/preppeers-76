
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface PaymentSuccessMessageProps {
  amount: number;
  onStartMatching: () => void;
}

const PaymentSuccessMessage = ({ amount, onStartMatching }: PaymentSuccessMessageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <CardTitle className="text-white text-2xl">Payment Successful!</CardTitle>
          <CardDescription className="text-slate-300">
            Your payment of ₹{amount} has been processed successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
            <h3 className="text-green-400 font-semibold mb-2">Next Step</h3>
            <p className="text-slate-300 text-sm">
              Click the button below to start the instant matching process and find your perfect interviewer!
            </p>
          </div>

          <Button
            onClick={onStartMatching}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold"
          >
            Start Instant Matching
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          <div className="text-center">
            <Link to="/" className="text-slate-400 hover:text-white text-sm underline">
              Go to Homepage
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessMessage;
