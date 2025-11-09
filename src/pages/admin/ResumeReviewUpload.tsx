import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle2, FileText, Loader2, Upload, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');

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
  const [searchParams] = useSearchParams();
  const reviewId = searchParams.get('reviewId') ?? '';
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState<ResumeReviewRecord | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const bucketPath = useMemo(() => {
    if (!reviewId || !file) return null;
    const cleanedName = sanitizeFileName(file.name);
    return `resume-review-reports/${reviewId}/${Date.now()}_${cleanedName}`;
  }, [file, reviewId]);

  useEffect(() => {
    const fetchReview = async () => {
      if (!reviewId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
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
      }
      setLoading(false);
    };

    fetchReview();
  }, [reviewId, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    setUploadError(null);
    setSuccessMessage(null);

    if (!selected) {
      setFile(null);
      return;
    }

    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(selected.type)) {
      setUploadError('Only PDF files are allowed.');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selected.size > maxSize) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }

    setFile(selected);
  };

  const handleUpload = async () => {
    if (!record || !reviewId) {
      setUploadError('Review ID missing. Please use the link from the reviewer email.');
      return;
    }

    if (!file || !bucketPath) {
      setUploadError('Please select a PDF report before uploading.');
      return;
    }

    setSaving(true);
    setUploadError(null);
    setSuccessMessage(null);

    try {
      const { error: uploadErrorResponse } = await supabase.storage
        .from('resume-review-reports')
        .upload(bucketPath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadErrorResponse) {
        throw uploadErrorResponse;
      }

      const { data: urlData } = supabase.storage
        .from('resume-review-reports')
        .getPublicUrl(bucketPath);

      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) {
        throw new Error('Failed to generate public URL for uploaded report.');
      }

      const { data: completionData, error: completionError } = await supabase.functions.invoke(
        'resume-review-complete',
        {
          body: {
            reviewId,
            reportUrl: publicUrl,
          },
        }
      );

      if (completionError) {
        throw completionError;
      }

      setSuccessMessage('Report uploaded and review marked as completed.');
      setRecord((prev) =>
        prev
          ? {
              ...prev,
              report_url: publicUrl,
              status: 'completed',
              report_generated_at: new Date().toISOString(),
            }
          : prev
      );
      setFile(null);
      toast({
        title: 'Review completed',
        description: completionData?.success
          ? 'Candidate has been notified.'
          : 'Report stored successfully.',
      });
    } catch (error: any) {
      console.error('Failed to upload review report', error);
      setUploadError(error.message ?? 'Failed to upload report. Please try again.');
      toast({
        title: 'Upload failed',
        description: error.message ?? 'Unable to store the report.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const renderContent = () => {
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

    if (loading) {
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
                Upload Completed Review (PDF only)
              </label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={saving}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
              {file && (
                <p className="text-xs text-slate-400">
                  Selected file: <span className="text-slate-200">{file.name}</span>
                </p>
              )}

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
                onClick={handleUpload}
                disabled={saving || !file}
                className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload &amp; Mark Complete
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-500 leading-5">
                Once the PDF is uploaded, the candidate&apos;s status is set to <strong>completed</strong>.
                The candidate email is handled separately via the resume review completion function.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AdminNavigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Resume Review Upload</h1>
            <p className="text-sm text-slate-400">
              Review ID: <span className="text-slate-200">{reviewId || 'Not provided'}</span>
            </p>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default ResumeReviewUploadAdmin;


