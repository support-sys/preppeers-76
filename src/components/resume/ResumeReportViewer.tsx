import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ExternalLink, FileText, AlertCircle, CheckCircle, Clock, Tag, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getActiveCoupons, formatDiscountText, formatExpiryText, formatPlanType, copyToClipboard, Coupon } from '@/utils/couponUtils';

interface ResumeReportViewerProps {
  reportUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  userEmail: string;
  targetRole?: string;
  onReportReady?: () => void;
}

export const ResumeReportViewer = ({ 
  reportUrl, 
  status, 
  userEmail,
  targetRole,
  onReportReady 
}: ResumeReportViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'pdf' | 'html' | 'unknown'>('unknown');
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(true);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const bookingLink = `/book?source=resume-review${userEmail ? `&email=${encodeURIComponent(userEmail)}` : ''}`;

  useEffect(() => {
    // Determine report type from URL
    if (reportUrl) {
      if (reportUrl.toLowerCase().endsWith('.pdf')) {
        setReportType('pdf');
      } else if (reportUrl.toLowerCase().endsWith('.html') || reportUrl.toLowerCase().endsWith('.htm')) {
        setReportType('html');
      } else {
        setReportType('unknown');
      }
    }
  }, [reportUrl]);

  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const coupons = await getActiveCoupons();
        if (coupons.length > 0) {
          setActiveCoupon(coupons[0]);
        }
      } catch (fetchError) {
        console.error('Failed to fetch active coupon', fetchError);
      } finally {
        setCouponLoading(false);
      }
    };

    fetchCoupon();
  }, []);

  const handleCopyCoupon = async (code: string) => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2000);
    }
  };

  useEffect(() => {
    if (status === 'completed' && reportUrl) {
      setLoading(false);
      onReportReady?.();
    } else if (status === 'failed') {
      setLoading(false);
      setError('Failed to generate report');
    }
  }, [status, reportUrl, onReportReady]);

  const handleDownload = () => {
    if (reportUrl) {
      window.open(reportUrl, '_blank');
    }
  };

  if (status === 'pending' || status === 'processing') {
    return (
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardContent className="p-6 sm:p-8 md:p-10 space-y-6 text-center">
          <div className="space-y-3">
            <Loader2 className="w-14 h-14 sm:w-16 sm:h-16 text-blue-400 animate-spin mx-auto" />
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              {status === 'pending' ? 'Your Resume Is In Review Queue' : 'Expert Is Reviewing Your Resume'}
            </h3>
            <p className="text-sm sm:text-base text-slate-300">
              A resume specialist is preparing your detailed feedback. Reviews are completed within 24 hours and we’ll email you the moment it’s ready.
            </p>
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs sm:text-sm">
              <Clock className="w-4 h-4" />
              <span>We’ll also refresh this page automatically when your report unlocks.</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 text-left">
            <h4 className="text-sm font-semibold text-blue-100 mb-3 uppercase tracking-wide">
              Why this review matters
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-300 flex-shrink-0" />
                <span><strong>68% of hiring managers</strong> reject candidates before the call because their resume lacks relevant accomplishments or clarity.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-300 flex-shrink-0" />
                <span>Your reviewer highlights the top 3 red flags that trigger auto-rejections—typos, vague impact statements, and missing metrics.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-300 flex-shrink-0" />
                <span>A polished resume doubles your callback rate, making your upcoming mock interview more effective.</span>
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold text-base sm:text-lg px-6 py-4"
            >
              <Link to={bookingLink}>
                Book a Mock Interview While You Wait
                <ArrowRight className="ml-2 w-5 h-5 inline-block" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'failed') {
    return (
      <Card className="bg-red-900/20 backdrop-blur-lg border-red-500/30 shadow-2xl">
        <CardContent className="p-8 md:p-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
            Report Generation Failed
          </h3>
          <p className="text-slate-300 mb-4">
            We encountered an error while generating your report. Please try submitting your resume again.
          </p>
          <Button
            asChild
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Link to="/resume-review">Submit Again</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!reportUrl) {
    return (
      <Card className="bg-yellow-900/20 backdrop-blur-lg border-yellow-500/30 shadow-2xl">
        <CardContent className="p-8 md:p-12 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
            Report Not Available
          </h3>
          <p className="text-slate-300 mb-4">
            The report is still being generated. Please check back later or check your email.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="bg-green-900/20 backdrop-blur-lg border-green-500/30 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Your Resume Review Report is Ready! 🎉
              </h2>
              <p className="text-slate-300">
                We've analyzed your resume and created a detailed feedback report. Review it below or download it for later.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleDownload}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
        <Button
          onClick={() => window.open(reportUrl, '_blank')}
          variant="outline"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in New Tab
        </Button>
      </div>

      {/* Report Viewer */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume Feedback Report
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full" style={{ minHeight: '800px', height: '80vh' }}>
            {loading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
              </div>
            )}
            
            {reportType === 'pdf' && (
              <iframe
                src={reportUrl}
                className="w-full h-full border-0 rounded-b-lg"
                title="Resume Review Report"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError('Failed to load PDF report');
                }}
              />
            )}

            {reportType === 'html' && (
              <iframe
                src={reportUrl}
                className="w-full h-full border-0 rounded-b-lg"
                title="Resume Review Report"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError('Failed to load HTML report');
                }}
              />
            )}

            {reportType === 'unknown' && (
              <div className="p-8 text-center">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300 mb-4">
                  Your report is ready. Click the buttons above to view or download it.
                </p>
                <Button
                  onClick={handleDownload}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              </div>
            )}

            {error && (
              <div className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <p className="text-red-400 mb-4">{error}</p>
                <Button
                  onClick={() => window.open(reportUrl, '_blank')}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Open in New Tab
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversion CTA Section */}
      <Card className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-500/40 shadow-[0_25px_80px_-30px_rgba(59,130,246,0.7)]">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/40 rounded-full px-4 py-1 text-xs font-semibold text-blue-100 uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              Next Step to Interview-Ready Confidence
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
              Turn this momentum into a real mock interview experience
            </h3>
            <p className="text-slate-200 max-w-2xl mx-auto">
              Go beyond written feedback. Practice live with our expert interviewers, get graded on the spot,
              and walk away with a clear action plan tailored to your target role.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-200 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>Role-specific interview questions & scoring rubric</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>Actionable coaching from top startup mentors</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>Priority slots reserved for resume review users</span>
            </div>
          </div>

          {!couponLoading && activeCoupon && (
            <div className="bg-black/30 border border-blue-400/40 rounded-2xl px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3 text-left">
                <div className="bg-blue-500/20 border border-blue-400/40 rounded-full p-2">
                  <Tag className="w-4 h-4 text-blue-200" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-200 font-semibold mb-1">Limited-time coupon unlocked</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="text-lg md:text-xl font-bold text-white bg-blue-500/20 border border-blue-400/50 rounded-lg px-3 py-1">
                      {activeCoupon.coupon_name}
                    </span>
                    <span className="text-blue-100 font-semibold text-sm">
                      {formatDiscountText(activeCoupon)} • {formatPlanType(activeCoupon.plan_type)} plan
                    </span>
                  </div>
                  <p className="text-xs text-blue-200/80 mt-2">
                    {formatExpiryText(activeCoupon.expiring_on)} · Apply at checkout to lock in your session
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => handleCopyCoupon(activeCoupon.coupon_name)}
                  className={`bg-white text-slate-900 hover:bg-slate-200 transition-colors font-semibold ${
                    copiedCoupon ? 'opacity-80' : ''
                  }`}
                >
                  {copiedCoupon ? 'Coupon Copied!' : 'Copy Code'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-slate-900 font-bold text-lg py-6 shadow-[0_20px_45px_-30px_rgba(34,197,94,0.8)]"
            >
              <Link to={`/book?source=resume-review&email=${encodeURIComponent(userEmail)}`}>
                Book Your Mock Interview Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Link to="/pricing">Compare Plans & Benefits</Link>
            </Button>
          </div>

          <p className="text-xs text-slate-300 text-center">
            {couponLoading
              ? 'Checking available offers for you...'
              : activeCoupon
                ? 'Apply the coupon during checkout—slots for discounted sessions fill fast.'
                : 'Resume review users get priority matching and exclusive discounts on mock interview slots.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};


