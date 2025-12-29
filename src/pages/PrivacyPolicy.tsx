import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Check, ArrowLeft, Shield, Lock, Eye, Database, Mail, AlertCircle, Users, FileText } from "lucide-react";

const PrivacyPolicy = () => {
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
            <div className="inline-flex items-center space-x-3 bg-purple-500/20 backdrop-blur-sm rounded-full px-6 py-3 border border-purple-400/30 mb-6">
              <Lock className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300 font-semibold text-sm uppercase tracking-wide">Your Privacy Matters</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Privacy <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Policy</span>
            </h1>
            
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              We are committed to protecting your privacy and ensuring the security of your personal information. 
              This policy explains how we collect, use, and safeguard your data.
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-12">
            
            {/* Introduction */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Shield className="w-6 h-6 text-purple-400 mr-3" />
                Our Commitment to Privacy
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-4">
                Interviewise Digital Services ("we," "our," or "us") is committed to protecting your privacy and personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mock 
                interview platform and services.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed">
                By using our services, you consent to the collection and use of information in accordance with this Privacy Policy. 
                We encourage you to read this policy carefully to understand our practices regarding your personal data.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Database className="w-6 h-6 text-blue-400 mr-3" />
                Information We Collect
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Personal Information</h3>
                  <p className="text-slate-300 leading-relaxed mb-3">
                    When you register for an account or use our services, we may collect the following personal information:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">Name, email address, and phone number</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">Professional information (job title, company, years of experience)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">Technical skills and areas of expertise</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">Resume and portfolio information</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">Payment and billing information</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Usage Information</h3>
                  <p className="text-slate-300 leading-relaxed mb-3">
                    We automatically collect certain information when you use our platform:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">Device information (IP address, browser type, operating system)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">Usage patterns and interaction data</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">Log files and analytics data</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">Cookies and similar tracking technologies</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Interview Data</h3>
                  <p className="text-slate-300 leading-relaxed">
                    We collect information related to your mock interview sessions, including scheduling details, 
                    feedback provided by interviewers, and performance evaluations. This data is used to improve 
                    your experience and provide better services.
                  </p>
                </div>
              </div>
            </div>

            {/* How We Use Information */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Eye className="w-6 h-6 text-cyan-400 mr-3" />
                How We Use Your Information
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Service Delivery</h3>
                    <p className="text-slate-300 leading-relaxed">
                      To provide, maintain, and improve our mock interview services, match you with appropriate interviewers, 
                      and facilitate communication between users.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Payment Processing</h3>
                    <p className="text-slate-300 leading-relaxed">
                      To process payments, manage billing, and handle financial transactions securely through our payment partners.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Communication</h3>
                    <p className="text-slate-300 leading-relaxed">
                      To send you service-related notifications, updates, support messages, and respond to your inquiries.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Platform Improvement</h3>
                    <p className="text-slate-300 leading-relaxed">
                      To analyze usage patterns, conduct research, and develop new features to enhance user experience.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">5</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Legal Compliance</h3>
                    <p className="text-slate-300 leading-relaxed">
                      To comply with legal obligations, enforce our Terms of Service, and protect our rights and the rights of our users.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Information Sharing */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Information Sharing and Disclosure</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">With Interviewers</h3>
                  <p className="text-slate-300 leading-relaxed">
                    We share relevant information with interviewers to facilitate mock interview sessions. This includes your 
                    name, technical background, and interview preferences. Interviewers are contractually bound to maintain 
                    confidentiality and use this information solely for providing interview services.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Service Providers</h3>
                  <p className="text-slate-300 leading-relaxed mb-3">
                    We may share information with trusted third-party service providers who assist us in operating our platform:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span className="text-slate-300">Payment processors for transaction handling</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span className="text-slate-300">Cloud hosting providers for data storage</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span className="text-slate-300">Analytics services for platform improvement</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span className="text-slate-300">Communication tools for customer support</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Legal Requirements</h3>
                  <p className="text-slate-300 leading-relaxed">
                    We may disclose your information if required by law, court order, or governmental authority, or to protect 
                    our rights, property, or safety, or that of our users or others.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Business Transfers</h3>
                  <p className="text-slate-300 leading-relaxed">
                    In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring 
                    entity, subject to the same privacy protections.
                  </p>
                </div>
              </div>
            </div>

            {/* Data Security */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Lock className="w-6 h-6 text-green-400 mr-3" />
                Data Security
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your personal information from unauthorized access, 
                alteration, disclosure, or destruction. These measures include:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Encryption of sensitive data in transit and at rest</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Secure authentication and access controls</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Regular security audits and assessments</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Secure payment processing through certified providers</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Employee training on data protection</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Incident response and breach notification procedures</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed mt-6">
                However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to 
                use commercially acceptable means to protect your information, we cannot guarantee absolute security.
              </p>
            </div>

            {/* Your Rights */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Users className="w-6 h-6 text-blue-400 mr-3" />
                Your Privacy Rights
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Access and Correction</h3>
                  <p className="text-slate-300 leading-relaxed">
                    You have the right to access, update, or correct your personal information at any time through your account 
                    settings or by contacting us directly.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Data Deletion</h3>
                  <p className="text-slate-300 leading-relaxed">
                    You may request deletion of your account and associated data, subject to our legal obligations to retain 
                    certain information for business and compliance purposes.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Opt-Out</h3>
                  <p className="text-slate-300 leading-relaxed">
                    You can opt-out of marketing communications by clicking the unsubscribe link in our emails or adjusting 
                    your communication preferences in your account settings.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Cookie Preferences</h3>
                  <p className="text-slate-300 leading-relaxed">
                    Most web browsers allow you to control cookies through their settings. However, disabling cookies may 
                    affect the functionality of our platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Cookies */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Cookies and Tracking Technologies</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and 
                personalize content. Types of cookies we use include:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Essential Cookies</h3>
                  <p className="text-slate-300 text-sm">
                    Required for the platform to function properly, including authentication and security features.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Analytics Cookies</h3>
                  <p className="text-slate-300 text-sm">
                    Help us understand how users interact with our platform to improve functionality and user experience.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Preference Cookies</h3>
                  <p className="text-slate-300 text-sm">
                    Remember your settings and preferences to provide a personalized experience.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Marketing Cookies</h3>
                  <p className="text-slate-300 text-sm">
                    Used to deliver relevant advertisements and track campaign effectiveness (with your consent).
                  </p>
                </div>
              </div>
            </div>

            {/* Data Retention */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Data Retention</h2>
              <p className="text-slate-300 leading-relaxed">
                We retain your personal information for as long as necessary to provide our services, comply with legal obligations, 
                resolve disputes, and enforce our agreements. When you delete your account, we will delete or anonymize your 
                personal information, except where we are required to retain it for legal, regulatory, or business purposes.
              </p>
            </div>

            {/* Children's Privacy */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <AlertCircle className="w-6 h-6 text-yellow-400 mr-3" />
                Children's Privacy
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information 
                from children. If we become aware that we have collected information from a child without parental consent, we will 
                take steps to delete such information promptly.
              </p>
            </div>

            {/* International Data Transfers */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">International Data Transfers</h2>
              <p className="text-slate-300 leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence. These 
                countries may have data protection laws that differ from those in your country. By using our services, you consent 
                to the transfer of your information to these countries. We take appropriate safeguards to ensure your information 
                receives adequate protection.
              </p>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-8 border border-purple-400/30">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Mail className="w-6 h-6 text-purple-400 mr-3" />
                Contact Us About Privacy
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              
              <div className="space-y-2">
                <p className="text-slate-300">
                  <span className="font-semibold text-white">Email:</span> support@interviewise.in
                </p>
                <p className="text-slate-300">
                  <span className="font-semibold text-white">Response time:</span> Within 24 hours
                </p>
                <p className="text-slate-300 text-sm mt-4">
                  We are committed to addressing your privacy concerns promptly and transparently.
                </p>
              </div>
            </div>

            {/* Policy Updates */}
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Changes to This Privacy Policy</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, 
                or for other reasons. We will notify you of any material changes by posting the updated policy on this page and updating 
                the "Last updated" date below. We encourage you to review this policy periodically.
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

export default PrivacyPolicy;

