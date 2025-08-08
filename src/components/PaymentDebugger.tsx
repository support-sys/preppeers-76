import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PaymentDebugger = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPaymentSessions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment sessions:', error);
        setDebugInfo({ error: error.message });
      } else {
        console.log('Payment sessions:', data);
        setDebugInfo({ sessions: data });
      }
    } catch (error) {
      console.error('Error:', error);
      setDebugInfo({ error: 'Failed to fetch data' });
    } finally {
      setIsLoading(false);
    }
  };

  const testWebhook = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/payment-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: "ORDER_9bfae8b9-c434-4cde-85ea-697495caa979",
          payment_status: "successful", // Changed from "success" to "successful" to match database enum
          payment_id: "5114919750104"
        })
      });

      const result = await response.json();
      setDebugInfo({ webhookResponse: result, status: response.status });
    } catch (error) {
      console.error('Error testing webhook:', error);
      setDebugInfo({ error: 'Webhook test failed' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div className="p-4 text-red-500">Please log in to use debugger</div>;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Payment Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={fetchPaymentSessions} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Fetch Payment Sessions'}
          </Button>
          <Button onClick={testWebhook} disabled={isLoading} variant="outline">
            {isLoading ? 'Testing...' : 'Test Webhook'}
          </Button>
        </div>
        
        {debugInfo && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentDebugger; 