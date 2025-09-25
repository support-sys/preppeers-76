import React, { useState, useEffect } from 'react';
import { Copy, X, Tag, Clock } from 'lucide-react';
import { getActiveCoupons, copyToClipboard, formatDiscountText, formatExpiryText } from '@/utils/couponUtils';
import { Coupon } from '@/utils/couponUtils';

interface CouponBannerProps {
  onClose?: () => void;
}

const CouponBanner: React.FC<CouponBannerProps> = ({ onClose }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      console.log('🔍 CouponBanner: Fetching active coupons...');
      const activeCoupons = await getActiveCoupons();
      console.log('🔍 CouponBanner: Active coupons received:', activeCoupons);
      setCoupons(activeCoupons.slice(0, 3)); // Show max 3 coupons
      setLoading(false);
    } catch (error) {
      console.error('❌ CouponBanner: Error fetching coupons:', error);
      setLoading(false);
    }
  };

  const handleCopyCoupon = async (couponName: string) => {
    const success = await copyToClipboard(couponName);
    if (success) {
      setCopiedCoupon(couponName);
      setTimeout(() => setCopiedCoupon(null), 2000);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || loading) {
    return null;
  }

  if (coupons.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-black shadow-lg">
      <div className="container mx-auto px-4 py-3 relative">
        <div className={`flex items-center ${coupons.length === 1 ? 'justify-center' : 'justify-between'}`}>
          {/* Coupon display */}
          <div className={`flex items-center space-x-4 ${coupons.length === 1 ? 'justify-center' : 'flex-1 overflow-x-auto'}`}>
            <div className="flex items-center space-x-2 text-white">
              <Tag className="w-4 h-4" />
              <span className="text-sm font-semibold hidden sm:block">Special Offers:</span>
              <span className="text-sm font-semibold text-white hidden md:block">Redeem during payment</span>
            </div>
            
            <div className="flex space-x-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex items-center space-x-2 bg-gray-800 backdrop-blur-sm rounded-lg px-3 py-2 min-w-0 flex-shrink-0 border border-gray-700"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-white font-bold text-sm">{coupon.coupon_name}</span>
                    <span className="text-yellow-300 text-xs font-semibold">
                      {formatDiscountText(coupon)}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleCopyCoupon(coupon.coupon_name)}
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      copiedCoupon === coupon.coupon_name
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCoupon === coupon.coupon_name ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Info and close */}
          {coupons.length > 1 && (
            <div className="flex items-center space-x-3 ml-4">
              <div className="flex items-center space-x-1 text-white text-sm font-semibold hidden lg:block">
                <Clock className="w-3 h-3" />
                <span>Redeem during payment</span>
              </div>
              
              <button
                onClick={handleClose}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Close button for single coupon - positioned absolutely */}
          {coupons.length === 1 && (
            <button
              onClick={handleClose}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile: Show expiry info below */}
        <div className="mt-2 lg:hidden">
          <div className="flex items-center justify-between text-white text-sm font-semibold">
            <span>Expires Soon</span>
            <span>Redeem during payment</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponBanner;
