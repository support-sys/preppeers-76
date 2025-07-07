
interface PaymentSession {
  id: string;
  candidate_data: any;
  amount: number;
}

interface PaymentDetailsProps {
  paymentSession: PaymentSession;
}

const PaymentDetails = ({ paymentSession }: PaymentDetailsProps) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg border-white/20 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Your Interview Details</h2>
      <div className="space-y-3 text-slate-300">
        <div className="flex justify-between">
          <span>Target Role:</span>
          <span className="text-white">{paymentSession.candidate_data?.targetRole}</span>
        </div>
        <div className="flex justify-between">
          <span>Experience:</span>
          <span className="text-white">{paymentSession.candidate_data?.experience}</span>
        </div>
        <div className="flex justify-between">
          <span>Notice Period:</span>
          <span className="text-white">{paymentSession.candidate_data?.noticePeriod}</span>
        </div>
        <div className="flex justify-between">
          <span>Amount Paid:</span>
          <span className="text-green-400">₹{paymentSession.amount}</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
