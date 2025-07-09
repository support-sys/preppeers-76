import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, Users, ArrowRight } from "lucide-react";
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { useAuth } from '@/contexts/AuthContext';
import InstantMatchingButton from './InstantMatchingButton';
import MatchingLoader from './MatchingLoader';
import { useToast } from '@/hooks/use-toast';

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

  if (!hasSuccessfulPayment) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            Payment Confirmed!
          </CardTitle>
          <CardDescription className="text-green-700 text-lg">
            Your payment of ₹{paymentSession?.amount} has been processed successfully
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-blue-800 mb-2">
              Ready for Instant Matching!
            </h3>
            <p className="text-blue-700 mb-4">
              We'll instantly match you with the perfect interviewer based on your skills and requirements.
            </p>
            
            <InstantMatchingButton 
              onStartMatching={handleStartMatching}
              isLoading={isMatching}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white/80 p-4 rounded-lg">
              <div className="text-green-600 font-semibold mb-1">✓ Payment Confirmed</div>
              <div className="text-sm text-slate-600">Transaction completed</div>
            </div>
            <div className="bg-white/80 p-4 rounded-lg">
              <div className="text-blue-600 font-semibold mb-1">⚡ Instant Matching</div>
              <div className="text-sm text-slate-600">Find your interviewer now</div>
            </div>
            <div className="bg-white/80 p-4 rounded-lg">
              <div className="text-purple-600 font-semibold mb-1">🎯 Perfect Match</div>
              <div className="text-sm text-slate-600">Based on your skills</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstantMatchingFlow;