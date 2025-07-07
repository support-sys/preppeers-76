
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentSession {
  id: string;
  user_id: string;
  candidate_data: any;
  amount: number;
  payment_status: string;
  interview_matched: boolean;
  created_at: string;
  cashfree_order_id?: string;
}

export const usePaymentStatusPolling = (sessionId: string | null) => {
  const [isPolling, setIsPolling] = useState(false);
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const { toast } = useToast();

  const checkPaymentStatus = useCallback(async () => {
    if (!sessionId) return null;

    try {
      const { data, error } = await supabase
        .from('payment_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching payment status:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in checkPaymentStatus:', error);
      return null;
    }
  }, [sessionId]);

  const startPolling = useCallback(async () => {
    if (!sessionId || isPolling) return;

    console.log('Starting payment status polling for session:', sessionId);
    setIsPolling(true);

    const pollInterval = setInterval(async () => {
      const session = await checkPaymentStatus();
      
      if (session) {
        setPaymentSession(session);
        
        if (session.payment_status === 'successful') {
          console.log('Payment confirmed as successful via polling');
          clearInterval(pollInterval);
          setIsPolling(false);
          
          toast({
            title: "Payment Confirmed!",
            description: "Your payment has been confirmed. You can now start matching with interviewers.",
          });
        } else if (session.payment_status === 'failed') {
          console.log('Payment confirmed as failed via polling');
          clearInterval(pollInterval);
          setIsPolling(false);
          
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed. Please try again.",
            variant: "destructive",
          });
        }
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      if (isPolling) {
        clearInterval(pollInterval);
        setIsPolling(false);
        console.log('Payment status polling stopped after timeout');
      }
    }, 300000); // 5 minutes

    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [sessionId, isPolling, checkPaymentStatus, toast]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  // Manual status check
  const manualStatusCheck = useCallback(async () => {
    const session = await checkPaymentStatus();
    if (session) {
      setPaymentSession(session);
      return session;
    }
    return null;
  }, [checkPaymentStatus]);

  return {
    isPolling,
    paymentSession,
    startPolling,
    stopPolling,
    manualStatusCheck
  };
};
