import React, { useState, forwardRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, Check, X, Loader2, Plus } from 'lucide-react';
import { validateCoupon, calculateDiscount, CouponValidationResult, DiscountCalculation } from '@/utils/couponUtils';
import { useToast } from '@/hooks/use-toast';
import { AddOnService } from '@/services/addOnService';
import { AddOn } from '@/utils/addOnConfig';

interface CouponInputProps {
  originalPrice: number;
  planType: string;
  onCouponApplied: (discount: DiscountCalculation | null) => void;
  appliedCoupon?: string | null;
  externalCouponCode?: string;
  onExternalCouponCodeChange?: () => void;
  onAddOnsChange?: (addOns: AddOnSelection, totalPrice: number) => void;
}

interface AddOnSelection {
  [key: string]: boolean;
}

const CouponInput = forwardRef<HTMLInputElement, CouponInputProps>(({
  originalPrice,
  planType,
  onCouponApplied,
  appliedCoupon,
  externalCouponCode,
  onExternalCouponCodeChange,
  onAddOnsChange
}, ref) => {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<CouponValidationResult | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCalculation | null>(null);
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
  const [addOns, setAddOns] = useState<AddOnSelection>({});
  const [isLoadingAddOns, setIsLoadingAddOns] = useState(false);
  const { toast } = useToast();

  // Fetch available add-ons when plan type changes
  useEffect(() => {
    const fetchAddOns = async () => {
      if (!planType) return;
      
      setIsLoadingAddOns(true);
      try {
        console.log('🔍 Fetching add-ons for plan:', planType);
        const addOns = await AddOnService.getAddOnsForPlan(planType);
        console.log('✅ Available add-ons:', addOns);
        setAvailableAddOns(addOns);
        
        // Reset add-ons selection when plan changes
        setAddOns({});
      } catch (error) {
        console.error('❌ Error fetching add-ons:', error);
        toast({
          title: "Error",
          description: "Failed to load available add-ons",
          variant: "destructive",
        });
      } finally {
        setIsLoadingAddOns(false);
      }
    };

    fetchAddOns();
  }, [planType, toast]);

  // Handle external coupon code changes
  useEffect(() => {
    if (externalCouponCode && externalCouponCode !== couponCode) {
      setCouponCode(externalCouponCode);
      if (onExternalCouponCodeChange) {
        onExternalCouponCodeChange();
      }
    }
  }, [externalCouponCode, couponCode, onExternalCouponCodeChange]);

  // Calculate total add-ons price
  const totalAddOnPrice = availableAddOns.reduce((total, addon) => {
    return total + (addOns[addon.addon_key] ? parseFloat(addon.price) : 0);
  }, 0);

  // Handle add-ons changes
  useEffect(() => {
    if (onAddOnsChange) {
      onAddOnsChange(addOns, totalAddOnPrice);
    }
  }, [addOns, totalAddOnPrice, onAddOnsChange]);

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

  const handleAddOnToggle = (addonKey: string) => {
    setAddOns(prev => ({
      ...prev,
      [addonKey]: !prev[addonKey]
    }));
  };

  // Convert add-ons selection to backend format
  const convertToBackendFormat = (selectedAddOns: AddOnSelection) => {
    return availableAddOns
      .filter(addon => selectedAddOns[addon.addon_key])
      .map(addon => ({
        addon_key: addon.addon_key,
        name: addon.name,
        price: parseFloat(addon.price),
        quantity: 1,
        total: parseFloat(addon.price)
      }));
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

      {/* Add-ons Selection */}
      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
        <div className="flex items-center space-x-2 mb-4">
          <Plus className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-400">Add-ons (Optional)</span>
        </div>
        
        <div className="space-y-3">
          {isLoadingAddOns ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              <span className="ml-2 text-slate-300">Loading add-ons...</span>
            </div>
          ) : availableAddOns.length === 0 ? (
            <div className="text-center p-4 text-slate-400">
              No add-ons available for this plan
            </div>
          ) : (
            availableAddOns.map((addon) => (
              <div key={addon.id} className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg border border-slate-500/30">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleAddOnToggle(addon.addon_key)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      addOns[addon.addon_key] 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-slate-400 hover:border-blue-400'
                    }`}
                  >
                    {addOns[addon.addon_key] && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div>
                    <div className="text-white font-medium">{addon.name}</div>
                    <div className="text-sm text-slate-400">{addon.description}</div>
                  </div>
                </div>
                <div className="text-blue-400 font-semibold">+₹{addon.price}</div>
              </div>
            ))
          )}
        </div>

        {/* Add-ons Total */}
        {totalAddOnPrice > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-600/50">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Add-ons Total:</span>
              <span className="text-blue-400 font-semibold">+₹{totalAddOnPrice}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

CouponInput.displayName = "CouponInput";

export default CouponInput;