
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { IntervieweeButton } from "@/components/SmartCTAButtons";

const FAQ = () => {
  const faqs = [
    {
      question: "How does the mock interview process work?",
      answer: "After booking and payment, you'll receive a GMeet link within 1 hour. Join the session at your scheduled time where a real engineer will conduct a 60-minute interview tailored to your target role. You'll receive detailed feedback within 24 hours."
    },
    {
      question: "Can I choose my interviewer?",
      answer: "We match you with interviewers based on your target role and tech stack. While you can't choose a specific interviewer, we ensure they have relevant experience in your field of interest."
    },
    {
      question: "What if I miss my scheduled session?",
      answer: "If you miss your session, you can reschedule once for free within 48 hours of the original time. Additional rescheduling may incur a small fee. We recommend joining 5 minutes early to avoid technical issues."
    },
    {
      question: "How fast will I receive feedback?",
      answer: "You'll receive comprehensive written feedback within 24 hours of your interview. This includes detailed notes on your performance, areas for improvement, and actionable next steps."
    },
    {
      question: "Is my resume and personal information secure?",
      answer: "Absolutely. We take data security seriously. Your resume and personal information are stored securely and only shared with your assigned interviewer. We comply with industry-standard data protection practices."
    },
    {
      question: "What types of interviews do you conduct?",
      answer: "We conduct technical interviews for various roles including Frontend, Backend, Full Stack, Data Science, DevOps, Mobile Development, and more. Each interview is customized based on your target role and tech stack."
    },
    {
      question: "Can I get a refund if I'm not satisfied?",
      answer: "We offer a satisfaction guarantee. If you're not satisfied with your interview experience, contact us within 48 hours and we'll either provide a replacement session or process a refund."
    },
    {
      question: "Do you provide career guidance beyond mock interviews?",
      answer: "Our Premium package includes career guidance sessions, resume review, and LinkedIn profile optimization. All plans include basic career tips and job search strategies in the feedback report."
    },
    {
      question: "How experienced are your interviewers?",
      answer: "All our interviewers are working professionals with 3+ years of experience at reputable tech companies. Many work at FAANG companies, unicorn startups, and established tech firms."
    },
    {
      question: "Can I book multiple sessions with the same interviewer?",
      answer: "While we can't guarantee the same interviewer for follow-up sessions, you can request to work with the same person if they're available. We'll do our best to accommodate such requests."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Find answers to common questions about our mock interview platform and process.
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-12">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border-white/20"
                >
                  <AccordionTrigger className="text-white hover:text-blue-400 text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-300 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <MessageSquare className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4">
                Still Have Questions?
              </h2>
              <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
                Can't find what you're looking for? Our support team is here to help you with any questions about our mock interview platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                    Contact Support
                  </Button>
                </Link>
                <IntervieweeButton 
                  size="lg" 
                  className="bg-transparent border-white text-white hover:bg-white/10 px-8 py-3 border" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default FAQ;
