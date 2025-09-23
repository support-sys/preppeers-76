import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Check, ArrowLeft, Shield, Clock, Users, MessageSquare } from "lucide-react";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-8 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-3 bg-green-500/20 backdrop-blur-sm rounded-full px-6 py-3 border border-green-400/30 mb-6">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-green-300 font-semibold text-sm uppercase tracking-wide">Our Promise</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Refund <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Policy</span>
            </h1>
            
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              We stand behind our service quality. Your satisfaction is our priority, and we're committed to making things right.
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-12">
            
            {/* Our Commitment */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Shield className="w-6 h-6 text-blue-400 mr-3" />
                Our Commitment to You
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                At InterviewWise, we believe in delivering exceptional value through our mock interview services. 
                We're committed to ensuring every candidate receives a high-quality interview experience that helps 
                them succeed in their career goals.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Expert Interviewers</h3>
                  <p className="text-slate-400 text-sm">Real engineers from top companies</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Quality Feedback</h3>
                  <p className="text-slate-400 text-sm">Detailed insights and actionable advice</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Flexible Scheduling</h3>
                  <p className="text-slate-400 text-sm">Book interviews that fit your schedule</p>
                </div>
              </div>
            </div>

            {/* Refund Process */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Our Refund Process</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Initial Review & Resolution</h3>
                    <p className="text-slate-300 leading-relaxed">
                      If you're not satisfied with your mock interview experience or if there's a no-show by the interviewer, 
                      we'll immediately review your case. Our priority is to resolve the issue by booking you another 
                      interview with a different qualified interviewer.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Alternative Interview Arrangement</h3>
                    <p className="text-slate-300 leading-relaxed">
                      We'll work with you to find a suitable replacement interviewer who matches your technical background 
                      and availability. This ensures you still receive the value you paid for through a quality mock interview experience.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Refund Consideration</h3>
                    <p className="text-slate-300 leading-relaxed">
                      Only in exceptional circumstances where we determine that a refund is the most appropriate resolution 
                      (such as repeated technical issues, interviewer unavailability, or other service failures), will we 
                      process a full refund of your payment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Refund Conditions */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">When Refunds Are Considered</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-green-400 mb-4 flex items-center">
                    <Check className="w-5 h-5 mr-2" />
                    Refund-Eligible Situations
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">Interviewer no-show without prior notice</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">Technical issues preventing interview completion</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">Interviewer unqualified for your tech stack</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">Service cancellation by InterviewWise</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">Significant deviation from promised service</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center">
                    <span className="w-5 h-5 mr-2 text-red-400">✕</span>
                    Non-Refundable Situations
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <span className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0">✕</span>
                      <span className="text-slate-300">Personal satisfaction with interview quality</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0">✕</span>
                      <span className="text-slate-300">Change of mind after booking</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0">✕</span>
                      <span className="text-slate-300">Missed interview due to candidate no-show</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0">✕</span>
                      <span className="text-slate-300">Technical issues on candidate's end</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0">✕</span>
                      <span className="text-slate-300">Dissatisfaction with interview difficulty level</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Process Timeline */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Refund Process Timeline</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Immediate Response</h3>
                    <p className="text-slate-400 text-sm">We respond to refund requests within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Review & Resolution</h3>
                    <p className="text-slate-400 text-sm">Case review and alternative interview arrangement within 48 hours</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Refund Processing</h3>
                    <p className="text-slate-400 text-sm">If approved, refunds are processed within 5-7 business days</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-8 border border-blue-400/30">
              <h2 className="text-2xl font-bold text-white mb-6">Need Help?</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                If you have any concerns about your mock interview experience or need to discuss a potential refund, 
                please don't hesitate to reach out to our support team.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">Contact Support</h3>
                  <div className="space-y-2">
                    <p className="text-slate-300">Email: support@interviewwise.com</p>
                    <p className="text-slate-300">Response time: Within 24 hours</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">Include in Your Request</h3>
                  <ul className="space-y-1 text-slate-300 text-sm">
                    <li>• Your booking reference number</li>
                    <li>• Interview date and time</li>
                    <li>• Detailed description of the issue</li>
                    <li>• Any relevant screenshots or evidence</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Policy Updates */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Policy Updates</h2>
              <p className="text-slate-300 leading-relaxed">
                This refund policy may be updated from time to time to reflect changes in our services or legal requirements. 
                Any updates will be posted on this page with the effective date. We encourage you to review this policy 
                periodically to stay informed about our commitment to your satisfaction.
              </p>
              <p className="text-slate-400 text-sm mt-4">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RefundPolicy;
