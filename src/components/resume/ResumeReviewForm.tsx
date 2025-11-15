import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Briefcase, Clock, ArrowRight, Upload, FileText, X } from 'lucide-react';
import { getAvailableRoles } from '@/config/readinessQuestions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RESUME_REVIEW_PRICE } from '@/utils/planConfig';

export interface ResumeReviewData {
  email: string;
  name: string;
  targetRole: string;
  experienceYears: number;
  resumeFile: File | null;
  resumeUrl: string;
}

interface ResumeReviewFormProps {
  onSubmit: (data: ResumeReviewData) => void;
  isSubmitting?: boolean;
  initialEmail?: string;
  initialName?: string;
}

export const ResumeReviewForm = ({ onSubmit, isSubmitting = false, initialEmail, initialName }: ResumeReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<ResumeReviewData>({
    email: '',
    name: '',
    targetRole: '',
    experienceYears: 0,
    resumeFile: null,
    resumeUrl: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ResumeReviewData, string>>>({});
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeFileName, setResumeFileName] = useState<string>('');

  const availableRoles = getAvailableRoles();

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      email: initialEmail ?? prev.email ?? user?.email ?? '',
      name: initialName ?? prev.name ?? user?.user_metadata?.full_name ?? ''
    }));
  }, [initialEmail, initialName, user?.email, user?.user_metadata?.full_name]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Resume must be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, DOC, and DOCX files are allowed",
        variant: "destructive"
      });
      return;
    }

    setFormData({ ...formData, resumeFile: file });
    setResumeFileName(file.name);
    setErrors({ ...errors, resumeFile: undefined });
  };

  const removeResume = () => {
    setFormData({ ...formData, resumeFile: null, resumeUrl: '' });
    setResumeFileName('');
  };

  const uploadResume = async (file: File): Promise<string> => {
    try {
      setUploadingResume(true);
      
      // Use user ID if logged in, otherwise use a temporary identifier
      const userId = user?.id || 'anonymous';
      const timestamp = new Date().getTime();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `resume-reviews/${userId}/${timestamp}_${sanitizedFileName}`;

      console.log('Uploading resume:', fileName);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('candidate-resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading resume:', error);
        throw new Error(`Failed to upload resume: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('candidate-resumes')
        .getPublicUrl(fileName);

      console.log('Resume uploaded successfully:', urlData.publicUrl);
      return urlData.publicUrl;

    } catch (error: any) {
      console.error('Resume upload error:', error);
      throw error;
    } finally {
      setUploadingResume(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ResumeReviewData, string>> = {};

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Please enter your name';
    }

    if (!formData.targetRole) {
      newErrors.targetRole = 'Please select your target role';
    }

    if (formData.experienceYears < 0 || formData.experienceYears > 50) {
      newErrors.experienceYears = 'Please enter a valid years of experience (0-50)';
    }

    if (!formData.resumeFile && !formData.resumeUrl) {
      newErrors.resumeFile = 'Please upload your resume';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      let resumeUrl = formData.resumeUrl;

      // Upload resume if file is selected
      if (formData.resumeFile) {
        resumeUrl = await uploadResume(formData.resumeFile);
      }

      // Submit form with resume URL
      onSubmit({
        ...formData,
        resumeUrl
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload resume. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardHeader className="text-center pb-4 px-4 md:px-6">
          <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3">
            Get Your Resume Reviewed
          </CardTitle>
          <CardDescription className="text-base md:text-lg text-slate-300">
            Upload your resume and receive expert, personalised feedback. One-time review fee: ₹{RESUME_REVIEW_PRICE}.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 md:px-6">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Mail className="inline w-4 h-4 mr-2" />
                Email Address *
              </label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 h-12 text-base"
                required
                disabled={isSubmitting || !!initialEmail}
                readOnly={!!initialEmail}
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <User className="inline w-4 h-4 mr-2" />
                Your Name *
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 h-12 text-base"
                required
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Target Role Select */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Briefcase className="inline w-4 h-4 mr-2" />
                Target Role *
              </label>
              <select
                value={formData.targetRole}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                className="w-full bg-slate-700/50 border-slate-600 text-white rounded-md px-3 py-3 h-12 text-base border focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              >
                <option value="">Select your target role</option>
                {availableRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              {errors.targetRole && (
                <p className="text-red-400 text-sm mt-1">{errors.targetRole}</p>
              )}
            </div>

            {/* Experience Years Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Clock className="inline w-4 h-4 mr-2" />
                Years of Experience *
              </label>
              <Input
                type="number"
                min="0"
                max="50"
                step="0.1"
                placeholder="e.g., 0, 1.5, 5"
                value={formData.experienceYears}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ 
                    ...formData, 
                    experienceYears: value === '' 
                      ? 0 
                      : Math.max(0, Math.min(50, parseFloat(value) || 0))
                  });
                }}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 h-12 text-base"
                required
                disabled={isSubmitting}
              />
              {errors.experienceYears && (
                <p className="text-red-400 text-sm mt-1">{errors.experienceYears}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                Enter your years of experience. Decimals are optional (e.g., 1.5).
              </p>
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <FileText className="inline w-4 h-4 mr-2" />
                Upload Resume * (PDF, DOC, DOCX - Max 5MB)
              </label>
              {!resumeFileName ? (
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                    id="resume-upload"
                    disabled={isSubmitting || uploadingResume}
                  />
                  <label
                    htmlFor="resume-upload"
                    className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      isSubmitting || uploadingResume
                        ? 'border-slate-600 bg-slate-800/50 cursor-not-allowed'
                        : 'border-slate-600 bg-slate-700/30 hover:border-blue-500 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-300">
                        {uploadingResume ? 'Uploading...' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX (Max 5MB)</p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-white truncate">{resumeFileName}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeResume}
                    disabled={isSubmitting || uploadingResume}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {errors.resumeFile && (
                <p className="text-red-400 text-sm mt-1">{errors.resumeFile}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="text-sm text-slate-300 bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3">
              Pay ₹{RESUME_REVIEW_PRICE} after uploading to start your expert resume review.
            </div>
            <Button 
              type="submit" 
              size="lg" 
              disabled={isSubmitting || uploadingResume}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold text-base md:text-lg py-4 md:py-6 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : uploadingResume ? (
                <>Uploading Resume...</>
              ) : (
                <>
                  Continue to Payment
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Trust Signals */}
          <div className="mt-6 pt-6 border-t border-slate-600/50">
            <div className="grid grid-cols-3 gap-4 text-center text-xs text-slate-400">
              <div>
                <p className="text-2xl font-bold text-green-400">₹{RESUME_REVIEW_PRICE}</p>
                <p className="mt-1">One-time fee</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">✓</p>
                <p className="mt-1">Expert reviewed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">📄</p>
                <p className="mt-1">Actionable PDF report</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

