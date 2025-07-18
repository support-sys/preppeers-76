import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResumeUploadTest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [testingDownload, setTestingDownload] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setUploadedUrl(null); // Reset uploaded URL when new file is selected
  };

  const uploadResume = async (file: File): Promise<string | null> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setUploading(true);
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only PDF, DOC, and DOCX files are allowed');
      }

      // Generate unique filename
      const timestamp = new Date().getTime();
      const fileName = `resumes/${user.id}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

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
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = await uploadResume(file);
      setUploadedUrl(url);
      toast({
        title: "Upload successful!",
        description: "Resume uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload resume.",
        variant: "destructive",
      });
    }
  };

  const testDownload = async () => {
    if (!uploadedUrl) return;
    
    setTestingDownload(true);
    try {
      const response = await fetch(uploadedUrl);
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = file?.name || 'resume';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        
        toast({
          title: "Download successful!",
          description: "File downloaded successfully.",
        });
      } else {
        throw new Error('Failed to download file');
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the file.",
        variant: "destructive",
      });
    } finally {
      setTestingDownload(false);
    }
  };

  const checkStorageBucket = async () => {
    try {
      console.log('Testing storage bucket access...');
      
      // First, try to list the bucket contents
      const { data, error } = await supabase.storage
        .from('candidate-resumes')
        .list('', { limit: 1 });

      if (error) {
        console.error('Storage bucket error:', error);
        
        if (error.message.includes('does not exist')) {
          toast({
            title: "Storage bucket not found",
            description: "The 'candidate-resumes' bucket doesn't exist. Please create it in your Supabase dashboard.",
            variant: "destructive",
          });
        } else if (error.message.includes('policy')) {
          toast({
            title: "RLS Policy Error",
            description: "Storage policies are not configured correctly. Check the setup guide.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Storage bucket error",
            description: `Bucket not accessible: ${error.message}`,
            variant: "destructive",
          });
        }
        return false;
      }

      console.log('Storage bucket accessible:', data);
      toast({
        title: "Storage bucket OK",
        description: "Storage bucket is accessible.",
      });
      return true;
    } catch (error) {
      console.error('Storage bucket test error:', error);
      toast({
        title: "Storage bucket error",
        description: "Failed to access storage bucket.",
        variant: "destructive",
      });
      return false;
    }
  };

  if (!user) {
    return (
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Resume Upload Test</CardTitle>
          <CardDescription className="text-slate-300">
            Please log in to test resume upload functionality.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Resume Upload Test</CardTitle>
        <CardDescription className="text-slate-300">
          Test the resume upload functionality and verify storage access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Bucket Test */}
        <div>
          <Label className="text-white">Storage Bucket Test</Label>
          <Button 
            onClick={checkStorageBucket}
            variant="outline"
            className="mt-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Test Storage Bucket Access
          </Button>
        </div>

        {/* File Upload */}
        <div>
          <Label htmlFor="resume-file" className="text-white">Select Resume File</Label>
          <div className="mt-2">
            <label htmlFor="resume-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-slate-400" />
                <p className="mb-2 text-sm text-slate-300">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-400">PDF, DOC, or DOCX (MAX. 5MB)</p>
              </div>
              <input
                id="resume-file"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
            {file && (
              <p className="text-sm text-green-400 mt-2">
                ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>

        {/* Upload Button */}
        <div>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Resume
              </>
            )}
          </Button>
        </div>

        {/* Upload Result */}
        {uploadedUrl && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400">Upload successful!</span>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg">
              <Label className="text-white text-sm">Uploaded URL:</Label>
              <p className="text-slate-300 text-xs break-all mt-1">{uploadedUrl}</p>
            </div>

            <Button
              onClick={testDownload}
              disabled={testingDownload}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {testingDownload ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Download...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Test Download
                </>
              )}
            </Button>
          </div>
        )}

        {/* Test Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h4 className="text-blue-400 font-semibold mb-2">Test Instructions:</h4>
          <ol className="text-slate-300 text-sm space-y-1">
            <li>1. First test storage bucket access</li>
            <li>2. Select a PDF, DOC, or DOCX file (under 5MB)</li>
            <li>3. Upload the file and verify success</li>
            <li>4. Test downloading the uploaded file</li>
            <li>5. Check browser console for detailed logs</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeUploadTest; 