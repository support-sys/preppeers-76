
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Calendar, CreditCard, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const Book = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    resume: null as File | null,
    targetRole: "",
    timeSlot: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, resume: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.targetRole) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Simulate form submission
    console.log("Form submitted:", formData);
    setIsSubmitted(true);
    
    toast({
      title: "Booking Submitted!",
      description: "You'll receive a GMeet link within 1 hour.",
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-white mb-4">Booking Confirmed!</h1>
              <p className="text-xl text-slate-300 mb-8">
                Thank you for booking your mock interview. You'll receive a GMeet link within 1 hour at {formData.email}.
              </p>
              <div className="space-y-4 text-left bg-white/5 rounded-xl p-6 mb-8">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name:</span>
                  <span className="text-white">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Role:</span>
                  <span className="text-white">{formData.targetRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time Slot:</span>
                  <span className="text-white">{formData.timeSlot || "To be confirmed"}</span>
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
              Fill out the form below to schedule your personalized mock interview with an experienced engineer.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-2xl">Interview Details</CardTitle>
                  <CardDescription className="text-slate-300">
                    Please provide your information to get started.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-white">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-white">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>

                    {/* Resume Upload */}
                    <div>
                      <Label htmlFor="resume" className="text-white">Upload Resume (Optional)</Label>
                      <div className="mt-2">
                        <label htmlFor="resume" className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-slate-400" />
                            <p className="mb-2 text-sm text-slate-300">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-slate-400">PDF, DOC, or DOCX (MAX. 5MB)</p>
                          </div>
                          <input
                            id="resume"
                            name="resume"
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                          />
                        </label>
                        {formData.resume && (
                          <p className="text-sm text-green-400 mt-2">
                            ✓ {formData.resume.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Target Role */}
                    <div>
                      <Label htmlFor="targetRole" className="text-white">Target Role *</Label>
                      <select
                        id="targetRole"
                        name="targetRole"
                        value={formData.targetRole}
                        onChange={handleInputChange}
                        className="w-full mt-2 bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select your target role</option>
                        <option value="Frontend Developer">Frontend Developer</option>
                        <option value="Backend Developer">Backend Developer</option>
                        <option value="Full Stack Developer">Full Stack Developer</option>
                        <option value="Data Scientist">Data Scientist</option>
                        <option value="Data Engineer">Data Engineer</option>
                        <option value="DevOps Engineer">DevOps Engineer</option>
                        <option value="Mobile Developer">Mobile Developer</option>
                        <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                        <option value="Product Manager">Product Manager</option>
                        <option value="QA Engineer">QA Engineer</option>
                      </select>
                    </div>

                    {/* Time Slot */}
                    <div>
                      <Label htmlFor="timeSlot" className="text-white">Preferred Time Slot</Label>
                      <Input
                        id="timeSlot"
                        name="timeSlot"
                        type="datetime-local"
                        value={formData.timeSlot}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <p className="text-sm text-slate-400 mt-1">
                        We'll try to match your preferred time, or suggest alternatives.
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      Proceed to Payment
                    </Button>
                  </form>
                </CardContent>
              </Card>
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
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Complete Payment</h4>
                      <p className="text-slate-300 text-sm">Secure payment via Razorpay/Stripe</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Get GMeet Link</h4>
                      <p className="text-slate-300 text-sm">Receive link within 1 hour</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Join Interview</h4>
                      <p className="text-slate-300 text-sm">60-minute live session</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Get Feedback</h4>
                      <p className="text-slate-300 text-sm">Detailed report within 24 hours</p>
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
      
      <Footer />
    </div>
  );
};

export default Book;
