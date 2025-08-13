
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentSession {
  id: string;
  user_id: string;
  candidate_data: any;
  amount: number;
  payment_status: string;
  interview_matched: boolean;
  created_at: string;
  updated_at: string;
  currency: string;
  cashfree_order_id: string | null;
  cashfree_payment_id: string | null;
}

export const usePaymentStatus = () => {
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasScheduledInterview, setHasScheduledInterview] = useState(false);
  const { user } = useAuth();

  const fetchPaymentStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // First, get the most recent payment session regardless of status
      const { data: recentSession, error: recentError } = await supabase
        .from('payment_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentError) {
        console.error('Error fetching recent payment session:', recentError);
        return;
      }

      // Always set the most recent session for proper state management
      if (recentSession) {
        setPaymentSession(recentSession);
        
        // Check if there's already a scheduled interview specifically for this payment session
        if (recentSession.payment_status === 'successful') {
          // Only check for interviews that were created after this payment session
          // to avoid automatically marking sessions as matched based on old interviews
          const { data: sessionSpecificInterview } = await supabase
            .from('interviews')
            .select('id')
            .eq('candidate_email', user.email)
            .eq('status', 'scheduled')
            .gte('created_at', recentSession.created_at)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          // Only update interview_matched if there's an interview created after this payment
          if (sessionSpecificInterview && !recentSession.interview_matched) {
            await supabase
              .from('payment_sessions')
              .update({ interview_matched: true })
              .eq('id', recentSession.id);
            
            // Update local state
            setPaymentSession({ ...recentSession, interview_matched: true });
            setHasScheduledInterview(true);
          } else {
            setHasScheduledInterview(!!sessionSpecificInterview);
          }
        } else {
          setHasScheduledInterview(false);
        }
      } else {
        setPaymentSession(null);
        setHasScheduledInterview(false);
      }
    } catch (error) {
      console.error('Error in fetchPaymentStatus:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markInterviewMatched = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('payment_sessions')
        .update({ interview_matched: true })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating interview matched status:', error);
        return false;
      }

      // Refresh payment status
      await fetchPaymentStatus();
      return true;
    } catch (error) {
      console.error('Error in markInterviewMatched:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchPaymentStatus();
    
    // Set up real-time subscription for payment status changes
    if (user) {
      const channel = supabase
        .channel('payment-status-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'payment_sessions',
            filter: `user_id=eq.${user.id}`
          },
           (payload) => {
             console.log('Payment status updated:', payload);
             const updatedSession = payload.new as PaymentSession;
             
              // Update local state for any recent session
              if (updatedSession.user_id === user.id) {
                setPaymentSession(updatedSession);
              }
           }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    paymentSession,
    isLoading,
    hasSuccessfulPayment: !!paymentSession && paymentSession.payment_status === 'successful',
    isInterviewAlreadyMatched: !!paymentSession && paymentSession.interview_matched && hasScheduledInterview,
    markInterviewMatched,
    refetch: fetchPaymentStatus
  };
};
