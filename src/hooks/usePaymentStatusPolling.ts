
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PaymentSession {
  id: string;
  user_id: string;
  candidate_data: any;
  amount: number;
  payment_status: string;
  interview_matched: boolean;
  created_at: string;
  cashfree_order_id?: string;
  selected_plan?: string | null;
  interview_duration?: number | null;
  plan_details?: any | null;
  interviewer_id?: string | null;
  selected_time_slot?: string | null;
  selected_date?: string | null;
  plan_duration?: number | null;
  match_score?: number | null;
  matched_interviewer?: any | null;
}

export const usePaymentStatusPolling = (sessionId: string | null) => {
  const [isPolling, setIsPolling] = useState(false);
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
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

  const handlePaymentStatusChange = useCallback((session: PaymentSession) => {
    setPaymentSession(session);
    
    if (session.payment_status === 'successful') {
      console.log('Payment confirmed as successful via real-time update');
      setIsPolling(false);
      
      toast({
        title: "Payment Confirmed!",
        description: "Your payment has been confirmed. You can now start matching with interviewers.",
      });
    } else if (session.payment_status === 'failed') {
      console.log('Payment confirmed as failed via real-time update');
      setIsPolling(false);
      
      toast({
        title: "Payment Failed",
        description: "Your payment could not be processed. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const startPolling = useCallback(async () => {
    if (!sessionId || isPolling) return;

    console.log('Starting real-time payment status monitoring for session:', sessionId);
    setIsPolling(true);

    // Get initial payment status
    const initialSession = await checkPaymentStatus();
    if (initialSession) {
      setPaymentSession(initialSession);
      
      // If already successful or failed, don't start monitoring
      if (initialSession.payment_status === 'successful' || initialSession.payment_status === 'failed') {
        handlePaymentStatusChange(initialSession);
        return;
      }
    }

    // Set up real-time subscription for immediate updates
    const channel = supabase
      .channel(`payment_session_${sessionId}_${Date.now()}`) // Add timestamp to ensure unique channel names
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payment_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Real-time payment status update received:', payload);
          const updatedSession = payload.new as PaymentSession;
          handlePaymentStatusChange(updatedSession);
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    // Fallback polling at much slower rate (every 15 seconds) as backup
    const pollInterval = setInterval(async () => {
      const session = await checkPaymentStatus();
      if (session) {
        setPaymentSession(session);
        
        if (session.payment_status === 'successful' || session.payment_status === 'failed') {
          handlePaymentStatusChange(session);
          clearInterval(pollInterval);
          // Clean up realtime channel when polling completes
          if (channel) {
            console.log('🧹 Cleaning up realtime channel after successful polling');
            supabase.removeChannel(channel);
            setRealtimeChannel(null);
          }
        }
      }
    }, 15000); // Increased from 10s to 15s to reduce load

    // Stop monitoring after 2 minutes (reduced from 3 minutes)
    const timeoutId = setTimeout(() => {
      console.log('🧹 Payment status monitoring timeout reached, cleaning up...');
      clearInterval(pollInterval);
      if (channel) {
        supabase.removeChannel(channel);
        setRealtimeChannel(null);
      }
      setIsPolling(false);
      console.log('Payment status monitoring stopped after timeout');
    }, 120000); // 2 minutes

    return () => {
      console.log('🧹 Cleaning up payment polling resources');
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
      if (channel) {
        supabase.removeChannel(channel);
        setRealtimeChannel(null);
      }
      setIsPolling(false);
    };
  }, [sessionId, isPolling, checkPaymentStatus, handlePaymentStatusChange]);

  const stopPolling = useCallback(() => {
    console.log('🧹 Manually stopping payment polling');
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      setRealtimeChannel(null);
    }
    setIsPolling(false);
  }, [realtimeChannel]);

  // Manual status check
  const manualStatusCheck = useCallback(async () => {
    const session = await checkPaymentStatus();
    if (session) {
      setPaymentSession(session);
      return session;
    }
    return null;
  }, [checkPaymentStatus]);

  // Cleanup effect - ensure channels are cleaned up when component unmounts
  useEffect(() => {
    return () => {
      if (realtimeChannel) {
        console.log('🧹 Component unmounting, cleaning up realtime channel');
        supabase.removeChannel(realtimeChannel);
        setRealtimeChannel(null);
      }
    };
  }, [realtimeChannel]);

  return {
    isPolling,
    paymentSession,
    startPolling,
    stopPolling,
    manualStatusCheck
  };
};
