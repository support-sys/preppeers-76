
interface PaymentDetailsProps {
  amount: number;
  candidateData: any;
}

const PaymentDetails = ({ amount, candidateData }: PaymentDetailsProps) => {
  return (
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
  );
};

export default PaymentDetails;
