
interface PaymentSession {
  id: string;
  candidate_data: any;
  amount: number;
  selected_plan?: string | null;
  interview_duration?: number | null;
  plan_details?: any | null;
  matched_interviewer?: any | null;
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
        {paymentSession.selected_plan && (
          <div className="flex justify-between">
            <span>Selected Plan:</span>
            <span className="text-white capitalize">{paymentSession.selected_plan}</span>
          </div>
        )}
        {paymentSession.interview_duration && (
          <div className="flex justify-between">
            <span>Session Duration:</span>
            <span className="text-white">{paymentSession.interview_duration} minutes</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDetails;
