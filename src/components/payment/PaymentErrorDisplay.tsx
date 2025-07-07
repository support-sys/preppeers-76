
import { AlertCircle } from "lucide-react";

interface PaymentErrorDisplayProps {
  error: string;
}

const PaymentErrorDisplay = ({ error }: PaymentErrorDisplayProps) => {
  return (
    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-start space-x-3">
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="text-red-400 font-medium">Payment Error</h4>
        <p className="text-red-300 text-sm mt-1">{error}</p>
      </div>
    </div>
  );
};

export default PaymentErrorDisplay;
