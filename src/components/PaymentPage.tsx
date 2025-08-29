
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppChat from "@/components/WhatsAppChat";
import CashfreePayment from "@/components/CashfreePayment";
import { getPlanById } from "@/utils/planConfig";

interface PaymentPageProps {
  formData: any;
  userEmail: string;
  userName: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
  onGoBack?: () => void;
}

const PaymentPage = ({ formData, userEmail, userName, onSuccess, onError, onGoBack }: PaymentPageProps) => {
  const selectedPlan = getPlanById(formData.selectedPlan || 'professional');
  const amount = formData.amount || selectedPlan?.price || 999;

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

          {/* Back Button */}
          {onGoBack && (
            <div className="text-center mb-6">
              <button
                onClick={onGoBack}
                className="text-blue-400 hover:text-blue-300 underline text-sm"
              >
                ← Go Back to Interviewer Selection
              </button>
            </div>
          )}

          <CashfreePayment
            amount={amount}
            candidateData={formData}
            userEmail={userEmail}
            userName={userName}
            onSuccess={onSuccess}
            onError={onError}
            selectedPlan={selectedPlan}
          />
        </div>
      </div>
      
      <WhatsAppChat />
      <Footer />
    </div>
  );
};

export default PaymentPage;
