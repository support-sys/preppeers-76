import React, { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppChat from "@/components/WhatsAppChat";
import CashfreePayment from "@/components/CashfreePayment";
import CouponInput from "@/components/CouponInput";
import AvailableCoupons from "@/components/AvailableCoupons";
import { getPlanById } from "@/utils/planConfig";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { DiscountCalculation } from "@/utils/couponUtils";

interface PaymentPageProps {
  formData: any;
  userEmail: string;
  userName: string;
  userId?: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
}

interface AddOnSelection {
  [key: string]: boolean;
}

const PaymentPage = ({ formData, userEmail, userName, userId, onSuccess, onError }: PaymentPageProps) => {
  const selectedPlan = getPlanById(formData.selected_plan || 'professional');
  const originalAmount = formData.amount || selectedPlan?.discountedPrice || 799;
  const [finalAmount, setFinalAmount] = useState(originalAmount);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCalculation | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');
  const [externalCouponCode, setExternalCouponCode] = useState<string>('');
  const [addOns, setAddOns] = useState<AddOnSelection>({});

  // Scroll to top when component mounts
  useScrollToTop();

  // Calculate total add-ons price from the CouponInput component
  // This will be updated by the onAddOnsChange callback
  const [totalAddOnPrice, setTotalAddOnPrice] = useState(0);

  // Calculate final amount including add-ons and discount
  const baseAmount = originalAmount + totalAddOnPrice;
  const finalAmountWithDiscount = appliedDiscount ? appliedDiscount.final_price + totalAddOnPrice : baseAmount;

  const handleCouponApplied = (discount: DiscountCalculation | null, couponCode?: string) => {
    setAppliedDiscount(discount);
    setAppliedCouponCode(couponCode || '');
    const newBaseAmount = originalAmount + totalAddOnPrice;
    setFinalAmount(discount ? discount.final_price + totalAddOnPrice : newBaseAmount);
  };

  const handleAddOnsChange = (newAddOns: AddOnSelection, newTotalAddOnPrice: number) => {
    setAddOns(newAddOns);
    setTotalAddOnPrice(newTotalAddOnPrice);
    const newBaseAmount = originalAmount + newTotalAddOnPrice;
    setFinalAmount(appliedDiscount ? appliedDiscount.final_price + newTotalAddOnPrice : newBaseAmount);
  };

  const handleCouponSelect = (couponName: string) => {
    setExternalCouponCode(couponName);
  };

  const handleExternalCouponCodeChange = () => {
    // Reset the external coupon code after it's been applied
    setExternalCouponCode('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto bg-slate-800/70 backdrop-blur-lg rounded-xl shadow-2xl p-8 border border-slate-700">
          <h1 className="text-4xl font-bold text-center mb-6 text-blue-400">Interview Payment</h1>
          
          {/* Plan Details Header */}
          {selectedPlan && (
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/50 rounded-lg p-6 mb-8 text-center">
              <h2 className="text-2xl font-bold text-blue-200 mb-2">
                Plan: {selectedPlan.name} • {selectedPlan.duration} minutes
              </h2>
              <p className="text-blue-100 text-lg">{selectedPlan.shortDescription}</p>
            </div>
          )}
          
          <p className="text-center text-slate-300 mb-8">
            Securely complete your payment for the mock interview session.
          </p>

          {/* Available Coupons Section */}
          <AvailableCoupons
            planType={formData.selected_plan || 'professional'}
            onCouponSelect={handleCouponSelect}
          />

          {/* Coupon Input and Add-ons Section */}
          <div className="mt-6">
            <CouponInput
              originalPrice={originalAmount}
              planType={formData.selected_plan || 'professional'}
              userId={userId}
              onCouponApplied={handleCouponApplied}
              externalCouponCode={externalCouponCode}
              onExternalCouponCodeChange={handleExternalCouponCodeChange}
              onAddOnsChange={handleAddOnsChange}
            />
          </div>

          <div className="mt-8">
            <CashfreePayment
              amount={finalAmount}
              candidateData={formData}
              userEmail={userEmail}
              userName={userName}
              onSuccess={onSuccess}
              onError={onError}
              selectedPlan={selectedPlan}
              appliedDiscount={appliedDiscount}
              appliedCouponCode={appliedCouponCode}
              addOns={{
                resumeReview: addOns.resume_review || false,
                meetingRecording: addOns.meeting_recording || false
              }}
            />
          </div>
        </div>
      </div>
      
      <WhatsAppChat />
      <Footer />
    </div>
  );
};

export default PaymentPage;