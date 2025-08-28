
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const InterviewerPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const interviewerData = location.state?.interviewerData;

  const [paymentData, setPaymentData] = useState({
    paymentMethod: "",
    upiId: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    panNumber: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentMethodChange = (value: string) => {
    setPaymentData(prev => ({ ...prev, paymentMethod: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentData.paymentMethod) {
      toast({
        title: "Missing Payment Method",
        description: "Please select a payment method.",
        variant: "destructive",
      });
      return;
    }

    if (paymentData.paymentMethod === "upi" && !paymentData.upiId) {
      toast({
        title: "Missing UPI ID",
        description: "Please enter your UPI ID.",
        variant: "destructive",
      });
      return;
    }

    if (paymentData.paymentMethod === "bank" && (!paymentData.accountNumber || !paymentData.ifscCode || !paymentData.accountHolderName)) {
      toast({
        title: "Missing Bank Details",
        description: "Please fill in all bank account details.",
        variant: "destructive",
      });
      return;
    }

    const completeData = {
      ...interviewerData,
      ...paymentData
    };

    console.log("Complete interviewer application:", completeData);
    setIsSubmitted(true);
    
    toast({
      title: "Application Submitted!",
      description: "We'll review your profile and contact you within 24 hours.",
    });
  };

  // Redirect if no interviewer data
  if (!interviewerData) {
    navigate('/interviewers');
    return null;
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-white mb-4">Application Submitted!</h1>
              <p className="text-xl text-slate-300 mb-8">
                Thank you for your interest in becoming an interviewer. We'll review your profile and contact you within 24 hours at {interviewerData.email}.
              </p>
              <Link to="/">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
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
            <Link to="/interviewers" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Application
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Payment Details
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Complete your application by providing payment details for receiving interview session payments.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Form */}
                            <div className="lg:col-span-2" style={{ gridColumn: 'span 2' }}>
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-2xl">Payment Information</CardTitle>
                  <CardDescription className="text-slate-300">
                    Choose your preferred payment method for receiving interview session payments.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label className="text-white">Payment Method *</Label>
                      <Select value={paymentData.paymentMethod} onValueChange={handlePaymentMethodChange}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="upi" className="text-white hover:bg-slate-700">
                            UPI (Recommended)
                          </SelectItem>
                          <SelectItem value="bank" className="text-white hover:bg-slate-700">
                            Bank Transfer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentData.paymentMethod === "upi" && (
                      <div>
                        <Label htmlFor="upiId" className="text-white">UPI ID *</Label>
                        <Input
                          id="upiId"
                          name="upiId"
                          value={paymentData.upiId}
                          onChange={handleInputChange}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                          placeholder="yourname@paytm / yourname@gpay"
                          required
                        />
                      </div>
                    )}

                    {paymentData.paymentMethod === "bank" && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="accountHolderName" className="text-white">Account Holder Name *</Label>
                          <Input
                            id="accountHolderName"
                            name="accountHolderName"
                            value={paymentData.accountHolderName}
                            onChange={handleInputChange}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                            placeholder="Enter account holder name"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="accountNumber" className="text-white">Account Number *</Label>
                            <Input
                              id="accountNumber"
                              name="accountNumber"
                              value={paymentData.accountNumber}
                              onChange={handleInputChange}
                              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                              placeholder="Enter account number"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="ifscCode" className="text-white">IFSC Code *</Label>
                            <Input
                              id="ifscCode"
                              name="ifscCode"
                              value={paymentData.ifscCode}
                              onChange={handleInputChange}
                              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                              placeholder="Enter IFSC code"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="bankName" className="text-white">Bank Name</Label>
                          <Input
                            id="bankName"
                            name="bankName"
                            value={paymentData.bankName}
                            onChange={handleInputChange}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                            placeholder="Enter bank name"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="panNumber" className="text-white">PAN Number (Optional)</Label>
                      <Input
                        id="panNumber"
                        name="panNumber"
                        value={paymentData.panNumber}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        placeholder="Enter PAN number for tax purposes"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
                    >
                      Submit Application
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Application Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-slate-400 text-sm">Name</p>
                    <p className="text-white">{interviewerData.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Email</p>
                    <p className="text-white">{interviewerData.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Skill Category</p>
                    <p className="text-white">{interviewerData.skillCategory}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Technologies</p>
                    <p className="text-white text-sm">{interviewerData.skills.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Available Days</p>
                    <p className="text-white text-sm">{interviewerData.availableDays.join(", ")}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <p className="text-slate-300 text-sm">Profile review within 24 hours</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <p className="text-slate-300 text-sm">Interview process if selected</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <p className="text-slate-300 text-sm">Start conducting interviews</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default InterviewerPayment;
