
import { Shield, Clock, CheckCircle } from "lucide-react";

const PaymentSecurityFeatures = () => {
  return (
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
  );
};

export default PaymentSecurityFeatures;
