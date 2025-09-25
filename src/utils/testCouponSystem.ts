// Test utility for coupon system
import { getActiveCoupons, validateCoupon, calculateDiscount } from './couponUtils';
import { supabase } from '@/integrations/supabase/client';

export const testCouponSystem = async () => {
  console.log('🧪 Testing Coupon System...');
  
  try {
    // Test 1: Check if coupons table exists and is accessible
    console.log('1️⃣ Testing coupons table access...');
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select('*')
      .limit(5);
    
    if (couponsError) {
      console.error('❌ Error accessing coupons table:', couponsError);
      return false;
    }
    
    console.log('✅ Coupons table accessible, found', coupons?.length || 0, 'coupons');
    console.log('📋 Sample coupons:', coupons);
    
    // Test 2: Test getActiveCoupons function
    console.log('2️⃣ Testing getActiveCoupons function...');
    const activeCoupons = await getActiveCoupons();
    console.log('✅ Active coupons found:', activeCoupons.length);
    console.log('📋 Active coupons:', activeCoupons);
    
    // Test 3: Test validateCoupon function
    console.log('3️⃣ Testing validateCoupon function...');
    if (activeCoupons.length > 0) {
      const testCoupon = activeCoupons[0].coupon_name;
      const validation = await validateCoupon(testCoupon, 'professional');
      console.log('✅ Coupon validation result:', validation);
    }
    
    // Test 4: Test calculateDiscount function
    console.log('4️⃣ Testing calculateDiscount function...');
    const discountTest = calculateDiscount(999, 'percentage', 20);
    console.log('✅ Discount calculation:', discountTest);
    
    console.log('🎉 Coupon system test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Coupon system test failed:', error);
    return false;
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testCouponSystem = testCouponSystem;
}
