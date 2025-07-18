
import { Link } from "react-router-dom";
import { Mail, Phone, MessageSquare } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white border-t border-white/10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">INTERVIEWISE</h3>
            <p className="text-slate-300 mb-4 max-w-md">
              Practice with real engineers, get expert feedback, and land your dream IT job. 
              Connect with experienced professionals for personalized mock interviews.
            </p>
            <div className="flex space-x-4">
              <Mail className="w-5 h-5 text-blue-400" />
              <span className="text-slate-300">support@interviewise.in</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/book" className="text-slate-300 hover:text-blue-400 transition-colors">
                  Book Interview
                </Link>
              </li>
              <li>
                <Link to="/interviewers" className="text-slate-300 hover:text-blue-400 transition-colors">
                  Become Interviewer
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-slate-300 hover:text-blue-400 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-slate-300 hover:text-blue-400 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-slate-300 hover:text-blue-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">
                  Help Center
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-slate-400">
            © 2025 INTERVIEWISE. All rights reserved. Built for IT professionals by IT professionals.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
