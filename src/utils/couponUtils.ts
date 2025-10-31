import { supabase } from '@/integrations/supabase/client';

export interface Coupon {
  id: string;
  coupon_name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  status: 'active' | 'stopped';
  expiring_on: string;
  plan_type: 'all' | 'essential' | 'professional';
  usage_limit: number | null;
  usage_count: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponValidationResult {
  is_valid: boolean;
  discount_type: string;
  discount_value: number;
  message: string;
}

export interface DiscountCalculation {
  original_price: number;
  discount_amount: number;
  final_price: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}

/**
 * Fetch all active coupons for display on main page
 */
export const getActiveCoupons = async (): Promise<Coupon[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('🔍 getActiveCoupons: Today date:', today);
    
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('status', 'active')
      .eq('visible', true) // Only show visible coupons
      .gte('expiring_on', today) // Not expired
      .order('created_at', { ascending: false });

    console.log('🔍 getActiveCoupons: Query result:', { data, error });

    if (error) {
      console.error('❌ Error fetching active coupons:', error);
      return [];
    }

    // Filter out coupons that have reached their usage limit
    const availableCoupons = (data || []).filter(coupon => {
      // If no usage_limit set, coupon is always available
      if (coupon.usage_limit === null || coupon.usage_limit === undefined) {
        return true;
      }
      // Only show if usage_count is below the limit
      return coupon.usage_count < coupon.usage_limit;
    });

    console.log('✅ getActiveCoupons: Returning', availableCoupons.length, 'available coupons (filtered from', data?.length || 0, 'total)');
    return availableCoupons;
  } catch (error) {
    console.error('❌ Error fetching active coupons:', error);
    return [];
  }
};

/**
 * Validate a coupon code for a specific plan and user
 */
export const validateCoupon = async (
  couponName: string,
  planType: string,
  userId?: string
): Promise<CouponValidationResult | null> => {
  try {
    console.log('🔍 validateCoupon called with:', { couponName, planType, userId });
    
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_coupon_name: couponName.trim().toUpperCase(),
      p_plan_type: planType,
      p_user_id: userId || null
    });

    console.log('🔍 validateCoupon RPC result:', { data, error });

    if (error) {
      console.error('❌ Error validating coupon:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return {
        is_valid: false,
        discount_type: '',
        discount_value: 0,
        message: 'Coupon not found'
      };
    }

    return data[0];
  } catch (error) {
    console.error('Error validating coupon:', error);
    return null;
  }
};

/**
 * Calculate discount amount and final price
 */
export const calculateDiscount = (
  originalPrice: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number
): DiscountCalculation => {
  let discountAmount = 0;

  if (discountType === 'percentage') {
    discountAmount = (originalPrice * discountValue) / 100;
  } else if (discountType === 'fixed') {
    discountAmount = discountValue;
  }

  // Ensure discount doesn't exceed original price
  discountAmount = Math.min(discountAmount, originalPrice);
  
  const finalPrice = Math.max(originalPrice - discountAmount, 0);

  return {
    original_price: originalPrice,
    discount_amount: Math.round(discountAmount),
    final_price: Math.round(finalPrice),
    discount_type: discountType,
    discount_value: discountValue
  };
};

/**
 * Format discount display text
 */
export const formatDiscountText = (coupon: Coupon): string => {
  if (coupon.discount_type === 'percentage') {
    return `${coupon.discount_value}% OFF`;
  } else {
    return `₹${coupon.discount_value} OFF`;
  }
};

/**
 * Check if coupon is applicable for a plan type
 */
export const isCouponApplicableForPlan = (
  coupon: Coupon,
  planType: string
): boolean => {
  return coupon.plan_type === 'all' || coupon.plan_type === planType;
};

/**
 * Get days until coupon expires
 */
export const getDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Format expiry text
 */
export const formatExpiryText = (expiryDate: string): string => {
  const days = getDaysUntilExpiry(expiryDate);
  
  if (days === 0) {
    return 'Expires today';
  } else if (days === 1) {
    return 'Expires tomorrow';
  } else if (days <= 7) {
    return `Expires in ${days} days`;
  } else {
    const expiry = new Date(expiryDate);
    return `Expires ${expiry.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short' 
    })}`;
  }
};

/**
 * Format plan type for display
 */
export const formatPlanType = (planType: string): string => {
  const planMap: { [key: string]: string } = {
    'all': 'All Plans',
    'essential': 'Essential Plan',
    'professional': 'Professional Plan'
  };
  return planMap[planType] || planType;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};
