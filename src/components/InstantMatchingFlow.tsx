import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, Users, ArrowRight } from "lucide-react";
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { useAuth } from '@/contexts/AuthContext';
import InstantMatchingButton from './InstantMatchingButton';
import MatchingLoader from './MatchingLoader';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InstantMatchingFlowProps {
  onStartMatching?: () => void;
}

const InstantMatchingFlow = ({ onStartMatching }: InstantMatchingFlowProps) => {
  const [isMatching, setIsMatching] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { paymentSession, hasSuccessfulPayment, markInterviewMatched, isLoading } = usePaymentStatus();
  const { user } = useAuth();
  const { toast } = useToast();

  // Show success animation when payment is detected
  useEffect(() => {
    if (hasSuccessfulPayment && !showSuccess) {
      setShowSuccess(true);
      toast({
        title: "Payment Successful! 🎉",
        description: "Your payment has been processed. You can now start instant matching!",
        duration: 5000,
      });
    }
  }, [hasSuccessfulPayment, showSuccess, toast]);


  const handleStartMatching = async () => {
    if (!paymentSession) return;

    setIsMatching(true);
    
    try {
      // Mark the payment session as matched
      const success = await markInterviewMatched(paymentSession.id);
      
      if (success) {
        onStartMatching?.();
        // The matching logic will be handled by the parent component
      } else {
        toast({
          title: "Error",
          description: "Failed to start matching. Please try again.",
          variant: "destructive",
        });
        setIsMatching(false);
      }
    } catch (error) {
      console.error('Error starting matching:', error);
      toast({
        title: "Error",
        description: "Failed to start matching. Please try again.",
        variant: "destructive",
      });
      setIsMatching(false);
    }
  };

  if (isMatching) {
    return <MatchingLoader />;
  }

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-600">Checking payment status...</span>
      </div>
    );
  }

  if (!hasSuccessfulPayment && !(paymentSession && paymentSession.payment_status === 'processing')) {
    return null;
  }

  // Show different UI based on payment status
  const isProcessing = paymentSession?.payment_status === 'processing';
  const isSuccessful = hasSuccessfulPayment;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className={`shadow-2xl backdrop-blur-lg border-2 ${isSuccessful ? 'bg-white/10 border-green-400/30' : 'bg-white/10 border-yellow-400/30'}`}>
        <CardHeader className="text-center">
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isSuccessful ? 'bg-green-500/20 backdrop-blur-sm' : 'bg-yellow-500/20 backdrop-blur-sm'}`}>
            {isSuccessful ? (
              <CheckCircle className="w-10 h-10 text-green-400" />
            ) : (
              <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
            )}
          </div>
          <CardTitle className={`text-3xl font-bold ${isSuccessful ? 'text-green-400' : 'text-yellow-400'}`}>
            {isSuccessful ? 'Payment Confirmed!' : 'Payment Processing...'}
          </CardTitle>
          <CardDescription className={`text-lg ${isSuccessful ? 'text-green-200' : 'text-yellow-200'}`}>
            {isSuccessful 
              ? `Your payment of ₹${paymentSession?.amount} has been processed successfully`
              : `Your payment of ₹${paymentSession?.amount} is being processed. This usually takes a few seconds.`
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className={`border-2 rounded-xl p-8 text-center backdrop-blur-sm ${isSuccessful ? 'bg-white/5 border-blue-400/30' : 'bg-white/5 border-orange-400/30'}`}>
            <Users className={`w-16 h-16 mx-auto mb-6 ${isSuccessful ? 'text-blue-400' : 'text-orange-400'}`} />
            <h3 className={`text-2xl font-bold mb-3 ${isSuccessful ? 'text-blue-400' : 'text-orange-400'}`}>
              {isSuccessful ? 'Ready for Instant Matching!' : 'Almost Ready!'}
            </h3>
            <p className={`mb-6 text-lg ${isSuccessful ? 'text-blue-200' : 'text-orange-200'}`}>
              {isSuccessful 
                ? "We'll instantly match you with the perfect interviewer based on your skills and requirements."
                : "Your payment is being processed. Once confirmed, we'll start matching you with the perfect interviewer!"
              }
            </p>
            
            {isSuccessful ? (
              <InstantMatchingButton 
                onStartMatching={handleStartMatching}
                isLoading={isMatching}
              />
            ) : (
              <div className="flex items-center justify-center space-x-3 text-orange-300">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-base font-medium">Processing payment...</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-all duration-300">
              <div className={`font-bold text-lg mb-2 ${isSuccessful ? 'text-green-400' : 'text-yellow-400'}`}>
                {isSuccessful ? '✓ Payment Confirmed' : '⏳ Payment Processing'}
              </div>
              <div className="text-sm text-slate-300">
                {isSuccessful ? 'Transaction completed' : 'Almost there...'}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-all duration-300">
              <div className={`font-bold text-lg mb-2 ${isSuccessful ? 'text-blue-400' : 'text-gray-500'}`}>
                {isSuccessful ? '⚡ Instant Matching' : '⚡ Ready to Match'}
              </div>
              <div className="text-sm text-slate-300">
                {isSuccessful ? 'Find your interviewer now' : 'Waiting for payment'}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-all duration-300">
              <div className={`font-bold text-lg mb-2 ${isSuccessful ? 'text-purple-400' : 'text-gray-500'}`}>
                🎯 Perfect Match
              </div>
              <div className="text-sm text-slate-300">Based on your skills</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstantMatchingFlow;