interface PaymentDetailsProps {
  amount: number;
  candidateData: any;
  addOns?: {
    [key: string]: boolean;
  };
  appliedDiscount?: any;
  originalAmount?: number;
  selectedAddOns?: any[];
}

const PaymentDetails = ({ 
  amount, 
  candidateData, 
  addOns, 
  appliedDiscount, 
  originalAmount,
  selectedAddOns 
}: PaymentDetailsProps) => {
  // Calculate total add-on price from selected add-ons
  const totalAddOnPrice = selectedAddOns ? 
    selectedAddOns.reduce((total, addon) => total + addon.total, 0) : 0;

  const baseAmount = originalAmount || amount - totalAddOnPrice;

  return (
    <div className="bg-white/5 rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-slate-300">Mock Interview Session</span>
        <span className="text-white font-semibold">₹{baseAmount}</span>
      </div>
      
      {/* Add-ons */}
      {selectedAddOns && selectedAddOns.length > 0 && (
        <>
          {selectedAddOns.map((addon, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-slate-400">+ {addon.name}</span>
              <span className="text-blue-400">+₹{addon.total}</span>
            </div>
          ))}
        </>
      )}
      
      <div className="flex justify-between items-center">
        <span className="text-slate-300">Target Role</span>
        <span className="text-white">{candidateData?.targetRole || candidateData?.target_role}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-slate-300">Experience Level</span>
        <span className="text-white">{candidateData?.experience}</span>
      </div>
      
      {/* Discount */}
      {appliedDiscount && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-green-400">Discount ({appliedDiscount.discount_type === 'percentage' ? appliedDiscount.discount_value + '%' : '₹' + appliedDiscount.discount_value})</span>
          <span className="text-green-400">-₹{appliedDiscount.discount_amount}</span>
        </div>
      )}
      
      <hr className="border-white/20" />
      <div className="flex justify-between items-center text-lg font-semibold">
        <span className="text-white">Total Amount</span>
        <span className="text-green-400">₹{amount}</span>
      </div>
    </div>
  );
};

export default PaymentDetails;