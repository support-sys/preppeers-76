import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentTestProps {
  onClose: () => void;
}

const PaymentTest = ({ onClose }: PaymentTestProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    sdk: boolean;
    credentials: boolean;
    webhook: boolean;
    database: boolean;
  }>({
    sdk: false,
    credentials: false,
    webhook: false,
    database: false,
  });

  const runTests = async () => {
    setIsLoading(true);
    setTestResults({
      sdk: false,
      credentials: false,
      webhook: false,
      database: false,
    });

    const results = { ...testResults };

    // Test 1: Check if Cashfree SDK is loaded
    try {
      if ((window as any).Cashfree) {
        results.sdk = true;
        console.log("✅ Cashfree SDK is loaded");
      } else {
        console.log("❌ Cashfree SDK is not loaded");
      }
    } catch (error) {
      console.log("❌ Error checking Cashfree SDK:", error);
    }

    // Test 2: Check if credentials are configured (by testing edge function)
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-session', {
        body: {
          amount: 100,
          currency: 'INR',
          customer_id: 'test@example.com',
          customer_name: 'Test User',
          customer_email: 'test@example.com',
          order_id: 'TEST_ORDER_123',
          return_url: 'https://example.com',
          notify_url: 'https://example.com/webhook',
          metadata: {}
        }
      });

      if (error) {
        console.log("❌ Credentials test failed:", error.message);
        if (error.message.includes('credentials not configured')) {
          console.log("💡 This is expected - you need to set CASHFREE_APP_ID and CASHFREE_SECRET_KEY");
        }
      } else {
        results.credentials = true;
        console.log("✅ Credentials are configured");
      }
    } catch (error) {
      console.log("❌ Error testing credentials:", error);
    }

    // Test 3: Check database connection
    try {
      const { data, error } = await supabase
        .from('payment_sessions')
        .select('count')
        .limit(1);

      if (error) {
        console.log("❌ Database test failed:", error.message);
      } else {
        results.database = true;
        console.log("✅ Database connection is working");
      }
    } catch (error) {
      console.log("❌ Error testing database:", error);
    }

    // Test 4: Check webhook endpoint
    try {
      const response = await fetch('https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/payment-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true })
      });

      if (response.ok) {
        results.webhook = true;
        console.log("✅ Webhook endpoint is accessible");
      } else {
        console.log("❌ Webhook endpoint returned status:", response.status);
      }
    } catch (error) {
      console.log("❌ Error testing webhook:", error);
    }

    setTestResults(results);
    setIsLoading(false);
  };

  const allTestsPassed = Object.values(testResults).every(result => result);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Payment System Test</CardTitle>
          <CardDescription>
            Test the payment system configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Results */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {testResults.sdk ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm">Cashfree SDK</span>
            </div>

            <div className="flex items-center gap-2">
              {testResults.credentials ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm">API Credentials</span>
            </div>

            <div className="flex items-center gap-2">
              {testResults.database ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm">Database Connection</span>
            </div>

            <div className="flex items-center gap-2">
              {testResults.webhook ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm">Webhook Endpoint</span>
            </div>
          </div>

          {/* Status Message */}
          {!isLoading && (
            <div className={`p-3 rounded-lg ${
              allTestsPassed 
                ? 'bg-green-500/10 border border-green-500/30' 
                : 'bg-yellow-500/10 border border-yellow-500/30'
            }`}>
              <div className="flex items-center gap-2">
                {allTestsPassed ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                <span className={`text-sm ${
                  allTestsPassed ? 'text-green-500' : 'text-yellow-500'
                }`}>
                  {allTestsPassed 
                    ? 'All tests passed! Payment system is ready.' 
                    : 'Some tests failed. Check the setup guide.'
                  }
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={runTests} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run Tests'
              )}
            </Button>
            <Button 
              onClick={onClose} 
              variant="outline"
            >
              Close
            </Button>
          </div>

          {/* Help Text */}
          {!allTestsPassed && !isLoading && (
            <div className="text-xs text-gray-500 space-y-1">
              <p>• SDK: Check if Cashfree script is loading</p>
              <p>• Credentials: Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY</p>
              <p>• Database: Verify Supabase connection</p>
              <p>• Webhook: Check if endpoint is accessible</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentTest; 