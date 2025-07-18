import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StorageSetupHelper from "@/components/StorageSetupHelper";
import ResumeUploadTest from "@/components/ResumeUploadTest";

const StorageTest = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Tech Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent">
          <div 
            className="w-full h-full"
            style={{
              background: 'radial-gradient(circle at 25% 25%, rgba(156, 146, 172, 0.1) 2px, transparent 2px)',
              backgroundSize: '60px 60px'
            }}
          />
        </div>
      </div>
      
      <Navigation />
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Storage <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Test</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Diagnose and test the resume upload functionality.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <StorageSetupHelper />
            <ResumeUploadTest />
          </div>
          
          <div className="mt-8 p-6 bg-white/5 rounded-lg border border-white/20">
            <h3 className="text-white font-semibold mb-4">Quick Fix Steps:</h3>
            <ol className="text-slate-300 space-y-2 text-sm">
              <li>1. <strong>Run Storage Diagnosis</strong> - Click the button to check your setup</li>
              <li>2. <strong>Create Bucket</strong> - If bucket doesn't exist, create 'candidate-resumes' in Supabase dashboard</li>
              <li>3. <strong>Apply Policies</strong> - Run the SQL policies from SUPABASE_STORAGE_SETUP.md</li>
              <li>4. <strong>Test Upload</strong> - Try uploading a test file</li>
              <li>5. <strong>Verify Download</strong> - Test downloading the uploaded file</li>
            </ol>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StorageTest; 