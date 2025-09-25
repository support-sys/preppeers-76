import React, { useEffect, useState } from 'react';
import { Tag, Copy, Clock, Check } from 'lucide-react';
import { getActiveCoupons, copyToClipboard, formatDiscountText } from '@/utils/couponUtils';
import { Coupon } from '@/integrations/supabase/types';

interface AvailableCouponsProps {
  planType: string;
  onCouponSelect?: (couponName: string) => void;
}

const AvailableCoupons: React.FC<AvailableCouponsProps> = ({ 
  planType, 
  onCouponSelect 
}) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      console.log('🔍 AvailableCoupons: Fetching active coupons...');
      const activeCoupons = await getActiveCoupons();
      console.log('🔍 AvailableCoupons: Active coupons received:', activeCoupons);
      
      // Filter coupons that are applicable to the current plan
      const applicableCoupons = activeCoupons.filter(coupon => 
        coupon.plan_type === 'all' || coupon.plan_type === planType
      );
      
      setCoupons(applicableCoupons.slice(0, 3)); // Show max 3 coupons
      setLoading(false);
    } catch (error) {
      console.error('❌ AvailableCoupons: Error fetching coupons:', error);
      setLoading(false);
    }
  };

  const handleCopyCoupon = async (couponName: string) => {
    const success = await copyToClipboard(couponName);
    if (success) {
      setCopiedCoupon(couponName);
      setTimeout(() => setCopiedCoupon(null), 2000);
      
      // Notify parent component about coupon selection
      if (onCouponSelect) {
        onCouponSelect(couponName);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
        <div className="flex items-center space-x-2 mb-3">
          <Tag className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-yellow-400">Available Coupons</span>
        </div>
        <div className="text-sm text-slate-400">Loading coupons...</div>
      </div>
    );
  }

  if (coupons.length === 0) {
    return null; // Don't show anything if no coupons available
  }

  return (
    <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
      <div className="flex items-center space-x-2 mb-3">
        <Tag className="w-4 h-4 text-yellow-400" />
        <span className="text-sm font-medium text-yellow-400">Available Coupons</span>
      </div>
      
      <div className="space-y-2">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="flex items-center justify-between bg-slate-600/50 rounded-lg p-3 border border-slate-500/50"
          >
            <div className="flex items-center space-x-3">
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm">{coupon.coupon_name}</span>
                <span className="text-yellow-300 text-xs font-medium">
                  {formatDiscountText(coupon)}
                </span>
              </div>
              
              <div className="flex items-center space-x-1 text-slate-400 text-xs">
                <Clock className="w-3 h-3" />
                <span>Expires Soon</span>
              </div>
            </div>
            
            <button
              onClick={() => handleCopyCoupon(coupon.coupon_name)}
              className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                copiedCoupon === coupon.coupon_name
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-500 text-white hover:bg-slate-400'
              }`}
            >
              {copiedCoupon === coupon.coupon_name ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy & Use</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-slate-400 text-center">
        Copy any coupon above and paste it in the coupon code field below
      </div>
    </div>
  );
};

export default AvailableCoupons;
