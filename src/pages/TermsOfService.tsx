import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Check, ArrowLeft, Shield, FileText, AlertCircle, Users, Lock } from "lucide-react";

const TermsOfService = () => {
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
            <div className="inline-flex items-center space-x-3 bg-blue-500/20 backdrop-blur-sm rounded-full px-6 py-3 border border-blue-400/30 mb-6">
              <FileText className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 font-semibold text-sm uppercase tracking-wide">Legal Agreement</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Terms of <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Service</span>
            </h1>
            
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Please read these terms carefully before using our services. By using Interviewise, you agree to be bound by these terms.
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-12">
            
            {/* Introduction */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Shield className="w-6 h-6 text-blue-400 mr-3" />
                Agreement to Terms
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-4">
                These Terms of Service ("Terms") govern your access to and use of Interviewise Digital Services ("we," "our," or "us") 
                and our mock interview platform. By accessing or using our services, you agree to be bound by these Terms.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed">
                If you do not agree to these Terms, please do not use our services. We reserve the right to modify these Terms at any time, 
                and such modifications will be effective immediately upon posting.
              </p>
            </div>

            {/* Service Description */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Service Description</h2>
              <p className="text-slate-300 leading-relaxed mb-6">
               Interviewise provides a platform that connects IT professionals seeking mock interviews with experienced interviewers 
                from top technology companies. Our services include:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Mock interview sessions with qualified interviewers</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Detailed feedback and performance evaluation</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Resume review services</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Interview scheduling and coordination</span>
                </li>
              </ul>
            </div>

            {/* User Responsibilities */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Users className="w-6 h-6 text-blue-400 mr-3" />
                User Responsibilities
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Account Registration</h3>
                  <p className="text-slate-300 leading-relaxed">
                    You are responsible for maintaining the confidentiality of your account credentials and for all activities 
                    that occur under your account. You agree to provide accurate, current, and complete information during registration.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Conduct and Behavior</h3>
                  <p className="text-slate-300 leading-relaxed mb-3">
                    You agree to use our services in a professional and respectful manner. You will not:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span className="text-slate-300">Harass, abuse, or harm other users or interviewers</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span className="text-slate-300">Share false or misleading information</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span className="text-slate-300">Attempt to circumvent payment or booking systems</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span className="text-slate-300">Use our services for any illegal or unauthorized purpose</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span className="text-slate-300">Record or distribute interview sessions without consent</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Scheduling and Attendance</h3>
                  <p className="text-slate-300 leading-relaxed">
                    You are responsible for attending scheduled interviews on time. If you need to reschedule or cancel, 
                    you must do so in accordance with our cancellation policy. No-shows may result in forfeiture of payment.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Payment Terms</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Payment Processing</h3>
                  <p className="text-slate-300 leading-relaxed">
                    All payments must be made in advance through our secure payment gateway. We accept various payment methods 
                    as displayed during checkout. Prices are subject to change, but you will be charged the price displayed 
                    at the time of booking.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Refunds</h3>
                  <p className="text-slate-300 leading-relaxed">
                    Refund eligibility is determined on a case-by-case basis in accordance with our Refund Policy. 
                    Please review our Refund Policy for detailed information about when refunds may be issued.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Pricing</h3>
                  <p className="text-slate-300 leading-relaxed">
                    We reserve the right to modify our pricing at any time. Price changes will not affect bookings that 
                    have already been confirmed and paid for.
                  </p>
                </div>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Lock className="w-6 h-6 text-blue-400 mr-3" />
                Intellectual Property
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                All content, features, and functionality of the Interviewise platform, including but not limited to text, 
                graphics, logos, and software, are the exclusive property of Interviewise Digital Services and are protected 
                by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-slate-300 leading-relaxed">
                You may not reproduce, distribute, modify, or create derivative works from any content on our platform without 
                our express written permission. Feedback provided during interviews is intended for your personal use and may 
                not be redistributed or published without consent.
              </p>
            </div>

            {/* Limitation of Liability */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <AlertCircle className="w-6 h-6 text-yellow-400 mr-3" />
                Limitation of Liability
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
              Interviewise provides mock interview services as a platform connecting candidates with interviewers. 
                We do not guarantee specific outcomes, including but not limited to job offers, interview success, or 
                career advancement.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                To the maximum extent permitted by law, Interviewise shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly 
                or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of our services.
              </p>
              <p className="text-slate-300 leading-relaxed">
                Our total liability for any claims arising from or related to our services shall not exceed the amount 
                you paid to us in the twelve (12) months preceding the claim.
              </p>
            </div>

            {/* Termination */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Termination</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We reserve the right to suspend or terminate your account at any time, with or without notice, for any 
                violation of these Terms or for any other reason we deem necessary to protect the integrity of our platform.
              </p>
              <p className="text-slate-300 leading-relaxed">
                You may terminate your account at any time by contacting our support team. Upon termination, your right 
                to use our services will immediately cease, but any obligations or liabilities incurred prior to termination 
                will survive.
              </p>
            </div>

            {/* Privacy */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Privacy and Data Protection</h2>
              <p className="text-slate-300 leading-relaxed">
                Your use of our services is also governed by our Privacy Policy. Please review our Privacy Policy to 
                understand how we collect, use, and protect your personal information. By using our services, you consent 
                to the collection and use of your information as described in our Privacy Policy.
              </p>
            </div>

            {/* Dispute Resolution */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Dispute Resolution</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                If you have any concerns or disputes regarding our services, please contact us at support@interviewise.in. 
                We are committed to resolving disputes in a fair and timely manner.
              </p>
              <p className="text-slate-300 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of India, without regard to 
                its conflict of law provisions. Any disputes arising from these Terms or our services shall be subject to 
                the exclusive jurisdiction of the courts in India.
              </p>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-8 border border-blue-400/30">
              <h2 className="text-2xl font-bold text-white mb-6">Questions About These Terms?</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              
              <div className="space-y-2">
                <p className="text-slate-300">
                  <span className="font-semibold text-white">Email:</span> support@interviewise.in
                </p>
                <p className="text-slate-300">
                  <span className="font-semibold text-white">Response time:</span> Within 24 hours
                </p>
              </div>
            </div>

            {/* Policy Updates */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Changes to Terms</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by 
                posting the updated Terms on this page and updating the "Last updated" date below. Your continued use of 
                our services after such modifications constitutes acceptance of the updated Terms.
              </p>
              <p className="text-slate-400 text-sm">
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

export default TermsOfService;


