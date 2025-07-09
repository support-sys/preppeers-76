
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

      // If we have a recent session that's successful and not matched, use it
      if (recentSession && recentSession.payment_status === 'successful' && !recentSession.interview_matched) {
        setPaymentSession(recentSession);
      } 
      // If we have a recent session that's processing, also show it for debugging
      else if (recentSession && recentSession.payment_status === 'processing') {
        setPaymentSession(recentSession);
      } else {
        setPaymentSession(null);
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
             
             // Update local state for any recent session (successful or processing)
             if (updatedSession.user_id === user.id) {
               if (updatedSession.payment_status === 'successful' && !updatedSession.interview_matched) {
                 setPaymentSession(updatedSession);
               } else if (updatedSession.payment_status === 'processing') {
                 setPaymentSession(updatedSession);
               }
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
    hasSuccessfulPayment: !!paymentSession && paymentSession.payment_status === 'successful' && !paymentSession.interview_matched,
    markInterviewMatched,
    refetch: fetchPaymentStatus
  };
};
