import React, { useState, forwardRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, Check, X, Loader2 } from 'lucide-react';
import { validateCoupon, calculateDiscount, CouponValidationResult, DiscountCalculation } from '@/utils/couponUtils';
import { useToast } from '@/hooks/use-toast';

interface CouponInputProps {
  originalPrice: number;
  planType: string;
  onCouponApplied: (discount: DiscountCalculation | null) => void;
  appliedCoupon?: string | null;
  externalCouponCode?: string;
  onExternalCouponCodeChange?: () => void;
}

const CouponInput = forwardRef<HTMLInputElement, CouponInputProps>(({
  originalPrice,
  planType,
  onCouponApplied,
  appliedCoupon,
  externalCouponCode,
  onExternalCouponCodeChange
}, ref) => {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<CouponValidationResult | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCalculation | null>(null);
  const { toast } = useToast();

  // Handle external coupon code changes
  useEffect(() => {
    if (externalCouponCode && externalCouponCode !== couponCode) {
      setCouponCode(externalCouponCode);
      if (onExternalCouponCodeChange) {
        onExternalCouponCodeChange();
      }
    }
  }, [externalCouponCode, couponCode, onExternalCouponCodeChange]);

  const handleApplyCoupon = async () => {
    console.log('🔍 handleApplyCoupon called with:', { couponCode, planType });
    
    if (!couponCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      console.log('🔍 Validating coupon:', couponCode.trim(), 'for plan:', planType);
      const result = await validateCoupon(couponCode.trim(), planType);
      console.log('🔍 Validation result:', result);
      
      if (!result) {
        toast({
          title: "Error",
          description: "Failed to validate coupon. Please try again.",
          variant: "destructive"
        });
        return;
      }

      setValidationResult(result);

      if (result.is_valid) {
        const discount = calculateDiscount(originalPrice, result.discount_type as 'percentage' | 'fixed', result.discount_value);
        setAppliedDiscount(discount);
        onCouponApplied(discount);
        
        toast({
          title: "Coupon Applied!",
          description: `${result.discount_type === 'percentage' ? result.discount_value + '%' : '₹' + result.discount_value} discount applied`,
        });
      } else {
        toast({
          title: "Invalid Coupon",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast({
        title: "Error",
        description: "Failed to validate coupon. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setValidationResult(null);
    setAppliedDiscount(null);
    onCouponApplied(null);
    
    toast({
      title: "Coupon Removed",
      description: "Discount has been removed",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon();
    }
  };

  return (
    <div className="space-y-4">
      {/* Coupon Input Section */}
      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
        <div className="flex items-center space-x-2 mb-3">
          <Tag className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-green-400">Have a coupon code?</span>
        </div>
        
        <div className="flex space-x-2">
          <Input
            ref={ref}
            type="text"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-slate-600/50 border-slate-500 text-white placeholder-slate-400"
            disabled={isValidating || !!appliedDiscount}
          />
          
          {appliedDiscount ? (
            <Button
              onClick={handleRemoveCoupon}
              variant="destructive"
              size="sm"
              className="px-4"
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          ) : (
            <Button
              onClick={handleApplyCoupon}
              disabled={isValidating || !couponCode.trim()}
              size="sm"
              className="px-4 bg-green-600 hover:bg-green-700"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Apply
            </Button>
          )}
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className={`mt-2 text-sm ${
            validationResult.is_valid ? 'text-green-400' : 'text-red-400'
          }`}>
            {validationResult.message}
          </div>
        )}
      </div>

      {/* Applied Discount Display */}
      {appliedDiscount && (
        <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-medium">
                Coupon Applied: {couponCode}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">You saved</div>
              <div className="text-lg font-bold text-green-400">
                ₹{appliedDiscount.discount_amount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Summary */}
      <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
        <div className="space-y-2">
          <div className="flex justify-between text-slate-300">
            <span>Original Price:</span>
            <span>₹{originalPrice}</span>
          </div>
          
          {appliedDiscount && (
            <div className="flex justify-between text-green-400">
              <span>Discount ({appliedDiscount.discount_type === 'percentage' ? appliedDiscount.discount_value + '%' : '₹' + appliedDiscount.discount_value}):</span>
              <span>-₹{appliedDiscount.discount_amount}</span>
            </div>
          )}
          
          <div className="border-t border-slate-600/50 pt-2">
            <div className="flex justify-between text-lg font-bold text-white">
              <span>Total Amount:</span>
              <span className="text-blue-400">
                ₹{appliedDiscount ? appliedDiscount.final_price : originalPrice}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

CouponInput.displayName = "CouponInput";

export default CouponInput;
