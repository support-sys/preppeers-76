
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppChat from "@/components/WhatsAppChat";
import CashfreePayment from "@/components/CashfreePayment";

interface PaymentPageProps {
  formData: any;
  userEmail: string;
  userName: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
}

const PaymentPage = ({ formData, userEmail, userName, onSuccess, onError }: PaymentPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Complete Your Payment
            </h1>
            <p className="text-xl text-slate-300">
              Secure your mock interview session for just ₹999
            </p>
          </div>

          <CashfreePayment
            amount={999}
            candidateData={formData}
            userEmail={userEmail}
            userName={userName}
            onSuccess={onSuccess}
            onError={onError}
          />
        </div>
      </div>
      
      <WhatsAppChat />
      <Footer />
    </div>
  );
};

export default PaymentPage;
