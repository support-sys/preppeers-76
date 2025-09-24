import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { testFunnelTracking, cleanupTestData } from '@/utils/testFunnelTracking';
import { testFunnelTrackingWithAuth, createTestIntervieweeProfile } from '@/utils/testFunnelTrackingWithAuth';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, Loader2, User } from 'lucide-react';

const FunnelTest: React.FC = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setResults(null);
    
    try {
      console.log('🧪 Starting funnel tracking tests...');
      const success = await testFunnelTracking();
      
      setResults({
        success,
        message: success 
          ? 'All tests passed! ✅' 
          : 'Some tests failed. Check console for details.',
        details: { timestamp: new Date().toISOString() }
      });
    } catch (error) {
      setResults({
        success: false,
        message: `Test failed with error: ${error}`,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runAuthTests = async () => {
    if (!user?.id) {
      setResults({
        success: false,
        message: 'Please log in first to test authenticated funnel tracking'
      });
      return;
    }

    setIsRunning(true);
    setResults(null);
    
    try {
      console.log('🧪 Starting authenticated funnel tracking tests...');
      const success = await testFunnelTrackingWithAuth(user.id);
      
      setResults({
        success,
        message: success 
          ? 'Authenticated funnel tracking tests passed! ✅' 
          : 'Some authenticated tests failed. Check console for details.',
        details: { userId: user.id, timestamp: new Date().toISOString() }
      });
    } catch (error) {
      setResults({
        success: false,
        message: `Authenticated test failed with error: ${error}`,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    } finally {
      setIsRunning(false);
    }
  };

  const createTestProfile = async () => {
    if (!user?.id) {
      setResults({
        success: false,
        message: 'Please log in first to create test profile'
      });
      return;
    }

    setIsRunning(true);
    setResults(null);
    
    try {
      const result = await createTestIntervieweeProfile(user.id);
      
      setResults({
        success: result.success,
        message: result.success 
          ? 'Test interviewee profile created successfully! ✅' 
          : `Failed to create test profile: ${result.error}`,
        details: { userId: user.id, timestamp: new Date().toISOString() }
      });
    } catch (error) {
      setResults({
        success: false,
        message: `Profile creation failed with error: ${error}`,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    } finally {
      setIsRunning(false);
    }
  };

  const cleanup = async () => {
    setIsRunning(true);
    try {
      await cleanupTestData();
      setResults({
        success: true,
        message: 'Test data cleaned up successfully!'
      });
    } catch (error) {
      setResults({
        success: false,
        message: `Cleanup failed: ${error}`
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Funnel Tracking Test Suite
        </h1>
        
        <Card className="bg-slate-800/70 backdrop-blur-lg border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Test Implementation</CardTitle>
            <CardDescription className="text-slate-300">
              Run tests to verify the funnel tracking system is working correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={runTests} 
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  'Run Basic Tests'
                )}
              </Button>
              
              {user ? (
                <>
                  <Button 
                    onClick={createTestProfile} 
                    disabled={isRunning}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Create Test Profile
                  </Button>
                  
                  <Button 
                    onClick={runAuthTests} 
                    disabled={isRunning}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Test Auth Tracking
                  </Button>
                </>
              ) : (
                <div className="text-slate-400 text-sm">
                  Log in to test authenticated tracking
                </div>
              )}
              
              <Button 
                onClick={cleanup} 
                disabled={isRunning}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cleanup Test Data
              </Button>
            </div>
            
            {results && (
              <div className={`p-4 rounded-lg border ${
                results.success 
                  ? 'bg-green-900/30 border-green-500 text-green-300' 
                  : 'bg-red-900/30 border-red-500 text-red-300'
              }`}>
                <div className="flex items-center gap-2">
                  {results.success ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <span className="font-medium">{results.message}</span>
                </div>
                {results.details && (
                  <pre className="mt-2 text-sm opacity-75">
                    {JSON.stringify(results.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-800/70 backdrop-blur-lg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">What Gets Tested</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <ul className="space-y-2">
                <li>✅ Table structure validation</li>
                <li>✅ Data insertion testing</li>
                <li>✅ Analytics query testing</li>
                <li>✅ Constraint validation</li>
                <li>✅ Index performance testing</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/70 backdrop-blur-lg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <ol className="space-y-2">
                <li>1. Run the migration script</li>
                <li>2. Run these tests</li>
                <li>3. Test real booking flow</li>
                <li>4. Check analytics dashboard</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FunnelTest;
