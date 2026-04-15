import React from 'react';
import { Crown, CheckCircle, Zap } from 'lucide-react';
import { useSubscription, PLAN_LABELS } from '../hooks/useSubscription';
import { usePlanUsage } from '../hooks/usePlanUsage';
import { Link } from 'react-router-dom';

const ANNUAL_PRICES = [
  'price_1T07ECCVrhYYeZRkvwIjJw4S',
  'price_1T07EXCVrhYYeZRksH8u3rCl',
  'price_1T07F5CVrhYYeZRkj3cSujKL',
];

export function SubscriptionStatus() {
  const { isActive, loading, plan, subscription, limits } = useSubscription();
  const { usage, loading: usageLoading } = usePlanUsage();

  const isAnnual = subscription?.price_id && ANNUAL_PRICES.includes(subscription.price_id);
  const billingType = isAnnual ? 'Annual' : 'Monthly';

  if (loading || usageLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Crown className="h-5 w-5 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">Plan Status</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className={`flex items-center text-sm px-3 py-2 rounded-lg ${isActive ? 'text-green-700 bg-green-50' : 'text-gray-700 bg-gray-50'}`}>
          <CheckCircle className="h-4 w-4 mr-2" />
          <span className="font-medium">{PLAN_LABELS[plan]} {isActive ? `(${billingType})` : ''}</span>
        </div>

        {usage && (
          <div className="flex items-start text-sm bg-gray-50 px-3 py-2 rounded-lg">
            <Zap className="h-4 w-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-gray-700">
                {limits.isUnlimited ? (
                  <span className="font-medium">Unlimited lessons</span>
                ) : (
                  <span className="font-medium">
                    Lessons remaining: {limits.monthlyLimit ? limits.monthlyLimit - usage.monthlyCount : 'N/A'} / {limits.monthlyLimit}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">This month</div>
            </div>
          </div>
        )}

        {!isActive && (
          <Link
            to="/pricing"
            className="block w-full text-center bg-[#4CAF50] hover:bg-[#45a049] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            View Plans
          </Link>
        )}
      </div>
    </div>
  );
}