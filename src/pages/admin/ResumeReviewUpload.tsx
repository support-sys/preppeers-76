import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle2, FileText, Loader2, User, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ResumeReviewRecord {
  id: string;
  user_name: string | null;
  user_email: string | null;
  target_role: string | null;
  experience_years: number | null;
  resume_url: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  report_url: string | null;
  submitted_at: string | null;
  report_generated_at: string | null;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });
};

const ResumeReviewUploadAdmin = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reviewId = searchParams.get('reviewId') ?? '';
  const { toast } = useToast();

  const [isReviewLoading, setIsReviewLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState<ResumeReviewRecord | null>(null);
  const [reportLink, setReportLink] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const roleValue = userRole as string | null;
  const isAdmin = roleValue === 'admin';

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      navigate(`/auth?from=${encodeURIComponent(currentPath)}`, { replace: true });
      return;
    }

    if (!isAdmin) {
      setAuthError('You do not have access to this page.');
      setIsReviewLoading(false);
    } else {
      setAuthError(null);
    }
  }, [authLoading, user, isAdmin, navigate]);

  useEffect(() => {
    if (authLoading || !user || !isAdmin) {
      return;
    }

    const fetchReview = async () => {
      if (!reviewId) {
        setIsReviewLoading(false);
        return;
      }

      const supabaseClient = supabase as any;
      const { data, error } = await supabaseClient
        .from('resume_reviews')
        .select('id, user_name, user_email, target_role, experience_years, resume_url, status, report_url, submitted_at, report_generated_at')
        .eq('id', reviewId)
        .single();

      if (error || !data) {
        console.error('Failed to load resume review record', error);
        toast({
          title: 'Unable to load record',
          description: 'Please check the review ID or try again later.',
          variant: 'destructive',
        });
      } else {
        setRecord(data as ResumeReviewRecord);
        setReportLink((data as ResumeReviewRecord).report_url ?? '');
      }
      setIsReviewLoading(false);
    };

    fetchReview();
  }, [authLoading, user, isAdmin, reviewId, toast]);

  const handleComplete = async () => {
    if (!record || !reviewId) {
      setUploadError('Review ID missing. Please use the link from the reviewer email.');
      return;
    }

    if (!reportLink.trim()) {
      setUploadError('Please paste the report link before continuing.');
      return;
    }

    const normalizedLink = reportLink.trim();
    if (!/^https?:\/\//i.test(normalizedLink)) {
      setUploadError('Link must start with http:// or https://');
      return;
    }

    setSaving(true);
    setUploadError(null);
    setSuccessMessage(null);

    try {
      const {
        data: completionData,
        error: completionError,
      } = await supabase.functions.invoke('resume-review-complete', {
        body: {
          reviewId,
          reportUrl: normalizedLink,
        }
      });

      if (completionError) {
        console.error('Completion function error', completionError);
        throw new Error(completionError.message || 'Failed to finalize review');
      }

      setSuccessMessage('Report link saved and review marked as completed.');
      setRecord((prev) =>
        prev
          ? {
              ...prev,
              report_url: normalizedLink,
              status: 'completed',
              report_generated_at: new Date().toISOString(),
            }
          : prev
      );
      toast({
        title: 'Review completed',
        description: completionData?.success
          ? 'Candidate has been notified.'
          : 'Report stored successfully.',
      });
    } catch (error: any) {
      console.error('Failed to submit review link', error);
      setUploadError(error.message ?? 'Failed to submit link. Please try again.');
      toast({
        title: 'Submission failed',
        description: error.message ?? 'Unable to store the link.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const renderContent = () => {
    if (authError) {
      return (
        <Card className="max-w-2xl mx-auto border-red-400/40 bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-200">
              <AlertTriangle className="w-5 h-5" />
              Access denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-100 text-sm">
            {authError}
          </CardContent>
        </Card>
      );
    }

    if (!reviewId) {
      return (
        <Card className="max-w-2xl mx-auto border-red-400/40 bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-200">
              <AlertTriangle className="w-5 h-5" />
              Missing review ID
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-100 text-sm">
            This page must be opened using the link from the reviewer notification email, which includes the <code>reviewId</code> query parameter.
          </CardContent>
        </Card>
      );
    }

    if (isReviewLoading) {
      return (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      );
    }

    if (!record) {
      return (
        <Card className="max-w-2xl mx-auto border-red-400/40 bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-200">
              <AlertTriangle className="w-5 h-5" />
              Record not found
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-100 text-sm">
            We couldn&apos;t find a resume review with ID <code>{reviewId}</code>. Please confirm the link or contact support.
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <Card className="border-slate-700 bg-slate-900/60">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="w-5 h-5 text-blue-300" />
              Candidate Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-200 pt-6">
            <div>
              <p className="text-slate-400 text-xs uppercase">Candidate</p>
              <p className="font-medium">{record.user_name ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase">Email</p>
              <p className="font-medium">{record.user_email ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase">Target Role</p>
              <p className="font-medium">{record.target_role ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase">Experience</p>
              <p className="font-medium">
                {record.experience_years !== null ? `${record.experience_years} years` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase">Submitted At</p>
              <p className="font-medium">{formatDateTime(record.submitted_at)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase">Current Status</p>
              <p className="font-semibold capitalize">{record.status}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/60">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="w-5 h-5 text-blue-300" />
              Resume &amp; Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs uppercase">Original Resume</p>
                <p className="text-slate-200 break-all">
                  {record.resume_url ? (
                    <a
                      href={record.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-300 hover:text-blue-200 underline underline-offset-2"
                    >
                      Download resume
                    </a>
                  ) : (
                    'Not available'
                  )}
                </p>
              </div>
              {record.report_url && (
                <div>
                  <p className="text-slate-400 text-xs uppercase">Existing Report</p>
                  <a
                    href={record.report_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-300 hover:text-green-200 underline underline-offset-2"
                  >
                    View current report
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-200">
                Paste Google Drive report link
              </label>
              <Input
                type="url"
                placeholder="https://drive.google.com/..."
                value={reportLink}
                onChange={(event) => setReportLink(event.target.value)}
                disabled={saving}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />

              {uploadError && (
                <div className="text-xs text-red-300 bg-red-900/30 border border-red-500/40 rounded-md p-3">
                  {uploadError}
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-500/40 rounded-md p-3">
                  <CheckCircle2 className="w-4 h-4" />
                  {successMessage}
                </div>
              )}

              <Button
                onClick={handleComplete}
                disabled={saving || !reportLink}
                className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    Save Link &amp; Notify
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-500 leading-5">
                Once saved, the candidate&apos;s status is set to <strong>completed</strong> and an email is sent with this link.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 py-10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Resume Review Upload</h1>
          <p className="text-sm text-slate-400">
            Review ID: <span className="text-slate-200">{reviewId || 'Not provided'}</span>
          </p>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default ResumeReviewUploadAdmin;


