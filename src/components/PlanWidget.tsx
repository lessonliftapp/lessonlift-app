import React from 'react';
import { Crown, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UsageInfo, TrialInfo, PaidPlanInfo } from '../services/lessonService';

interface PlanWidgetProps {
  usageInfo: UsageInfo | null;
}

const PlanWidget: React.FC<PlanWidgetProps> = ({ usageInfo }) => {
  const navigate = useNavigate();

  if (!usageInfo) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-3">
          <div className="animate-pulse h-6 w-6 bg-gray-300 rounded"></div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Current Plan</p>
            <div className="animate-pulse h-6 w-24 bg-gray-300 rounded mt-1"></div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="animate-pulse h-4 w-full bg-gray-300 rounded"></div>
          <div className="animate-pulse h-4 w-3/4 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  const getPlanIcon = () => {
    if (usageInfo.isTrial) {
      return <Sparkles className="text-blue-500" size={24} />;
    }

    switch (usageInfo.plan) {
      case 'starter':
        return <Zap className="text-green-500" size={24} />;
      case 'standard':
        return <Crown className="text-blue-600" size={24} />;
      case 'pro':
        return <Crown className="text-yellow-500" size={24} />;
      default:
        return <Zap className="text-gray-500" size={24} />;
    }
  };

  const getPlanName = () => {
    if (usageInfo.isTrial) return 'Free Trial';
    return usageInfo.plan.charAt(0).toUpperCase() + usageInfo.plan.slice(1);
  };

  const getPlanColor = () => {
    if (usageInfo.isTrial) return 'from-blue-50 to-blue-100 border-blue-200';

    switch (usageInfo.plan) {
      case 'starter':
        return 'from-green-50 to-green-100 border-green-200';
      case 'standard':
        return 'from-blue-50 to-blue-100 border-blue-200';
      case 'pro':
        return 'from-yellow-50 to-yellow-100 border-yellow-200';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const shouldShowUpgrade = () => {
    if (usageInfo.isTrial) return true;
    return usageInfo.plan !== 'pro';
  };

  return (
    <div className={`bg-gradient-to-br ${getPlanColor()} border-2 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getPlanIcon()}
          <div>
            <p className="text-sm text-gray-600 font-medium">Current Plan</p>
            <h3 className="text-xl font-bold text-gray-900">{getPlanName()}</h3>
          </div>
        </div>
      </div>

      {usageInfo.isTrial ? (
        <div className="space-y-3 mb-5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Lessons Used:</span>
            <span className="font-semibold text-gray-900">
              {(usageInfo as TrialInfo).lessonsUsed} / 5
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Days Remaining:</span>
            <span className="font-semibold text-gray-900">
              {(usageInfo as TrialInfo).daysRemaining} days
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3 mb-5">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-700">Today:</span>
              <span className="font-semibold text-gray-900">
                {(usageInfo as PaidPlanInfo).dailyCount} / {(usageInfo as PaidPlanInfo).dailyMax}
              </span>
            </div>
            <div className="w-full bg-white/50 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-[#4CAF50] transition-all"
                style={{
                  width: `${((usageInfo as PaidPlanInfo).dailyCount / (usageInfo as PaidPlanInfo).dailyMax) * 100}%`,
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-700">This Month:</span>
              <span className="font-semibold text-gray-900">
                {(usageInfo as PaidPlanInfo).monthlyCount} / {(usageInfo as PaidPlanInfo).monthlyMax}
              </span>
            </div>
            <div className="w-full bg-white/50 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{
                  width: `${((usageInfo as PaidPlanInfo).monthlyCount / (usageInfo as PaidPlanInfo).monthlyMax) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {shouldShowUpgrade() && (
        <div className="pt-4 border-t border-gray-300">
          <button
            onClick={() => navigate('/pricing')}
            className="w-full bg-gradient-to-r from-[#4CAF50] to-[#45a049] hover:from-[#45a049] hover:to-[#3d8b40] text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Crown size={20} />
            <span>Upgrade Your Plan</span>
            <ArrowRight size={18} />
          </button>
          <p className="text-xs text-center text-gray-600 mt-2">
            {usageInfo.isTrial
              ? 'Unlock unlimited lessons and premium features'
              : 'Get more lessons and advanced features'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PlanWidget;
