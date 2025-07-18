import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const StorageSetupHelper = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);

  const runDiagnosis = async () => {
    setDiagnosing(true);
    setDiagnosis(null);

    try {
      const results = {
        userAuthenticated: false,
        bucketExists: false,
        policiesExist: false,
        canList: false,
        canUpload: false,
        errors: [] as string[]
      };

      // Check 1: User Authentication
      if (!user) {
        results.errors.push("User not authenticated");
      } else {
        results.userAuthenticated = true;
        console.log("✅ User authenticated:", user.id);
      }

      // Check 2: Bucket Exists
      try {
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        const candidateResumesBucket = buckets?.find(b => b.id === 'candidate-resumes');
        
        if (bucketError) {
          results.errors.push(`Bucket list error: ${bucketError.message}`);
        } else if (!candidateResumesBucket) {
          results.errors.push("Bucket 'candidate-resumes' does not exist");
        } else {
          results.bucketExists = true;
          console.log("✅ Bucket exists:", candidateResumesBucket);
        }
      } catch (error: any) {
        results.errors.push(`Bucket check failed: ${error.message}`);
      }

      // Check 3: Can List Files
      try {
        const { data: files, error: listError } = await supabase.storage
          .from('candidate-resumes')
          .list('', { limit: 1 });

        if (listError) {
          results.errors.push(`List error: ${listError.message}`);
        } else {
          results.canList = true;
          console.log("✅ Can list files:", files);
        }
      } catch (error: any) {
        results.errors.push(`List test failed: ${error.message}`);
      }

      // Check 4: Can Upload (test with small file)
      if (results.userAuthenticated && results.bucketExists) {
        try {
          const testBlob = new Blob(['test'], { type: 'text/plain' });
          const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
          
          const { error: uploadError } = await supabase.storage
            .from('candidate-resumes')
            .upload(`test/${user.id}/test-${Date.now()}.txt`, testFile);

          if (uploadError) {
            results.errors.push(`Upload test failed: ${uploadError.message}`);
          } else {
            results.canUpload = true;
            console.log("✅ Can upload files");
            
            // Clean up test file
            await supabase.storage
              .from('candidate-resumes')
              .remove([`test/${user.id}/test-${Date.now()}.txt`]);
          }
        } catch (error: any) {
          results.errors.push(`Upload test failed: ${error.message}`);
        }
      }

      setDiagnosis(results);
      
      if (results.errors.length === 0) {
        toast({
          title: "Storage setup OK",
          description: "All storage checks passed successfully!",
        });
      } else {
        toast({
          title: "Storage issues found",
          description: `${results.errors.length} issue(s) detected. Check the details below.`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error("Diagnosis error:", error);
      setDiagnosis({
        errors: [`Diagnosis failed: ${error.message}`]
      });
    } finally {
      setDiagnosing(false);
    }
  };

  const getFixInstructions = () => {
    if (!diagnosis) return null;

    const fixes = [];

    if (!diagnosis.userAuthenticated) {
      fixes.push({
        title: "User Authentication",
        description: "Make sure you are logged in before testing uploads.",
        action: "Log in to your account"
      });
    }

    if (!diagnosis.bucketExists) {
      fixes.push({
        title: "Create Storage Bucket",
        description: "The 'candidate-resumes' bucket doesn't exist.",
        action: "Go to Supabase Dashboard → Storage → Create bucket named 'candidate-resumes' (set to Public)"
      });
    }

    if (diagnosis.bucketExists && !diagnosis.canList) {
      fixes.push({
        title: "Configure RLS Policies",
        description: "Bucket exists but policies are not configured correctly.",
        action: "Run the SQL policies from SUPABASE_STORAGE_SETUP.md"
      });
    }

    if (diagnosis.canList && !diagnosis.canUpload) {
      fixes.push({
        title: "Upload Permissions",
        description: "Can list files but cannot upload.",
        action: "Check RLS policies for INSERT permissions"
      });
    }

    return fixes;
  };

  if (!user) {
    return (
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Storage Setup Helper</CardTitle>
          <CardDescription className="text-slate-300">
            Please log in to diagnose storage issues.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Storage Setup Helper</CardTitle>
        <CardDescription className="text-slate-300">
          Diagnose and fix storage bucket issues automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button
          onClick={runDiagnosis}
          disabled={diagnosing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {diagnosing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Diagnosing...
            </>
          ) : (
            <>
              <Info className="w-4 h-4 mr-2" />
              Run Storage Diagnosis
            </>
          )}
        </Button>

        {diagnosis && (
          <div className="space-y-4">
            {/* Status Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                {diagnosis.userAuthenticated ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className="text-sm text-white">User Auth</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {diagnosis.bucketExists ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className="text-sm text-white">Bucket Exists</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {diagnosis.canList ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className="text-sm text-white">Can List</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {diagnosis.canUpload ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className="text-sm text-white">Can Upload</span>
              </div>
            </div>

            {/* Errors */}
            {diagnosis.errors.length > 0 && (
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  <strong>Issues Found:</strong>
                  <ul className="mt-2 space-y-1">
                    {diagnosis.errors.map((error, index) => (
                      <li key={index} className="text-sm">• {error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Fix Instructions */}
            {getFixInstructions() && (
              <div className="space-y-3">
                <h4 className="text-blue-400 font-semibold">Recommended Fixes:</h4>
                {getFixInstructions()?.map((fix, index) => (
                  <Alert key={index} className="bg-blue-500/10 border-blue-500/20">
                    <Info className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-400">
                      <strong>{fix.title}</strong>
                      <p className="mt-1 text-sm">{fix.description}</p>
                      <p className="mt-1 text-sm font-semibold">Action: {fix.action}</p>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Success Message */}
            {diagnosis.errors.length === 0 && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-400">
                  <strong>All checks passed!</strong> Your storage is configured correctly.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StorageSetupHelper; 