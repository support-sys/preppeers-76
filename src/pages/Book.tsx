
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppChat from "@/components/WhatsAppChat";
import CandidateRegistrationForm from "@/components/CandidateRegistrationForm";
import RazorpayPayment from "@/components/RazorpayPayment";
import { useToast } from "@/hooks/use-toast";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { useAuth } from "@/contexts/AuthContext";

const Book = () => {
  const [currentStep, setCurrentStep] = useState<'form' | 'payment' | 'success'>('form');
  const [formData, setFormData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { syncCandidateToGoogleSheets } = useGoogleSheets();
  const { user } = useAuth();

  const handleFormSubmit = (data: any) => {
    setFormData(data);
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    setIsLoading(true);
    try {
      // Prepare data for Google Sheets
      const candidateData = {
        name: user?.user_metadata?.full_name || user?.email || "Unknown",
        email: user?.email || "Unknown",
        experience: formData.experience,
        noticePeriod: formData.noticePeriod,
        targetRole: formData.targetRole,
        timeSlot: formData.timeSlot || "To be confirmed",
        resumeUploaded: formData.resume ? "Yes" : "No",
        resumeFileName: formData.resume?.name || "Not provided",
        paymentId: paymentData.razorpay_payment_id,
        submissionDate: new Date().toISOString()
      };

      console.log("Submitting candidate data:", candidateData);

      // Sync to Google Sheets
      const syncResult = await syncCandidateToGoogleSheets(candidateData);
      
      if (syncResult.success) {
        setCurrentStep('success');
        toast({
          title: "Booking Confirmed!",
          description: "You'll receive a GMeet link within 1 hour.",
        });
      } else {
        throw new Error("Failed to sync to Google Sheets");
      }
    } catch (error) {
      console.error("Error processing booking:", error);
      toast({
        title: "Processing Error",
        description: "Payment successful, but there was an issue processing your booking. We'll contact you soon.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error("Payment error:", error);
    toast({
      title: "Payment Failed",
      description: "There was an issue processing your payment. Please try again.",
      variant: "destructive",
    });
  };

  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-white mb-4">Booking Confirmed!</h1>
              <p className="text-xl text-slate-300 mb-8">
                Thank you for booking your mock interview. You'll receive a GMeet link within 1 hour at {user?.email}.
              </p>
              <div className="space-y-4 text-left bg-white/5 rounded-xl p-6 mb-8">
                <div className="flex justify-between">
                  <span className="text-slate-400">Experience:</span>
                  <span className="text-white">{formData?.experience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Role:</span>
                  <span className="text-white">{formData?.targetRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Notice Period:</span>
                  <span className="text-white">{formData?.noticePeriod?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time Slot:</span>
                  <span className="text-white">{formData?.timeSlot || "To be confirmed"}</span>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <Link to="/">
                  <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                    Back to Home
                  </Button>
                </Link>
                <Link to="/faq">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    View FAQ
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <WhatsAppChat />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Book Your Mock Interview
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              {currentStep === 'form' 
                ? "Fill out the form below to schedule your personalized mock interview with an experienced engineer."
                : "Complete your payment to confirm your mock interview booking."
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {currentStep === 'form' && (
                <CandidateRegistrationForm
                  onSubmit={handleFormSubmit}
                  isLoading={isLoading}
                />
              )}

              {currentStep === 'payment' && (
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl">Complete Payment</CardTitle>
                    <CardDescription className="text-slate-300">
                      Secure payment to confirm your mock interview booking.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-white/5 rounded-xl p-6">
                      <h3 className="text-white font-semibold mb-4">Booking Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target Role:</span>
                          <span className="text-white">{formData?.targetRole}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Experience:</span>
                          <span className="text-white">{formData?.experience}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Duration:</span>
                          <span className="text-white">60 minutes</span>
                        </div>
                        <hr className="border-white/20 my-3" />
                        <div className="flex justify-between text-lg font-semibold">
                          <span className="text-white">Total Amount:</span>
                          <span className="text-white">₹999</span>
                        </div>
                      </div>
                    </div>

                    <RazorpayPayment
                      amount={999}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      disabled={isLoading}
                    />

                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('form')}
                      className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
                      disabled={isLoading}
                    >
                      Back to Form
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Process Overview */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">What Happens Next?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5 ${
                      currentStep === 'form' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      1
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Fill Details</h4>
                      <p className="text-slate-300 text-sm">Provide your professional information</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5 ${
                      currentStep === 'payment' ? 'bg-blue-500' : currentStep === 'success' ? 'bg-green-500' : 'bg-gray-500'
                    }`}>
                      2
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Complete Payment</h4>
                      <p className="text-slate-300 text-sm">Secure payment via Razorpay</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Get GMeet Link</h4>
                      <p className="text-slate-300 text-sm">Receive link within 1 hour</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Join Interview</h4>
                      <p className="text-slate-300 text-sm">60-minute live session</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/faq" className="block">
                    <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10">
                      View FAQ
                    </Button>
                  </Link>
                  <Link to="/contact" className="block">
                    <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10">
                      Contact Support
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <WhatsAppChat />
      <Footer />
    </div>
  );
};

export default Book;
